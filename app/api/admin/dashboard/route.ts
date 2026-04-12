import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    { data: paidOrders },
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { data: allOrders },
    { data: customers },
    { data: lowStock },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('total').eq('payment_status', 'Paid'),
    supabase.from('orders').select('total, id').eq('payment_status', 'Paid').gte('created_at', firstOfMonth),
    supabase.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfLastMonth).lt('created_at', firstOfMonth),
    supabase.from('orders').select('order_status'),
    supabase.from('profiles').select('id'),
    supabase.from('product_variants').select('product_id, size, stock_qty, products(name)').lt('stock_qty', 5).gt('stock_qty', 0),
    supabase.from('orders').select('*, order_items(product_name, quantity)').order('created_at', { ascending: false }).limit(5),
  ])

  const totalRevenue = (paidOrders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0)
  const thisMonthRevenue = (thisMonthOrders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0)
  const lastMonthRevenue = (lastMonthOrders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0)

  const statusCounts: Record<string, number> = {}
  for (const o of allOrders ?? []) {
    statusCounts[(o as any).order_status] = (statusCounts[(o as any).order_status] ?? 0) + 1
  }

  return NextResponse.json({
    totalRevenue: Math.round(totalRevenue),
    thisMonthRevenue: Math.round(thisMonthRevenue),
    lastMonthRevenue: Math.round(lastMonthRevenue),
    totalOrders: (allOrders ?? []).length,
    thisMonthOrders: (thisMonthOrders ?? []).length,
    totalCustomers: (customers ?? []).length,
    pendingOrders: statusCounts['Confirmed'] ?? 0,
    lowStockCount: (lowStock ?? []).length,
    recentOrders: recentOrders ?? [],
    lowStockItems: (lowStock ?? []).slice(0, 5).map((v: any) => ({
      product: (v.products as any)?.name ?? 'Unknown',
      size: v.size,
      qty: v.stock_qty,
    })),
    ordersByStatus: statusCounts,
  })
}
