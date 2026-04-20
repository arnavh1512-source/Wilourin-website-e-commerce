'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download } from 'lucide-react'
import { useToastStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'

interface Subscriber {
  id: string
  email: string
  is_active: boolean
  subscribed_at: string
}

export default function AdminNewsletterPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/newsletter')
      if (!res.ok) { addToast('Failed to load subscribers', 'error'); return }
      const data = await res.json()
      setSubscribers(Array.isArray(data) ? data : [])
    } catch { addToast('Failed to load subscribers', 'error') }
    finally { setLoading(false) }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const toggleActive = async (sub: Subscriber) => {
    const res = await fetch('/api/admin/newsletter', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, is_active: !sub.is_active }),
    })
    if (!res.ok) { addToast('Update failed', 'error'); return }
    setSubscribers((prev) => prev.map((s) => s.id === sub.id ? { ...s, is_active: !s.is_active } : s))
    addToast(sub.is_active ? 'Subscriber deactivated' : 'Subscriber activated', 'success')
  }

  const exportCSV = () => {
    const active = subscribers.filter((s) => s.is_active)
    const csv = ['Email,Status,Subscribed At',
      ...subscribers.map((s) => `${s.email},${s.is_active ? 'Active' : 'Inactive'},${s.subscribed_at}`)
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast(`Exported ${active.length} active subscribers`, 'success')
  }

  const activeCount = subscribers.filter((s) => s.is_active).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} active · {subscribers.length} total
          </p>
        </div>
        <button onClick={exportCSV} disabled={!subscribers.length}
          className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: subscribers.length },
          { label: 'Active', value: activeCount },
          { label: 'Inactive', value: subscribers.length - activeCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 p-4 text-center">
            <p className="text-2xl font-serif">{value}</p>
            <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">{label}</p>
          </div>
        ))}
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
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Subscribed</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{s.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.subscribed_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(s)}
                      className="text-xs text-gray-400 hover:text-gray-800 underline">
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {!subscribers.length && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">No subscribers yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
