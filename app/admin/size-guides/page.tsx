'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useToastStore } from '@/lib/store'

interface MeasurementRow {
  size: string
  chest: string
  waist: string
  hips: string
  length: string
}

export default function AdminSizeGuidesPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [guides, setGuides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: '', category_id: '', unit: 'inches' })
  const [rows, setRows] = useState<MeasurementRow[]>([
    { size: 'S', chest: '', waist: '', hips: '', length: '' },
    { size: 'M', chest: '', waist: '', hips: '', length: '' },
    { size: 'L', chest: '', waist: '', hips: '', length: '' },
  ])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/size-guides')
      const data = await res.json()
      setGuides(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[SizeGuides] load threw:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', category_id: '', unit: 'inches' })
    setRows([
      { size: 'S', chest: '', waist: '', hips: '', length: '' },
      { size: 'M', chest: '', waist: '', hips: '', length: '' },
      { size: 'L', chest: '', waist: '', hips: '', length: '' },
    ])
    setShowForm(true)
  }

  const openEdit = (g: any) => {
    setEditing(g)
    setForm({ name: g.name, category_id: g.category_id ?? '', unit: g.unit ?? 'inches' })
    const tableData: MeasurementRow[] = g.measurements?.rows ?? []
    setRows(tableData.length ? tableData : [{ size: '', chest: '', waist: '', hips: '', length: '' }])
    setShowForm(true)
  }

  const updateRow = (i: number, key: keyof MeasurementRow, val: string) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }

  const handleSave = async () => {
    if (!form.name) { addToast('Name is required', 'error'); return }
    setSaving(true)
    const data = {
      name: form.name,
      category_id: form.category_id || null,
      unit: form.unit,
      measurements: { rows, columns: ['size', 'chest', 'waist', 'hips', 'length'] },
    }

    try {
      if (editing) {
        await fetch('/api/admin/size-guides', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...data }),
        })
        addToast('Size guide updated', 'success')
      } else {
        await fetch('/api/admin/size-guides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        addToast('Size guide created', 'success')
      }
      setShowForm(false)
      load()
    } catch (err) {
      addToast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteGuide = async (id: string) => {
    if (!confirm('Delete this size guide?')) return
    const res = await fetch(`/api/admin/size-guides?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGuides((prev) => prev.filter((g) => g.id !== id))
      addToast('Deleted', 'success')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Size Guides</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">
          <Plus size={14} /> Add Guide
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">{editing ? 'Edit Size Guide' : 'New Size Guide'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-800"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Guide Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Men's Tops" className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                <option value="inches">inches</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* Measurements table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">Measurements</label>
              <button onClick={() => setRows((p) => [...p, { size: '', chest: '', waist: '', hips: '', length: '' }])}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"><Plus size={12} /> Row</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-100">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400">
                    <th className="text-left px-3 py-2">Size</th>
                    <th className="text-left px-3 py-2">Chest</th>
                    <th className="text-left px-3 py-2">Waist</th>
                    <th className="text-left px-3 py-2">Hips</th>
                    <th className="text-left px-3 py-2">Length</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {(['size', 'chest', 'waist', 'hips', 'length'] as const).map((col) => (
                        <td key={col} className="px-1 py-1">
                          <input value={row[col]} onChange={(e) => updateRow(i, col, e.target.value)}
                            className="w-full border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400" />
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <button onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#0A0A0A] text-white px-8 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50">
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
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Unit</th>
                <th className="text-left px-4 py-3">Sizes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {guides.map((g) => (
                <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-gray-500">{g.categories?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{g.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{g.measurements?.rows?.length ?? 0} sizes</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(g)} className="p-1.5 text-gray-400 hover:text-gray-800"><Pencil size={14} /></button>
                      <button onClick={() => deleteGuide(g.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!guides.length && <tr><td colSpan={5} className="text-center text-gray-400 py-8">No size guides yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
