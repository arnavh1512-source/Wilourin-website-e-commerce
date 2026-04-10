'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useWishlistStore, useCartStore, useToastStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addItem)
  const addToast = useToastStore((s) => s.addToast)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <Heart size={56} className="text-gray-200 mb-6" />
        <h1 className="font-serif text-3xl mb-3">Your Wishlist is Empty</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">
          Save your favourite pieces and come back to them anytime.
        </p>
        <Link
          href="/products"
          className="bg-[#0A0A0A] text-white text-xs uppercase tracking-widest px-10 py-4 hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-serif text-4xl mb-1">Wishlist</h1>
        <p className="text-sm text-gray-500">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            {/* Image */}
            <Link href={`/products/${item.slug}`} className="block aspect-[3/4] bg-gray-100 relative overflow-hidden mb-3">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {item.badge && (
                <span className="absolute top-2 left-2 bg-[#0A0A0A] text-white text-[10px] uppercase tracking-widest px-2 py-1">
                  {item.badge}
                </span>
              )}
            </Link>

            {/* Info */}
            <div className="space-y-1">
              <Link href={`/products/${item.slug}`} className="text-sm font-medium hover:opacity-70 transition-opacity line-clamp-1 block">
                {item.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
                {item.original_price && item.original_price > item.price && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(item.original_price)}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <Link
                href={`/products/${item.slug}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A0A0A] text-white text-xs uppercase tracking-widest py-2.5 hover:bg-gray-800 transition-colors"
              >
                <ShoppingBag size={12} />
                Select Size
              </Link>
              <button
                onClick={() => {
                  removeItem(item.id)
                  addToast(`${item.name} removed from wishlist`, 'info')
                }}
                className="border border-gray-200 px-3 py-2.5 hover:bg-red-50 hover:border-red-200 transition-colors"
                aria-label="Remove from wishlist"
              >
                <Trash2 size={14} className="text-gray-400 hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
