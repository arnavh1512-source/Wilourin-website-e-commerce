'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToastStore } from '@/lib/store'
import { slugify } from '@/lib/utils'

export default function AdminCategoriesPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', parent_id: '', image_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*, parent:parent_id(name)').order('name')
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', parent_id: '', image_url: '' })
    setShowForm(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', parent_id: c.parent_id ?? '', image_url: c.image_url ?? '' })
    setShowForm(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'product-images')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const { url } = await res.json()
    if (url) setForm((prev) => ({ ...prev, image_url: url }))
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.name) { addToast('Name is required', 'error'); return }
    setSaving(true)
    const supabase = createClient()
    const data = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      parent_id: form.parent_id || null,
      image_url: form.image_url || null,
    }
    if (editing) {
      await supabase.from('categories').update(data).eq('id', editing.id)
      addToast('Category updated', 'success')
    } else {
      await supabase.from('categories').insert(data)
      addToast('Category created', 'success')
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    addToast('Category deleted', 'success')
  }

  const parents = categories.filter((c) => !c.parent_id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Categories</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">
          <Plus size={14} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">{editing ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-800"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Parent Category</label>
              <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                <option value="">— Top Level —</option>
                {parents.filter((p) => p.id !== editing?.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-2">Category Image</label>
            <div className="flex items-center gap-4">
              {form.image_url && <Image src={form.image_url} alt="Category" width={64} height={64} className="object-cover" />}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#0A0A0A] text-white px-8 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-8 py-2.5 text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
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
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Parent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.image_url ? <Image src={c.image_url} alt={c.name} width={32} height={32} className="object-cover rounded" /> : <div className="w-8 h-8 bg-gray-100 rounded" />}
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400">{c.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{c.parent?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => deleteCategory(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!categories.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">No categories yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
