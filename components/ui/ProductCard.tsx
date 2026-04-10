'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useWishlistStore, useToastStore } from '@/lib/store'
import { formatPrice, calculateDiscountedPrice, cn } from '@/lib/utils'
import type { WishlistProduct } from '@/lib/types'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  badge: string | null
  primaryImage: string
  secondaryImage?: string
}

const BADGE_STYLES: Record<string, string> = {
  'New Arrival': 'bg-[#0A0A0A] text-white',
  Sale: 'bg-red-600 text-white',
  Bestseller: 'bg-[#C9A84C] text-white',
  'Low Stock': 'bg-orange-500 text-white',
}

export function ProductCard({ id, name, slug, price, original_price, badge, primaryImage, secondaryImage }: ProductCardProps) {
  const { isWishlisted, addItem, removeItem } = useWishlistStore()
  const addToast = useToastStore((s) => s.addToast)
  const wishlisted = isWishlisted(id)
  const discount = calculateDiscountedPrice(price, original_price)

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (wishlisted) {
      removeItem(id)
      addToast(`${name} removed from wishlist`, 'info')
    } else {
      const item: WishlistProduct = { id, name, slug, price, original_price, badge: badge as WishlistProduct['badge'], image_url: primaryImage }
      addItem(item)
      addToast(`${name} added to wishlist`, 'success')
    }
  }

  return (
    <Link href={`/products/${slug}`} className="group block">
      {/* Image */}
      <div className="product-image-wrap aspect-[3/4] bg-gray-100 relative mb-3">
        <Image
          src={primaryImage}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${name} alternate`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover secondary"
          />
        )}

        {/* Badge */}
        {badge && (
          <span className={cn('absolute top-2 left-2 text-[10px] uppercase tracking-widest px-2 py-1 font-medium', BADGE_STYLES[badge] ?? 'bg-gray-200 text-gray-700')}>
            {badge}
          </span>
        )}

        {/* Discount % */}
        {discount > 0 && (
          <span className="absolute top-2 right-10 text-[10px] font-semibold text-red-600 bg-white px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:scale-110"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[#0A0A0A] line-clamp-1 group-hover:opacity-70 transition-opacity">{name}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatPrice(price)}</span>
          {original_price && original_price > price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
