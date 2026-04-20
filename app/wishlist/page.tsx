'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { useWishlistStore, useToastStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore()
  const addToast = useToastStore((s) => s.addToast)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20 bg-brand-background">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C6C7D0" strokeWidth="1.5" className="mb-6">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <h1 className="font-serif text-w-dark text-3xl mb-3">Your Wishlist is Empty</h1>
        <p className="font-sans text-w-graphite text-sm mb-8 max-w-xs">
          Save your favourite pieces and come back to them anytime.
        </p>
        <Link href="/products" className="bg-w-forest text-white font-sans text-xs uppercase tracking-widest px-10 py-4 hover:bg-w-emerald transition-colors rounded-none">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-brand-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-w-dark text-4xl mb-1">Wishlist</h1>
          <p className="font-sans text-sm text-w-graphite">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-w-ghost">
          {items.map((item, i) => (
            <div key={item.id} className="group relative bg-w-surface">
              <Link href={`/products/${item.slug}`} className="block relative overflow-hidden" style={{ aspectRatio: i % 2 === 0 ? '2/3' : '3/4' }}>
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                {item.badge && (
                  <span className="absolute top-3 left-3 bg-w-forest text-white font-sans text-xs uppercase tracking-widest px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); removeItem(item.id); addToast('Removed from wishlist', 'info') }}
                  className="absolute top-3 right-3 w-7 h-7 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={13} className="text-w-dark" />
                </button>
              </Link>

              <div className="p-3">
                <Link href={`/products/${item.slug}`} className="font-sans text-xs font-medium text-w-dark tracking-wide uppercase line-clamp-1 hover:text-w-forest transition-colors block mb-1">
                  {item.name}
                </Link>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-sans text-xs text-w-graphite">{formatPrice(item.price)}</span>
                  {item.original_price && item.original_price > item.price && (
                    <span className="font-sans text-xs text-w-graphite line-through opacity-60">{formatPrice(item.original_price)}</span>
                  )}
                </div>
                <Link
                  href={`/products/${item.slug}`}
                  className="flex items-center justify-center gap-1.5 bg-w-forest text-white font-sans text-xs uppercase tracking-widest py-2 hover:bg-w-forest transition-colors rounded-none"
                >
                  <ShoppingBag size={11} />
                  Select Size
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
