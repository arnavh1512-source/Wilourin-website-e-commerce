'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye } from 'lucide-react'
import { useToastStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'

interface ViewedProduct {
  product_id: string
  name: string
  slug: string
  views: number
  last_viewed: string
}

export default function AdminRecentlyViewedPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [products, setProducts] = useState<ViewedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterFrom) params.set('from', filterFrom)
    if (filterTo) params.set('to', filterTo)
    try {
      const res = await fetch('/api/admin/recently-viewed?' + params.toString())
      if (!res.ok) { addToast('Failed to load data', 'error'); return }
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch { addToast('Failed to load data', 'error') }
    finally { setLoading(false) }
  }, [filterFrom, filterTo, addToast])

  useEffect(() => { load() }, [load])

  const totalViews = products.reduce((sum, p) => sum + p.views, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Recently Viewed</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalViews} total views across {products.length} products</p>
        </div>
      </div>

      {/* Date filters */}
      <div className="bg-white border border-gray-100 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
            className="border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
            className="border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </div>
        <button onClick={load}
          className="bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">
          Apply
        </button>
        <button onClick={() => { setFilterFrom(''); setFilterTo('') }}
          className="text-xs text-gray-400 hover:text-gray-700 underline">Clear</button>
      </div>

      <div className="bg-white border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                <th className="text-left px-4 py-3">Rank</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Views</th>
                <th className="text-left px-4 py-3">Last Viewed</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.product_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer"
                      className="font-medium hover:underline">{p.name}</a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Eye size={13} className="text-gray-400" />
                      <span className="font-semibold">{p.views}</span>
                      <div className="h-1.5 bg-gray-100 rounded-full flex-1 max-w-[100px]">
                        <div className="h-1.5 bg-[#0A0A0A] rounded-full" style={{ width: `${Math.min(100, (p.views / (products[0]?.views || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.last_viewed)}</td>
                </tr>
              ))}
              {!products.length && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">No view data yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
