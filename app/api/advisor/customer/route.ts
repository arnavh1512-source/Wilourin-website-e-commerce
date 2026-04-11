import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Fetch public product context — published products + categories only
    const admin = createAdminClient()
    const [{ data: products }, { data: categories }] = await Promise.all([
      admin.from('products')
        .select('name, slug, price, sale_price, badge, description, categories(name)')
        .eq('status', 'Published')
        .order('name'),
      admin.from('categories').select('name, slug').order('name'),
    ])

    const productContext = (products ?? []).map((p: any) => ({
      name: p.name,
      price: p.sale_price ?? p.price,
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
      messages: messages.map((m: { role: string; content: string }) => ({
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
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
