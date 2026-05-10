'use client'

import { useEffect, useState } from 'react'
import { Search, Crown } from 'lucide-react'
import { formatDate, getLoyaltyTier } from '@/lib/utils'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/customers')
        const data = await res.json()
        setCustomers(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('[Customers] load threw:', err)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const filtered = customers.filter((c) =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  const tierColors: Record<string, string> = {
    Bronze: 'text-amber-600',
    Silver: 'text-gray-500',
    Gold: 'text-yellow-500',
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-serif">Customers</h1>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…"
          className="w-full border border-gray-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-gray-400" />
      </div>

      <div className="bg-white border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Tier</th>
                <th className="text-right px-4 py-3">Orders</th>
                <th className="text-right px-4 py-3">Total Spent</th>
                <th className="text-right px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const tier = getLoyaltyTier(c.loyalty_points ?? 0)
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Crown size={12} className={tierColors[tier]} />
                        <span className={`text-xs font-medium ${tierColors[tier]}`}>{tier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{(c.loyalty_points ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                )
              })}
              {!filtered.length && <tr><td colSpan={6} className="text-center text-gray-400 py-12">No customers found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
