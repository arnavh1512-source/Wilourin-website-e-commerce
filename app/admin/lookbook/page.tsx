'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, X } from 'lucide-react'
import { useToastStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'

interface Submission {
  id: string
  image_url: string
  handle: string | null
  caption: string | null
  created_at: string
}

export default function AdminLookbookPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Pending')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      const res = await fetch(`/api/admin/lookbook?${params.toString()}`)
      const data = await res.json()
      setSubmissions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Lookbook] load threw:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const update = async (id: string, status: string) => {
    const res = await fetch('/api/admin/lookbook', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      addToast(`Submission ${status.toLowerCase()}`, status === 'Approved' ? 'success' : 'info')
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-serif">Lookbook Submissions</h1>

      <div className="flex gap-2">
        {['Pending', 'Approved', 'Rejected'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-xs uppercase tracking-widest transition-colors border ${
              filter === s ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
      ) : !submissions.length ? (
        <div className="text-center py-16 text-gray-400">No {filter.toLowerCase()} submissions</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white border border-gray-100 overflow-hidden group">
              <div className="aspect-square relative">
                <Image src={sub.image_url} alt={sub.handle ?? 'submission'} fill className="object-cover" />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm">{sub.handle ?? 'Anonymous'}</p>
                {sub.caption && <p className="text-xs text-gray-400 truncate">{sub.caption}</p>}
                <p className="text-xs text-gray-300 mt-1">{formatDate(sub.created_at)}</p>
                {filter === 'Pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => update(sub.id, 'Approved')}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 py-1.5 text-xs hover:bg-green-100 transition-colors">
                      <Check size={12} /> Approve
                    </button>
                    <button onClick={() => update(sub.id, 'Rejected')}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-1.5 text-xs hover:bg-red-100 transition-colors">
                      <X size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
