'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, ShoppingBag, Package,
  Users, AlertTriangle, RefreshCw, ArrowRight
} from 'lucide-react'
import { createAdminClientBrowser } from '@/lib/supabase/admin-browser'
import { formatPrice, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalRevenue: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  totalOrders: number
  thisMonthOrders: number
  totalCustomers: number
  pendingOrders: number
  lowStockCount: number
  recentOrders: any[]
  lowStockItems: any[]
  ordersByStatus: Record<string, number>
  revenueByMonth: { month: string; revenue: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
    const admin = createAdminClientBrowser()
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    const [
      { data: paidOrders, error: e1 },
      { data: thisMonthOrders },
      { data: lastMonthOrders },
      { data: allOrders },
      { data: customers },
      { data: lowStock },
      { data: recentOrders },
    ] = await Promise.all([
      admin.from('orders').select('total').eq('payment_status', 'Paid'),
      admin.from('orders').select('total, id').eq('payment_status', 'Paid').gte('created_at', firstOfMonth),
      admin.from('orders').select('total').eq('payment_status', 'Paid').gte('created_at', firstOfLastMonth).lt('created_at', firstOfMonth),
      admin.from('orders').select('order_status'),
      admin.from('profiles').select('id'),
      admin.from('product_variants').select('product_id, size, stock_qty, products(name)').lt('stock_qty', 5).gt('stock_qty', 0),
      admin.from('orders').select('*, order_items(product_name, quantity)').order('created_at', { ascending: false }).limit(5),
    ])

    if (e1) console.error('[Admin Dashboard] DB error:', e1.message)

    const totalRevenue = (paidOrders ?? []).reduce((s, o) => s + Number(o.total), 0)
    const thisMonthRevenue = (thisMonthOrders ?? []).reduce((s, o) => s + Number(o.total), 0)
    const lastMonthRevenue = (lastMonthOrders ?? []).reduce((s, o) => s + Number(o.total), 0)

    const statusCounts: Record<string, number> = {}
    for (const o of allOrders ?? []) {
      statusCounts[o.order_status] = (statusCounts[o.order_status] ?? 0) + 1
    }

    // Last 6 months revenue
    const revenueByMonth: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-IN', { month: 'short' })
      revenueByMonth.push({ month: label, revenue: 0 })
    }
    // We'll just show static labels since we don't want another query
    const maxRev = Math.max(...revenueByMonth.map((m) => m.revenue), thisMonthRevenue, lastMonthRevenue, 1)

    setStats({
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
        product: v.products?.name ?? 'Unknown',
        size: v.size,
        qty: v.stock_qty,
      })),
      ordersByStatus: statusCounts,
      revenueByMonth,
    })
    setLoading(false)
    } catch (err) {
      console.error('[Admin Dashboard] load() threw:', err)
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const growth = stats && stats.lastMonthRevenue > 0
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
    : null
  const isGrowth = growth && Number(growth) >= 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  )

  if (!stats) return null

  const statusColors: Record<string, string> = {
    Confirmed: 'bg-blue-500',
    Processing: 'bg-yellow-500',
    Shipped: 'bg-purple-500',
    Delivered: 'bg-green-500',
    Cancelled: 'bg-red-500',
    'Refund Requested': 'bg-orange-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Dashboard</h1>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          sub={`This month: ₹${stats.thisMonthRevenue.toLocaleString('en-IN')}`}
          icon={<TrendingUp size={20} className="text-green-500" />}
          badge={growth ? { text: `${isGrowth ? '+' : ''}${growth}%`, positive: isGrowth } : undefined}
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders.toString()}
          sub={`This month: ${stats.thisMonthOrders}`}
          icon={<ShoppingBag size={20} className="text-blue-500" />}
        />
        <StatCard
          label="Customers"
          value={stats.totalCustomers.toString()}
          sub="Registered accounts"
          icon={<Users size={20} className="text-purple-500" />}
        />
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders.toString()}
          sub="Awaiting processing"
          icon={<Package size={20} className="text-orange-500" />}
          href="/admin/orders"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-gray-800 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-mono font-medium">{order.order_number}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)} · {order.order_items?.length ?? 0} item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[order.order_status] ?? 'bg-gray-400'}`}>
                    {order.order_status}
                  </span>
                  <span className="text-sm font-semibold">₹{order.total}</span>
                </div>
              </div>
            ))}
            {!stats.recentOrders.length && <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Orders by status */}
          <div className="bg-white border border-gray-100 p-5">
            <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500 mb-4">Orders by Status</h2>
            <div className="space-y-2.5">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status] ?? 'bg-gray-400'}`} />
                    <span className="text-gray-600">{status}</span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {!Object.keys(stats.ordersByStatus).length && <p className="text-sm text-gray-400">No orders yet</p>}
            </div>
          </div>

          {/* Low stock alert */}
          {stats.lowStockItems.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-orange-500" />
                <h2 className="font-medium text-sm text-orange-700">Low Stock Alert</h2>
              </div>
              <div className="space-y-2">
                {stats.lowStockItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate">{item.product} ({item.size})</span>
                    <span className="text-orange-600 font-semibold shrink-0 ml-2">{item.qty} left</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/products" className="text-xs text-orange-600 underline mt-3 block">Manage stock →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, badge, href }: {
  label: string; value: string; sub: string; icon: React.ReactNode
  badge?: { text: string; positive: boolean | null }; href?: string
}) {
  const content = (
    <div className="bg-white border border-gray-100 p-5 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-serif mb-1">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{sub}</p>
        {badge && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badge.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
