'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User, Package, Heart, MapPin, Star, LogOut,
  Plus, Pencil, Trash2,
  Upload, Crown
} from 'lucide-react'
import { useToastStore } from '@/lib/store'
import { getLoyaltyTier, formatPrice, formatDate, getInitials } from '@/lib/utils'
import type { Profile, OrderWithItems, Address } from '@/lib/types'

type Tab = 'profile' | 'orders' | 'wishlist' | 'addresses' | 'loyalty'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const addressSchema = z.object({
  full_name: z.string().min(2, 'Required'),
  phone: z.string().min(10, 'Enter valid phone'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  pincode: z.string().length(6, 'Enter 6-digit pincode'),
  is_default: z.boolean().optional(),
})
type AddressForm = z.infer<typeof addressSchema>

export default function AccountPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [tab, setTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    fetch('/api/account/me')
      .then((r) => {
        if (r.status === 401) { window.location.href = '/login?redirect=/account'; return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setUser(data.user)
        setProfile(data.profile)
        setLoading(false)
      })
      .catch(() => { window.location.href = '/login?redirect=/account' })
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  )

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'orders', label: 'Orders', icon: <Package size={16} /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
    { id: 'loyalty', label: 'Rewards', icon: <Star size={16} /> },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">My Account</h1>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-52 shrink-0">
          <nav className="flex md:flex-col gap-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-none text-left transition-colors w-full ${
                  tab === t.id ? 'bg-[#0A0A0A] text-white' : 'text-gray-600 hover:bg-w-surface'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {tab === 'profile' && <ProfileTab user={user} profile={profile} setProfile={setProfile} addToast={addToast} />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'wishlist' && <WishlistTab />}
          {tab === 'addresses' && <AddressesTab addToast={addToast} />}
          {tab === 'loyalty' && <LoyaltyTab profile={profile} />}
        </div>
      </div>
    </div>
  )
}

// ── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ user, profile, setProfile, addToast }: {
  user: any; profile: Profile | null; setProfile: (p: Profile) => void; addToast: (m: string, t: any) => void
}) {
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' },
  })

  useEffect(() => {
    reset({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  }, [profile, reset])

  const onSave = async (data: ProfileForm) => {
    setSaving(true)
    try {
      const res = await fetch('/api/account/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: data.full_name, phone: data.phone || null }),
      })
      const json = await res.json()
      if (!res.ok) { addToast(json.error ?? 'Failed to update', 'error'); return }
      setProfile(json as Profile)
      addToast('Profile updated!', 'success')
    } catch {
      addToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { addToast(json.error ?? 'Upload failed', 'error'); return }
      setProfile(json.profile as Profile)
      addToast('Avatar updated!', 'success')
    } catch {
      addToast('Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-6">Profile</h2>
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={72} height={72} className="rounded-full object-cover w-18 h-18" />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-w-surface flex items-center justify-center text-xl font-serif text-gray-500">
                {getInitials(profile?.full_name ?? user.email)}
              </div>
            )}
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 text-sm border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Change Photo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4 max-w-sm">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Full Name</label>
            <input {...register('full_name')} className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors" />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Email</label>
            <input value={user.email} disabled className="w-full border border-gray-100 px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Phone (optional)</label>
            <input {...register('phone')} type="tel" placeholder="+91 98765 43210"
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-[#0A0A0A] text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Orders Tab ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Confirmed: 'bg-blue-50 text-blue-700',
  Processing: 'bg-yellow-50 text-yellow-700',
  Shipped: 'bg-purple-50 text-purple-700',
  Delivered: 'bg-green-50 text-green-700',
  Cancelled: 'bg-red-50 text-red-700',
  'Refund Requested': 'bg-orange-50 text-orange-700',
  Refunded: 'bg-w-surface text-gray-600',
  Pending: 'bg-w-surface text-gray-500',
}

const STATUS_STEPS = ['Confirmed', 'Processing', 'Shipped', 'Delivered']

function OrderDetailModal({ order, onClose }: { order: OrderWithItems; onClose: () => void }) {
  const statusIdx = STATUS_STEPS.indexOf(order.order_status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-w-surface max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Order</p>
            <p className="font-mono font-semibold">{order.order_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[order.order_status] ?? 'bg-w-surface text-gray-600'}`}>
              {order.order_status}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-xl leading-none">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress tracker */}
          {statusIdx >= 0 && !['Cancelled', 'Refund Requested', 'Refunded'].includes(order.order_status) && (
            <div>
              {/* Connector line behind circles */}
              <div className="relative h-1 bg-w-surface mx-3 mb-4">
                <div className="absolute left-0 top-0 h-full bg-[#0A0A0A] transition-all"
                  style={{ width: `${(statusIdx / (STATUS_STEPS.length - 1)) * 100}%` }} />
              </div>
              <div className="flex items-start justify-between">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex-1 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${i <= statusIdx ? 'bg-[#0A0A0A] text-white' : 'bg-w-surface text-gray-400'}`}>
                      {i < statusIdx ? '✓' : i + 1}
                    </div>
                    <p className={`text-[10px] text-center ${i === statusIdx ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking */}
          {order.tracking_number && (
            <div className="bg-purple-50 border border-purple-100 px-4 py-3 rounded">
              <p className="text-xs text-purple-500 uppercase tracking-wider mb-1">Tracking Number</p>
              <p className="font-mono text-sm font-semibold text-purple-800">{order.tracking_number}</p>
              <p className="text-xs text-purple-400 mt-0.5">Via {order.shipping_method} Shipping</p>
            </div>
          )}

          {/* Order meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Placed On</p>
              <p className="text-gray-800">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Shipping</p>
              <p className="text-gray-800">{order.shipping_method}</p>
            </div>
            {order.promo_code && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Promo Code</p>
                <p className="font-mono text-gray-800">{order.promo_code}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Items</p>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.product_image && (
                    <Image src={item.product_image} alt={item.product_name} width={52} height={52} className="object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-400">{item.size}{item.color_name ? ` · ${item.color_name}` : ''} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">₹{item.total_price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount_amount}</span></div>}
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>₹{order.shipping_cost}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2"><span>Total</span><span>₹{order.total}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<OrderWithItems | null>(null)

  useEffect(() => {
    fetch('/api/account/orders')
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
  if (!orders.length) return (
    <div className="text-center py-20">
      <Package size={40} className="text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-4">No orders yet</p>
      <Link href="/products" className="text-sm underline">Start shopping</Link>
    </div>
  )

  return (
    <div className="space-y-4">
      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
      <h2 className="font-serif text-2xl mb-6">My Orders</h2>
      {orders.map((order) => (
        <button key={order.id} onClick={() => setSelected(order)}
          className="w-full border border-gray-100 hover:border-gray-300 transition-colors text-left">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Order</p>
                <p className="font-mono text-sm font-semibold">{order.order_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                <p className="text-sm">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                <p className="text-sm font-semibold">₹{order.total}</p>
              </div>
              {order.tracking_number && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Tracking</p>
                  <p className="font-mono text-xs text-purple-700">{order.tracking_number}</p>
                </div>
              )}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[order.order_status] ?? 'bg-w-surface text-gray-600'}`}>
              {order.order_status}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Wishlist Tab ─────────────────────────────────────────────────────────────

function WishlistTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/wishlist')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const remove = async (id: string) => {
    const res = await fetch('/api/account/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) return
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) return <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
  if (!items.length) return (
    <div className="text-center py-20">
      <Heart size={40} className="text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-4">Your wishlist is empty</p>
      <Link href="/products" className="text-sm underline">Explore products</Link>
    </div>
  )

  return (
    <div>
      <h2 className="font-serif text-2xl mb-6">Wishlist</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => {
          const product = item.products
          const img = product?.product_images?.find((i: any) => i.is_primary)?.image_url
          const price = product?.price
          return (
            <div key={item.id} className="group relative">
              <Link href={`/products/${product?.slug}`}>
                <div className="relative aspect-[3/4] bg-w-surface overflow-hidden mb-2">
                  {img && <Image src={img} alt={product?.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <p className="text-sm font-medium truncate">{product?.name}</p>
                <p className="text-sm text-gray-500">{formatPrice(price)}</p>
              </Link>
              <button onClick={() => remove(item.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors shadow-sm">
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Addresses Tab ────────────────────────────────────────────────────────────

function AddressesTab({ addToast }: { addToast: (m: string, t: any) => void }) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) })

  useEffect(() => {
    fetch('/api/account/addresses')
      .then((r) => r.json())
      .then((data) => { setAddresses(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const openAdd = () => { setEditing(null); reset({}); setShowForm(true) }
  const openEdit = (a: Address) => {
    setEditing(a)
    reset({ full_name: a.full_name, phone: a.phone, line1: a.line1, line2: a.line2 ?? '', city: a.city, state: a.state, pincode: a.pincode, is_default: a.is_default })
    setShowForm(true)
  }

  const onSave = async (data: AddressForm) => {
    if (editing) {
      const res = await fetch('/api/account/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...data }),
      })
      const json = await res.json()
      if (!res.ok) { addToast(json.error ?? 'Failed', 'error'); return }
      setAddresses((prev) => prev.map((a) => a.id === editing.id ? json as Address : a))
      addToast('Address updated', 'success')
    } else {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { addToast(json.error ?? 'Failed', 'error'); return }
      setAddresses((prev) => [...prev, json as Address])
      addToast('Address added', 'success')
    }
    setShowForm(false)
  }

  const deleteAddr = async (id: string) => {
    const res = await fetch('/api/account/addresses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { addToast('Failed to delete address', 'error'); return }
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    addToast('Address deleted', 'success')
  }

  const setDefault = async (id: string) => {
    const res = await fetch('/api/account/addresses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { addToast('Failed to update default address', 'error'); return }
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
    addToast('Default address updated', 'success')
  }

  if (loading) return <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl">Saved Addresses</h2>
        {!showForm && (
          <button onClick={openAdd} className="flex items-center gap-2 text-sm border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors">
            <Plus size={14} /> Add New
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSave)} className="border border-gray-100 p-5 mb-6 space-y-3">
          <p className="font-medium text-sm mb-3">{editing ? 'Edit Address' : 'New Address'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Full Name</label>
              <input {...register('full_name')} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
              {errors.full_name && <p className="text-xs text-red-500 mt-0.5">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phone</label>
              <input {...register('phone')} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
              {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Address Line 1</label>
            <input {...register('line1')} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
            {errors.line1 && <p className="text-xs text-red-500 mt-0.5">{errors.line1.message}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Line 2 (optional)</label>
            <input {...register('line2')} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">City</label>
              <input {...register('city')} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
              {errors.city && <p className="text-xs text-red-500 mt-0.5">{errors.city.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">State</label>
              <input {...register('state')} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
              {errors.state && <p className="text-xs text-red-500 mt-0.5">{errors.state.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Pincode</label>
              <input {...register('pincode')} className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400" />
              {errors.pincode && <p className="text-xs text-red-500 mt-0.5">{errors.pincode.message}</p>}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" {...register('is_default')} className="rounded" /> Set as default
          </label>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="bg-[#0A0A0A] text-white px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {!addresses.length && !showForm ? (
        <p className="text-gray-500 text-sm py-8 text-center">No saved addresses</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`border p-4 ${addr.is_default ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm space-y-0.5">
                  {addr.is_default && <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Default</span>}
                  <p className="font-medium">{addr.full_name}</p>
                  <p className="text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p className="text-gray-500">{addr.city}, {addr.state} — {addr.pincode}</p>
                  <p className="text-gray-500">{addr.phone}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!addr.is_default && (
                    <button onClick={() => setDefault(addr.id)} className="text-xs text-gray-400 hover:text-gray-800 transition-colors underline">Set default</button>
                  )}
                  <button onClick={() => openEdit(addr)} className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => deleteAddr(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Loyalty Tab ──────────────────────────────────────────────────────────────

function LoyaltyTab({ profile }: { profile: Profile | null }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const points = profile?.loyalty_points ?? 0
  const tier = getLoyaltyTier(points)
  const nextTierPoints = tier === 'Bronze' ? 1000 : tier === 'Silver' ? 5000 : null
  const progress = nextTierPoints ? Math.min((points / nextTierPoints) * 100, 100) : 100

  const tierColors: Record<string, string> = {
    Bronze: 'text-amber-600',
    Silver: 'text-gray-500',
    Gold: 'text-yellow-500',
  }

  useEffect(() => {
    fetch('/api/account/loyalty')
      .then((r) => r.json())
      .then((data) => { setTransactions(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-6">Rewards & Loyalty</h2>

        <div className="bg-[#0A0A0A] text-white p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Tier</p>
              <div className="flex items-center gap-2">
                <Crown size={20} className={tierColors[tier]} />
                <span className={`text-2xl font-serif ${tierColors[tier]}`}>{tier}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Points Balance</p>
              <p className="text-3xl font-serif">{points.toLocaleString('en-IN')}</p>
            </div>
          </div>
          {nextTierPoints && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>{points.toLocaleString('en-IN')} pts</span>
                <span>{nextTierPoints.toLocaleString('en-IN')} pts for {tier === 'Bronze' ? 'Silver' : 'Gold'}</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#C9A84C] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-100 p-5 mb-6">
          <p className="text-sm font-medium mb-3">How to Earn Points</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between"><span>Every ₹1 spent</span><span className="font-medium text-gray-800">1 point</span></div>
            <div className="flex justify-between"><span>Redeem 100 points</span><span className="font-medium text-gray-800">= ₹10 off</span></div>
            <div className="flex justify-between"><span>Bronze tier</span><span>0–999 pts</span></div>
            <div className="flex justify-between"><span>Silver tier</span><span>1,000–4,999 pts</span></div>
            <div className="flex justify-between"><span>Gold tier</span><span>5,000+ pts</span></div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Points History</p>
          {loading ? (
            <div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
          ) : !transactions.length ? (
            <p className="text-sm text-gray-400 text-center py-6">No transactions yet. Place your first order to earn points!</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
