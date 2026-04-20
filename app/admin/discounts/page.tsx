'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Copy, Check } from 'lucide-react'
import { useToastStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'

const TYPES = ['percentage', 'flat', 'free_shipping']

export default function AdminDiscountsPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [codes, setCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '', min_order_amount: '',
    usage_limit: '', expiry_date: '', is_active: true,
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/discounts')
      const data = await res.json()
      setCodes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Discounts] load threw:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ code: '', type: 'percentage', value: '', min_order_amount: '', usage_limit: '', expiry_date: '', is_active: true })
    setShowForm(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({
      code: c.code, type: c.type, value: String(c.value ?? ''),
      min_order_amount: String(c.min_order_amount ?? ''), usage_limit: String(c.usage_limit ?? ''),
      expiry_date: c.expiry_date ? c.expiry_date.split('T')[0] : '', is_active: c.is_active,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.value) { addToast('Code and value are required', 'error'); return }
    setSaving(true)
    const data = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
      is_active: form.is_active,
    }

    try {
      if (editing) {
        const res = await fetch('/api/admin/discounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...data }),
        })
        if (!res.ok) { const e = await res.json().catch(() => ({})); addToast(e.error ?? 'Update failed', 'error'); return }
        addToast('Discount updated', 'success')
      } else {
        const res = await fetch('/api/admin/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) { const e = await res.json().catch(() => ({})); addToast(e.error ?? 'Create failed', 'error'); return }
        addToast('Discount created', 'success')
      }
      setShowForm(false)
      load()
    } catch {
      addToast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteCode = async (id: string) => {
    if (!confirm('Delete this discount code?')) return
    const res = await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCodes((prev) => prev.filter((c) => c.id !== id))
      addToast('Deleted', 'success')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/discounts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    if (!res.ok) { addToast('Failed to update status', 'error'); return }
    setCodes((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !current } : c))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Discount Codes</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">
          <Plus size={14} /> Add Code
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">{editing ? 'Edit Discount' : 'New Discount Code'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-800"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Code *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10" className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 font-mono uppercase" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Value {form.type === 'percentage' ? '(%)' : form.type === 'flat' ? '(₹)' : ''}</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                disabled={form.type === 'free_shipping'}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 disabled:opacity-50" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Min Order (₹)</label>
              <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Usage Limit</label>
              <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                placeholder="Unlimited" className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Expires At</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="is_active" className="text-sm text-gray-600">Active</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#0A0A0A] text-white px-8 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-8 py-2.5 text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Value</th>
                <th className="text-left px-4 py-3">Usage</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold">{c.code}</code>
                      <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-gray-800">
                        {copied === c.code ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500">{c.type}</td>
                  <td className="px-4 py-3">{c.type === 'percentage' ? `${c.value}%` : c.type === 'flat' ? `₹${c.value}` : 'Free'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.usage_count ?? 0}{c.usage_limit ? `/${c.usage_limit}` : ''}</td>
                  <td className="px-4 py-3 text-gray-500">{c.expiry_date ? formatDate(c.expiry_date) : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c.id, c.is_active)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${c.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-gray-800"><Pencil size={14} /></button>
                      <button onClick={() => deleteCode(c.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!codes.length && <tr><td colSpan={7} className="text-center text-gray-400 py-8">No discount codes yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
