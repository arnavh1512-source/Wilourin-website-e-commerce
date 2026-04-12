import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Auth check — admin only
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
    if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { messages } = await req.json()

    // ── Gather real store insights ─────────────────────────
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
      supabase.from('orders').select('total').eq('payment_status', 'Paid'),
      supabase.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfMonth),
      supabase.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfLastMonth).lt('created_at', firstOfMonth),
      supabase.from('product_variants').select('product_id, size, stock_qty, products(name)').lt('stock_qty', 5).gt('stock_qty', 0),
      supabase.from('orders').select('id').eq('order_status', 'Refund Requested'),
      supabase.from('orders').select('order_status'),
      supabase.from('products').select('id, name, status').eq('status', 'Published'),
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

    // ── Stream Claude response ─────────────────────────────
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

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    // Stream response back
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
