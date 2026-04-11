'use client'

import { useEffect, useState, useRef } from 'react'
import { Search, Printer, ChevronDown, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatPrice } from '@/lib/utils'

const STATUSES = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refund Requested', 'Refunded']

const statusColors: Record<string, string> = {
  Confirmed: 'bg-blue-50 text-blue-700',
  Processing: 'bg-yellow-50 text-yellow-700',
  Shipped: 'bg-purple-50 text-purple-700',
  Delivered: 'bg-green-50 text-green-700',
  Cancelled: 'bg-red-50 text-red-700',
  'Refund Requested': 'bg-orange-50 text-orange-700',
  Refunded: 'bg-gray-100 text-gray-600',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchOrders = async () => {
    const supabase = createClient()
    let q = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    if (statusFilter) q = q.eq('order_status', statusFilter)
    if (search) q = q.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`)
    const { data } = await q
    setOrders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [search, statusFilter])

  // Realtime new orders
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => [payload.new as any, ...prev])
        setNewOrderAlert(true)
        setTimeout(() => setNewOrderAlert(false), 5000)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateOrder = async (id: string, fields: Record<string, any>) => {
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('orders').update(fields).eq('id', id).select().single()
    setSaving(false)
    if (!error && data) {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, ...data } : o))
      setSelected((prev: any) => prev?.id === id ? { ...prev, ...data } : prev)
    }
  }

  const printInvoice = (order: any) => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>Invoice #${order.order_number}</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto}h1{font-size:24px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}.right{text-align:right}</style>
      </head><body>
      <h1>WILOURIN</h1>
      <p style="color:#666">Order Invoice</p>
      <hr/>
      <p><strong>Order:</strong> #${order.order_number}</p>
      <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Status:</strong> ${order.order_status}</p>
      <hr/>
      <table>
        <tr><th>Item</th><th>Size</th><th>Qty</th><th class="right">Price</th></tr>
        ${(order.order_items ?? []).map((i: any) => `
          <tr><td>${i.product_name}</td><td>${i.size}</td><td>${i.quantity}</td><td class="right">₹${i.total_price}</td></tr>
        `).join('')}
      </table>
      <hr/>
      <p class="right"><strong>Subtotal:</strong> ₹${order.subtotal}</p>
      ${order.discount_amount > 0 ? `<p class="right">Discount: -₹${order.discount_amount}</p>` : ''}
      ${order.points_redeemed > 0 ? `<p class="right">Points: -₹${Math.floor(order.points_redeemed / 10)}</p>` : ''}
      <p class="right">Shipping (${order.shipping_method}): ₹${order.shipping_cost}</p>
      <p class="right" style="font-size:18px"><strong>Total: ₹${order.total}</strong></p>
      </body></html>
    `)
    w.print()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Orders</h1>
        {newOrderAlert && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 text-sm animate-bounce-once">
            <Bell size={14} /> New order received!
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order or email…"
            className="w-full border border-gray-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-gray-400" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 px-4 py-2 text-sm outline-none focus:border-gray-400 bg-white">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-5">
        {/* Orders table */}
        <div className="flex-1 bg-white border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} onClick={() => setSelected(order)}
                      className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === order.id ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-4 py-3 font-mono font-medium">{order.order_number}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">{order.guest_email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.order_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">₹{order.total}</td>
                    </tr>
                  ))}
                  {!orders.length && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-12">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order detail panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-white border border-gray-100 p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
            <div className="flex items-center justify-between">
              <p className="font-mono font-semibold text-sm">{selected.order_number}</p>
              <button onClick={() => printInvoice(selected)} className="text-gray-400 hover:text-gray-800 transition-colors"><Printer size={16} /></button>
            </div>

            <div className="text-sm space-y-1 text-gray-500">
              <p>{formatDate(selected.created_at)}</p>
              {selected.guest_email && <p>{selected.guest_email}</p>}
            </div>

            {/* Items */}
            <div className="space-y-2">
              {selected.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate text-gray-700">{item.product_name} ({item.size}) ×{item.quantity}</span>
                  <span className="shrink-0 ml-2">₹{item.total_price}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{selected.subtotal}</span></div>
              {selected.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{selected.discount_amount}</span></div>}
              {selected.points_redeemed > 0 && <div className="flex justify-between text-blue-600"><span>Points</span><span>-₹{Math.floor(selected.points_redeemed / 10)}</span></div>}
              <div className="flex justify-between text-gray-500"><span>Shipping ({selected.shipping_method})</span><span>₹{selected.shipping_cost}</span></div>
              <div className="flex justify-between font-semibold pt-1 border-t border-gray-100"><span>Total</span><span>₹{selected.total}</span></div>
            </div>

            {/* Status update */}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-1.5">Order Status</label>
              <select value={selected.order_status}
                onChange={(e) => updateOrder(selected.id, { order_status: e.target.value })}
                disabled={saving}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white disabled:opacity-50">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Tracking number */}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-1.5">Tracking Number</label>
              <input defaultValue={selected.tracking_number ?? ''}
                onBlur={(e) => { if (e.target.value !== selected.tracking_number) updateOrder(selected.id, { tracking_number: e.target.value }) }}
                placeholder="Enter tracking number"
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>

            {/* Admin notes */}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-1.5">Admin Notes</label>
              <textarea defaultValue={selected.admin_notes ?? ''}
                onBlur={(e) => { if (e.target.value !== selected.admin_notes) updateOrder(selected.id, { admin_notes: e.target.value }) }}
                rows={3} placeholder="Internal notes…"
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
            </div>

            {saving && <p className="text-xs text-gray-400 text-center">Saving…</p>}
          </div>
        )}
      </div>
    </div>
  )
}
