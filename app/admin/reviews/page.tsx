'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, CheckCircle, Circle, Star } from 'lucide-react'
import { useToastStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'

interface AdminReview {
  id: string
  reviewer_name: string
  rating: number
  review_text: string | null
  size_purchased: string | null
  is_verified: boolean
  helpful_count: number
  created_at: string
  products: { id: string; name: string; slug: string } | null
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} fill={s <= value ? '#1B4332' : 'none'} stroke="#1B4332" strokeWidth={1.5} />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterRating) params.set('rating', filterRating)
    if (filterFrom) params.set('from', filterFrom)
    if (filterTo) params.set('to', filterTo)
    try {
      const res = await fetch('/api/admin/reviews?' + params.toString())
      if (!res.ok) { addToast('Failed to load reviews', 'error'); return }
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch { addToast('Failed to load reviews', 'error') }
    finally { setLoading(false) }
  }, [filterRating, filterFrom, filterTo, addToast])

  useEffect(() => { load() }, [load])

  const toggleVerified = async (review: AdminReview) => {
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: review.id, is_verified: !review.is_verified }),
    })
    if (!res.ok) { addToast('Update failed', 'error'); return }
    setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, is_verified: !r.is_verified } : r))
    addToast(review.is_verified ? 'Verification removed' : 'Marked as verified', 'success')
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { addToast('Delete failed', 'error'); return }
    setReviews((prev) => prev.filter((r) => r.id !== id))
    addToast('Review deleted', 'success')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Reviews</h1>
        <span className="text-sm text-gray-500">{reviews.length} reviews</span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Rating</label>
          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}
            className="border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
          </select>
        </div>
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
        <button onClick={() => { setFilterRating(''); setFilterFrom(''); setFilterTo('') }}
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
                <th className="text-left px-4 py-3">Reviewer</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Review</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Verified</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.reviewer_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{r.products?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Stars value={r.rating} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[240px]">
                    <p className="line-clamp-2">{r.review_text ?? <span className="italic text-gray-300">No text</span>}</p>
                    {r.size_purchased && <span className="text-gray-400 mt-0.5 block">Size: {r.size_purchased}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleVerified(r)}
                      className={`flex items-center gap-1 text-xs transition-colors ${r.is_verified ? 'text-green-600 hover:text-gray-400' : 'text-gray-300 hover:text-green-600'}`}
                      title={r.is_verified ? 'Remove verification' : 'Mark as verified'}>
                      {r.is_verified ? <CheckCircle size={16} /> : <Circle size={16} />}
                      <span>{r.is_verified ? 'Verified' : 'Unverified'}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteReview(r.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!reviews.length && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">No reviews found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
