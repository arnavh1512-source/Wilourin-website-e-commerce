'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Upload, X, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToastStore } from '@/lib/store'
import { slugify } from '@/lib/utils'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const BADGES = ['New Arrival', 'Bestseller', 'Sale', 'Low Stock', '']

export default function AdminProductsPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', slug: '', description: '', category_id: '', price: '', original_price: '',
    badge: '', status: 'Draft', meta_title: '', meta_description: '',
  })
  const [variants, setVariants] = useState<any[]>([])
  const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient()
        const [{ data: p }, { data: c }] = await Promise.all([
          supabase.from('products').select('*, categories(name), product_images(image_url, is_primary), product_variants(id, size, color_name, stock_qty)').order('created_at', { ascending: false }),
          supabase.from('categories').select('id, name').order('name'),
        ])
        setProducts(p ?? [])
        setCategories(c ?? [])
      } catch (err) {
        console.error('[Products] load threw:', err)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', category_id: '', price: '', original_price: '', badge: '', status: 'Draft', meta_title: '', meta_description: '' })
    setVariants([{ size: 'M', color_name: 'Black', stock_qty: 0 }])
    setImages([])
    setShowForm(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({
      name: p.name, slug: p.slug, description: p.description ?? '', category_id: p.category_id ?? '',
      price: String(p.price), original_price: String(p.original_price ?? ''), badge: p.badge ?? '',
      status: p.status, meta_title: p.meta_title ?? '', meta_description: p.meta_description ?? '',
    })
    setVariants(p.product_variants?.map((v: any) => ({ ...v })) ?? [])
    setImages(p.product_images?.map((i: any) => ({ url: i.image_url, isPrimary: i.is_primary })) ?? [])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'product-images')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const { url } = await res.json()
      if (url) setImages((prev) => [...prev, { url, isPrimary: prev.length === 0 }])
    }
    setUploading(false)
  }

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length && !next.some((i) => i.isPrimary)) next[0].isPrimary = true
      return next
    })
  }

  const setPrimary = (idx: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })))
  }

  const addVariant = () => setVariants((prev) => [...prev, { size: 'M', color_name: 'Black', stock_qty: 0 }])
  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx))
  const updateVariant = (idx: number, key: string, value: any) => setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [key]: value } : v))

  const handleSave = async () => {
    if (!form.name || !form.price) { addToast('Name and price are required', 'error'); return }
    setSaving(true)
    const supabase = createClient()

    const productData = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      category_id: form.category_id || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      badge: form.badge || null,
      status: form.status,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    }

    let productId = editing?.id
    if (editing) {
      await supabase.from('products').update(productData).eq('id', productId)
    } else {
      const { data, error } = await supabase.from('products').insert(productData).select('id').single()
      if (error) { addToast(error.message, 'error'); setSaving(false); return }
      productId = data.id
    }

    // Upsert images
    if (images.length) {
      if (editing) await supabase.from('product_images').delete().eq('product_id', productId)
      await supabase.from('product_images').insert(
        images.map((img, i) => ({ product_id: productId, image_url: img.url, is_primary: img.isPrimary, display_order: i }))
      )
    }

    // Upsert variants
    if (editing) await supabase.from('product_variants').delete().eq('product_id', productId)
    if (variants.length) {
      await supabase.from('product_variants').insert(
        variants.map((v) => ({
          product_id: productId,
          size: v.size,
          color_name: v.color_name,
          stock_qty: Number(v.stock_qty),
        }))
      )
    }

    setSaving(false)
    addToast(`Product ${editing ? 'updated' : 'created'}!`, 'success')
    setShowForm(false)

    // Refresh list
    const { data: refreshed } = await supabase
      .from('products')
      .select('*, categories(name), product_images(image_url, is_primary), product_variants(id, size, color_name, stock_qty)')
      .order('created_at', { ascending: false })
    setProducts(refreshed ?? [])
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    addToast('Product deleted', 'success')
  }

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Products</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">{editing ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-800"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Price (₹) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Original Price (₹) — shows crossed out</label>
              <input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Badge</label>
              <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                {BADGES.map((b) => <option key={b} value={b}>{b || '— None —'}</option>)}
              </select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Images</label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <Image src={img.url} alt="" width={80} height={80} className="object-cover border border-gray-200" />
                  {img.isPrimary && <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/70 text-white text-[9px] text-center py-0.5">Primary</div>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                    <button onClick={() => setPrimary(i)} className="text-white text-[10px] bg-blue-500 px-1.5 py-0.5 rounded">Set</button>
                    <button onClick={() => removeImage(i)} className="text-white"><X size={14} /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-20 h-20 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-50">
                <Upload size={16} />
                <span className="text-[10px]">{uploading ? 'Uploading' : 'Add'}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-gray-400">Variants</label>
              <button onClick={addVariant} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)}
                    className="border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400 bg-white">
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={v.color_name} onChange={(e) => updateVariant(i, 'color_name', e.target.value)}
                    placeholder="Color" className="flex-1 border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400" />
                  <input type="number" value={v.stock_qty} onChange={(e) => updateVariant(i, 'stock_qty', e.target.value)}
                    placeholder="Stock qty" className="w-24 border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400" />
                  <button onClick={() => removeVariant(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <details className="border border-gray-100 p-3">
            <summary className="text-xs uppercase tracking-widest text-gray-400 cursor-pointer">SEO (optional)</summary>
            <div className="pt-3 space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Meta Title</label>
                <input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Meta Description</label>
                <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  rows={2} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
              </div>
            </div>
          </details>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#0A0A0A] text-white px-8 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Product'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-8 py-2.5 text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
          className="w-full border border-gray-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-gray-400" />
      </div>

      {/* Products list */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Variants</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const img = p.product_images?.find((i: any) => i.is_primary)?.image_url
                const totalStock = (p.product_variants ?? []).reduce((s: number, v: any) => s + v.stock_qty, 0)
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <Image src={img} alt={p.name} width={40} height={40} className="object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100" />
                        )}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.categories?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">₹{p.price}</p>
                      {p.original_price && <p className="text-xs text-gray-400 line-through">₹{p.original_price}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'Published' ? 'bg-green-50 text-green-700' :
                        p.status === 'Draft' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.product_variants?.length ?? 0} vars · {totalStock} in stock</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!filtered.length && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-12">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
