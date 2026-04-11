'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User, Package, Heart, MapPin, Star, LogOut,
  ChevronDown, ChevronUp, Plus, Pencil, Trash2,
  Upload, Copy, Check, Crown, Share2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore, useToastStore } from '@/lib/store'
import { getLoyaltyTier, formatPrice, formatDate, getInitials } from '@/lib/utils'
import type { Profile, Order, OrderWithItems, Address } from '@/lib/types'

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
  const router = useRouter()
  const { profile, setProfile } = useUserStore()
  const addToast = useToastStore((s) => s.addToast)
  const [tab, setTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/account'); return }
      setUser(user)
      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
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
        {/* Sidebar */}
        <aside className="md:w-52 shrink-0">
          <nav className="flex md:flex-col gap-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-none text-left transition-colors w-full ${
                  tab === t.id ? 'bg-[#0A0A0A] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'profile' && <ProfileTab user={user} profile={profile} setProfile={setProfile} addToast={addToast} />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'wishlist' && <WishlistTab />}
          {tab === 'addresses' && <AddressesTab addToast={addToast} />}
          {tab === 'loyalty' && <LoyaltyTab profile={profile} addToast={addToast} />}
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
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('profiles').update({ full_name: data.full_name, phone: data.phone || null } as any)
      .eq('id', user.id).select().single()
    setSaving(false)
    if (error) { addToast(error.message, 'error'); return }
    setProfile(updated as Profile)
    addToast('Profile updated!', 'success')
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (upErr) { addToast('Upload failed', 'error'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    const { data: updated, error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id).select().single()
    setUploading(false)
    if (error) { addToast(error.message, 'error'); return }
    setProfile(updated as Profile)
    addToast('Avatar updated!', 'success')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-6">Profile</h2>
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={72} height={72} className="rounded-full object-cover w-18 h-18" />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-gray-100 flex items-center justify-center text-xl font-serif text-gray-500">
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

function OrdersTab() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setOrders((data as OrderWithItems[]) ?? []); setLoading(false) })
    })
  }, [])

  const statusColor: Record<string, string> = {
    Confirmed: 'bg-blue-50 text-blue-700',
    Processing: 'bg-yellow-50 text-yellow-700',
    Shipped: 'bg-purple-50 text-purple-700',
    Delivered: 'bg-green-50 text-green-700',
    Cancelled: 'bg-red-50 text-red-700',
    'Refund Requested': 'bg-orange-50 text-orange-700',
    Refunded: 'bg-gray-100 text-gray-600',
  }

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
      <h2 className="font-serif text-2xl mb-6">My Orders</h2>
      {orders.map((order) => (
        <div key={order.id} className="border border-gray-100">
          <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-6">
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
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[order.order_status] ?? 'bg-gray-100 text-gray-600'}`}>
                {order.order_status}
              </span>
              {expanded === order.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
          </button>

          {expanded === order.id && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  {item.product_image && (
                    <Image src={item.product_image} alt={item.product_name} width={56} height={56} className="object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-400">{item.size} · {item.color_name} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">₹{item.total_price}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Shipping: {order.shipping_method}</span>
                {order.tracking_number && (
                  <span className="text-gray-500">Tracking: <span className="font-mono text-gray-800">{order.tracking_number}</span></span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Wishlist Tab ─────────────────────────────────────────────────────────────

function WishlistTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('wishlist')
        .select('*, products(id, name, slug, sale_price, price, product_images(image_url, is_primary))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setItems(data ?? []); setLoading(false) })
    })
  }, [])

  const remove = async (id: string) => {
    const supabase = createClient()
    await supabase.from('wishlist').delete().eq('id', id)
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
          const price = product?.sale_price ?? product?.price
          return (
            <div key={item.id} className="group relative">
              <Link href={`/products/${product?.slug}`}>
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden mb-2">
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
  const [userId, setUserId] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
        .then(({ data }) => { setAddresses((data as Address[]) ?? []); setLoading(false) })
    })
  }, [])

  const openAdd = () => { setEditing(null); reset({}); setShowForm(true) }
  const openEdit = (a: Address) => {
    setEditing(a)
    reset({ full_name: a.full_name, phone: a.phone, line1: a.line1, line2: a.line2 ?? '', city: a.city, state: a.state, pincode: a.pincode, is_default: a.is_default })
    setShowForm(true)
  }

  const onSave = async (data: AddressForm) => {
    if (!userId) return
    const supabase = createClient()
    if (editing) {
      const { data: updated, error } = await supabase.from('addresses').update(data).eq('id', editing.id).select().single()
      if (error) { addToast(error.message, 'error'); return }
      setAddresses((prev) => prev.map((a) => a.id === editing.id ? updated as Address : a))
      addToast('Address updated', 'success')
    } else {
      const { data: created, error } = await supabase.from('addresses').insert({ ...data, user_id: userId }).select().single()
      if (error) { addToast(error.message, 'error'); return }
      setAddresses((prev) => [...prev, created as Address])
      addToast('Address added', 'success')
    }
    setShowForm(false)
  }

  const deleteAddr = async (id: string) => {
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    addToast('Address deleted', 'success')
  }

  const setDefault = async (id: string) => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
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

function LoyaltyTab({ profile, addToast }: { profile: Profile | null; addToast: (m: string, t: any) => void }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('loyalty_transactions').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => { setTransactions(data ?? []); setLoading(false) })
    })
  }, [])

  const copyCode = () => {
    if (!profile?.referral_code) return
    navigator.clipboard.writeText(profile.referral_code)
    setCopied(true)
    addToast('Referral code copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const msg = `Hey! Check out Wilourin — premium Indian streetwear. Use my code ${profile?.referral_code} for a discount. Shop here: ${window.location.origin}/products`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-6">Rewards & Loyalty</h2>

        {/* Tier card */}
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

        {/* Referral */}
        {profile?.referral_code && (
          <div className="border border-gray-100 p-5 mb-6">
            <p className="text-sm font-medium mb-1">Your Referral Code</p>
            <p className="text-xs text-gray-400 mb-3">Share with friends and earn bonus points when they order</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm font-mono tracking-wider">{profile.referral_code}</code>
              <button onClick={copyCode} className="p-2.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
              </button>
              <button onClick={shareWhatsApp} className="p-2.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                <Share2 size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* How to earn */}
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

        {/* Transaction history */}
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
