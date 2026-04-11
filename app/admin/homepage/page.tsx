'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToastStore } from '@/lib/store'

export default function AdminHomepagePage() {
  const addToast = useToastStore((s) => s.addToast)
  const [settings, setSettings] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('homepage_settings').select('*').eq('id', 1).single(),
      supabase.from('products').select('id, name').eq('status', 'Published').order('name'),
      supabase.from('categories').select('id, name').order('name'),
    ]).then(([{ data: s }, { data: p }, { data: c }]) => {
      setSettings(s ?? {})
      setProducts(p ?? [])
      setCategories(c ?? [])
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('homepage_settings').upsert({
      id: 1,
      announcement_text: settings.announcement_text,
      hero_title: settings.hero_title,
      hero_subtitle: settings.hero_subtitle,
      hero_image_url: settings.hero_image_url,
      featured_product_ids: settings.featured_product_ids,
      featured_category_ids: settings.featured_category_ids,
      livestream_url: settings.livestream_url,
      livestream_active: settings.livestream_active,
    })
    setSaving(false)
    if (error) addToast(error.message, 'error')
    else addToast('Homepage updated!', 'success')
  }

  const toggleProduct = (id: string) => {
    const current: string[] = settings.featured_product_ids ?? []
    const next = current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id]
    setSettings((prev: any) => ({ ...prev, featured_product_ids: next }))
  }

  const toggleCategory = (id: string) => {
    const current: string[] = settings.featured_category_ids ?? []
    const next = current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id]
    setSettings((prev: any) => ({ ...prev, featured_category_ids: next }))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif">Homepage Settings</h1>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Announcement Bar</h2>
        <Field label="Announcement Text">
          <input value={settings.announcement_text ?? ''}
            onChange={(e) => setSettings((p: any) => ({ ...p, announcement_text: e.target.value }))}
            placeholder="FREE SHIPPING on orders above ₹999"
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </Field>
      </div>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Hero Section</h2>
        <Field label="Hero Title">
          <input value={settings.hero_title ?? ''}
            onChange={(e) => setSettings((p: any) => ({ ...p, hero_title: e.target.value }))}
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </Field>
        <Field label="Hero Subtitle">
          <input value={settings.hero_subtitle ?? ''}
            onChange={(e) => setSettings((p: any) => ({ ...p, hero_subtitle: e.target.value }))}
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
        </Field>
        <Field label="Hero Image URL">
          <input value={settings.hero_image_url ?? ''}
            onChange={(e) => setSettings((p: any) => ({ ...p, hero_image_url: e.target.value }))}
            placeholder="https://..."
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 font-mono text-xs" />
        </Field>
      </div>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Featured Products</h2>
        <p className="text-xs text-gray-400">Select products to feature on the homepage</p>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {products.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-gray-50">
              <input type="checkbox"
                checked={(settings.featured_product_ids ?? []).includes(p.id)}
                onChange={() => toggleProduct(p.id)} />
              {p.name}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Featured Categories</h2>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-gray-50">
              <input type="checkbox"
                checked={(settings.featured_category_ids ?? []).includes(c.id)}
                onChange={() => toggleCategory(c.id)} />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Livestream</h2>
        <Field label="Livestream URL">
          <input value={settings.livestream_url ?? ''}
            onChange={(e) => setSettings((p: any) => ({ ...p, livestream_url: e.target.value }))}
            placeholder="YouTube/Instagram embed URL"
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 font-mono text-xs" />
        </Field>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox"
            checked={settings.livestream_active ?? false}
            onChange={(e) => setSettings((p: any) => ({ ...p, livestream_active: e.target.checked })) } />
          Show livestream section on homepage
        </label>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="bg-[#0A0A0A] text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Homepage Settings'}
      </button>
    </div>
  )
}
