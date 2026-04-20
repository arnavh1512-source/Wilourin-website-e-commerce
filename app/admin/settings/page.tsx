'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { useToastStore } from '@/lib/store'

export default function AdminSettingsPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        setSettings(data ?? {})
      } catch {
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'product-images')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    if (!res.ok) { addToast('Logo upload failed', 'error'); setUploading(false); return }
    const { url } = await res.json()
    if (url) setSettings((prev: any) => ({ ...prev, logo_url: url }))
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: settings.store_name,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        address: settings.address,
        logo_url: settings.logo_url,
        currency: settings.currency,
        free_shipping_threshold: settings.free_shipping_threshold,
        standard_shipping_cost: settings.standard_shipping_cost,
        express_shipping_cost: settings.express_shipping_cost,
        instagram_url: settings.instagram_url,
      }),
    })
    setSaving(false)
    if (res.ok) addToast('Settings saved!', 'success')
    else addToast('Save failed', 'error')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((prev: any) => ({ ...prev, [key]: e.target.value }))

  const Field = ({ label, fieldKey, type = 'text', placeholder = '' }: { label: string; fieldKey: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input type={type} value={settings[fieldKey] ?? ''} onChange={set(fieldKey)} placeholder={placeholder}
        className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif">Store Settings</h1>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Store Info</h2>
        <Field label="Store Name" fieldKey="store_name" />
        <Field label="Contact Email" fieldKey="contact_email" type="email" />
        <Field label="Contact Phone" fieldKey="contact_phone" />
        <Field label="Address" fieldKey="address" />

        <div>
          <label className="text-xs text-gray-500 block mb-2">Logo</label>
          <div className="flex items-center gap-3">
            {settings.logo_url && <Image src={settings.logo_url} alt="Logo" width={80} height={40} className="h-10 object-contain w-auto" />}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Logo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Shipping & Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Free Shipping Threshold (₹)" fieldKey="free_shipping_threshold" type="number" />
          <Field label="Standard Shipping (₹)" fieldKey="standard_shipping_cost" type="number" />
          <Field label="Express Shipping (₹)" fieldKey="express_shipping_cost" type="number" />
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-medium text-sm uppercase tracking-widest text-gray-500">Social & Contact</h2>
        <Field label="Instagram URL" fieldKey="instagram_url" placeholder="https://instagram.com/wilourin" />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="bg-[#0A0A0A] text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
