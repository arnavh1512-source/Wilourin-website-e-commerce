import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })).min(1).max(50),
})

export async function POST(req: NextRequest) {
  // 20 requests per 15 minutes per IP
  const { allowed, retryAfterMs } = checkRateLimit(`adv-c:${getIP(req)}`, 20, 15 * 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  // Require authenticated session — route is unused on storefront but kept for future use
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    // Anthropic requires messages to start with a user turn
    const firstUserIdx = parsed.data.messages.findIndex((m) => m.role === 'user')
    if (firstUserIdx === -1) return NextResponse.json({ error: 'No user message' }, { status: 400 })
    const messages = parsed.data.messages.slice(firstUserIdx)

    // Fetch public product context — published products + categories only
    const admin = createAdminClient()
    const [{ data: products }, { data: categories }] = await Promise.all([
      admin.from('products')
        .select('name, slug, price, original_price, badge, description, categories(name)')
        .eq('status', 'Published')
        .order('name'),
      admin.from('categories').select('name, slug').order('name'),
    ])

    const productContext = (products ?? []).map((p: any) => ({
      name: p.name,
      price: p.price,
      original_price: p.original_price,
      badge: p.badge,
      category: p.categories?.name,
      description: p.description?.slice(0, 100),
    }))

    const systemPrompt = `You are Wil, a friendly and knowledgeable style advisor for Wilourin — a premium Indian streetwear brand from Ahmedabad. You help customers find the right products, styling advice, and answers about the brand.

AVAILABLE PRODUCTS:
${JSON.stringify(productContext, null, 2)}

CATEGORIES: ${(categories ?? []).map((c: any) => c.name).join(', ')}

Guidelines:
- Be warm, conversational, and fashion-forward
- Recommend specific products by name when relevant
- Give practical Indian fashion / weather context (Mumbai monsoon, Delhi winter, etc.)
- Keep answers concise — 2–4 sentences max unless a detailed answer is needed
- For sizing, recommend checking the Size Guide on each product page
- For orders/returns/payments, direct to the Account page or WhatsApp: wa.me/918140081461
- Never make up products not in the list above
- Use Indian rupees (₹) for prices`

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('[advisor/customer]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
