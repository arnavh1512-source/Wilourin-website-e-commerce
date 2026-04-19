import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

interface OrderTotal { total: number }
interface OrderStatus { order_status: string }
interface LowStockVariant {
  product_id: string
  size: string
  stock_qty: number
  products: { name: string } | null
}

export async function GET() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    { data: allPaidOrders },
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { data: allOrders },
    { count: totalCustomers },
    { data: lowStock },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('total').eq('payment_status', 'Paid').limit(10000),
    supabase.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfMonth).limit(10000),
    supabase.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfLastMonth).lt('created_at', firstOfMonth).limit(10000),
    supabase.from('orders').select('order_status').limit(10000),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('product_variants').select('product_id, size, stock_qty, products(name)').lt('stock_qty', 5).gt('stock_qty', 0).limit(100),
    supabase.from('orders').select('id, order_number, order_status, total, created_at, guest_email, order_items(product_name, quantity)').order('created_at', { ascending: false }).limit(5),
  ])

  const totalRevenue = (allPaidOrders as OrderTotal[] ?? []).reduce((s, o) => s + Number(o.total), 0)
  const thisMonthRevenue = (thisMonthOrders as OrderTotal[] ?? []).reduce((s, o) => s + Number(o.total), 0)
  const lastMonthRevenue = (lastMonthOrders as OrderTotal[] ?? []).reduce((s, o) => s + Number(o.total), 0)

  const statusCounts: Record<string, number> = {}
  for (const o of allOrders as OrderStatus[] ?? []) {
    statusCounts[o.order_status] = (statusCounts[o.order_status] ?? 0) + 1
  }

  return NextResponse.json({
    totalRevenue: Math.round(totalRevenue),
    thisMonthRevenue: Math.round(thisMonthRevenue),
    lastMonthRevenue: Math.round(lastMonthRevenue),
    totalOrders: (allOrders ?? []).length,
    thisMonthOrders: (thisMonthOrders ?? []).length,
    totalCustomers: totalCustomers ?? 0,
    pendingOrders: statusCounts['Pending'] ?? 0,
    lowStockCount: (lowStock ?? []).length,
    recentOrders: recentOrders ?? [],
    lowStockItems: ((lowStock ?? []) as unknown as LowStockVariant[]).slice(0, 5).map((v) => ({
      product: v.products?.name ?? 'Unknown',
      size: v.size,
      qty: v.stock_qty,
    })),
    ordersByStatus: statusCounts,
  })
}
