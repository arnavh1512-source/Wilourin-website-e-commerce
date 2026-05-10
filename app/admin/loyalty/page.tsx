'use client'

import { useEffect, useState } from 'react'
import { useToastStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'

export default function AdminLoyaltyPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [settings, setSettings] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/loyalty')
        if (!res.ok) return
        const data = await res.json()
        setSettings(data.settings)
        setTransactions(data.transactions ?? [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/loyalty', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loyalty_points_per_rupee: settings.loyalty_points_per_rupee }),
    })
    setSaving(false)
    if (res.ok) addToast('Loyalty settings saved', 'success')
    else addToast('Save failed', 'error')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif">Loyalty Program</h1>

      <div className="bg-white border border-gray-100 p-6 space-y-4 max-w-sm">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Settings</h2>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Points earned per ₹1 spent</label>
          <input type="number" step="0.1" value={settings?.loyalty_points_per_rupee ?? 1}
            onChange={(e) => setSettings((prev: any) => ({ ...prev, loyalty_points_per_rupee: Number(e.target.value) }))}
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </div>
        <div className="bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
          <p>Tiers: Bronze (0–999 pts), Silver (1,000–4,999 pts), Gold (5,000+ pts)</p>
          <p>Max redemption: 20% of order value</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-[#0A0A0A] text-white px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Recent Transactions</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 text-xs uppercase tracking-widest text-gray-400">
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Description</th>
              <th className="text-right px-4 py-3">Points</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{(tx.profiles as any)?.full_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === 'earned' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{tx.description}</td>
                <td className={`px-4 py-3 text-right font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(tx.created_at)}</td>
              </tr>
            ))}
            {!transactions.length && <tr><td colSpan={5} className="text-center text-gray-400 py-8">No transactions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
