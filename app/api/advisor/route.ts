import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })).min(1).max(50),
})

export async function POST(req: NextRequest) {
  // 30 requests per 15 minutes per IP (admin tool, generous limit)
  const { allowed, retryAfterMs } = checkRateLimit(`adv:${getIP(req)}`, 30, 15 * 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  try {
    // Auth check — use cookie-based client to verify session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin check — service role bypasses RLS reliably
    const admin = createAdminClient()
    const { data: adminRow } = await admin.from('admin_users').select('user_id').eq('user_id', user.id).single()
    if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    // Anthropic requires messages to start with a user turn
    const firstUserIdx = parsed.data.messages.findIndex((m) => m.role === 'user')
    if (firstUserIdx === -1) return NextResponse.json({ error: 'No user message' }, { status: 400 })
    const messages = parsed.data.messages.slice(firstUserIdx)

    // ── Gather real store insights (service role — sees everything) ──
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    const [
      { data: paidOrders },
      { data: thisMonthOrders },
      { data: lastMonthOrders },
      { data: lowStock },
      { data: refunds },
      { data: ordersByStatus },
      { data: products },
    ] = await Promise.all([
      admin.from('orders').select('total').eq('payment_status', 'Paid'),
      admin.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfMonth),
      admin.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfLastMonth).lt('created_at', firstOfMonth),
      admin.from('product_variants').select('product_id, size, stock_qty, products(name)').lt('stock_qty', 5).gt('stock_qty', 0),
      admin.from('orders').select('id').eq('order_status', 'Refund Requested'),
      admin.from('orders').select('order_status'),
      admin.from('products').select('id, name, status').eq('status', 'Published'),
    ])

    const totalRevenue = (paidOrders ?? []).reduce((s, o) => s + Number(o.total), 0)
    const thisMonthRevenue = (thisMonthOrders ?? []).reduce((s, o) => s + Number(o.total), 0)
    const lastMonthRevenue = (lastMonthOrders ?? []).reduce((s, o) => s + Number(o.total), 0)

    const statusCounts: Record<string, number> = {}
    for (const o of ordersByStatus ?? []) {
      statusCounts[o.order_status] = (statusCounts[o.order_status] ?? 0) + 1
    }

    const storeInsights = {
      totalRevenue: Math.round(totalRevenue),
      thisMonthRevenue: Math.round(thisMonthRevenue),
      lastMonthRevenue: Math.round(lastMonthRevenue),
      revenueGrowth: lastMonthRevenue > 0
        ? `${(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)}%`
        : 'N/A',
      totalOrders: (ordersByStatus ?? []).length,
      totalPublishedProducts: (products ?? []).length,
      lowStockVariants: (lowStock ?? []).map((v) => ({
        product: (v as { products?: { name?: string } }).products?.name ?? 'Unknown',
        size: v.size,
        qty: v.stock_qty,
      })),
      refundRequested: (refunds ?? []).length,
      ordersByStatus: statusCounts,
    }

    // ── Call Claude and return full response ──────────────
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are Wil, the AI business advisor for Wilourin — a premium Indian streetwear brand based in Ahmedabad. You have access to real-time store data.

CURRENT STORE INSIGHTS:
${JSON.stringify(storeInsights, null, 2)}

Your role:
- Analyse the data and give actionable, specific advice
- Identify trends, risks, and opportunities
- Suggest concrete actions (restock X, run a campaign for Y, etc.)
- Be direct and concise — this is an admin dashboard, not a chatbot
- Use Indian business context (INR, Indian market, festivals, etc.)
- If asked about something not in the data, say so clearly

Keep responses focused and under 300 words unless the user asks for detail.`

    let response: Awaited<ReturnType<typeof client.messages.create>>
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })
    } catch (aiErr) {
      console.error('[advisor] anthropic error:', aiErr)
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
    }

    try {
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('')
      return NextResponse.json({ message: text })
    } catch (parseErr) {
      console.error('[advisor] parse error:', parseErr, JSON.stringify(response.content))
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  } catch (err) {
    console.error('[advisor] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
