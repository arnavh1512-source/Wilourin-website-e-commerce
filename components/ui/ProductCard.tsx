'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
  aspectRatio?: string
}

const BADGE_STYLES: Record<string, string> = {
  'New Arrival': 'bg-w-forest text-white',
  Sale:          'bg-w-forest text-white',
  Bestseller:    'bg-w-forest text-white',
  'Low Stock':   'bg-w-forest text-white',
}

export function ProductCard({
  id, name, slug, price, original_price, badge, primaryImage, secondaryImage, aspectRatio = '3/4',
}: ProductCardProps) {
  const { isWishlisted, addItem: addWish, removeItem: removeWish } = useWishlistStore()
  const addToast = useToastStore((s) => s.addToast)
  const router = useRouter()
  const wishlisted = isWishlisted(id)
  const discount = calculateDiscountedPrice(price, original_price)

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (wishlisted) {
      removeWish(id)
      addToast(`Removed from wishlist`, 'info')
    } else {
      const item: WishlistProduct = { id, name, slug, price, original_price, badge: badge as WishlistProduct['badge'], image_url: primaryImage }
      addWish(item)
      addToast(`Added to wishlist`, 'success')
    }
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(`/products/${slug}`)
  }

  return (
    <Link href={`/products/${slug}`} className="group block bg-w-surface">
      {/* Image container */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio }}
      >
        <Image
          src={primaryImage}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${name} alternate`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top secondary"
          />
        )}

        {/* Badge — takes priority; discount shown only when no badge */}
        {badge ? (
          <span className={cn(
            'absolute top-3 left-3 font-sans text-xs px-2 py-0.5 tracking-wider uppercase',
            BADGE_STYLES[badge] ?? 'bg-w-dark text-white'
          )}>
            {badge === 'New Arrival' ? 'New' : badge}
          </span>
        ) : discount > 0 ? (
          <span className="absolute top-3 left-3 font-sans text-xs text-white bg-w-forest px-2 py-0.5">
            -{discount}%
          </span>
        ) : null}

        {/* Quick-add + button */}
        <button
          onClick={handleQuickAdd}
          className="absolute top-3 right-3 w-8 h-8 bg-white text-w-dark text-lg flex items-center justify-center hover:bg-w-forest hover:text-white transition-colors rounded-none shadow-sm"
          aria-label="Quick add to cart"
        >
          +
        </button>

        {/* Wishlist */}
        <button
          onClick={toggleWishlist}
          className="absolute bottom-12 right-3 w-7 h-7 bg-white/90 text-w-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={wishlisted ? '#1B4332' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Quick view overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-w-dark/80 text-white font-sans text-xs tracking-widest uppercase text-center py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          Quick View
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="font-prata text-sm text-brand-dark tracking-wide line-clamp-1">{name}</p>
        <div className="flex items-center gap-2">
          <span className="font-raleway text-xs text-brand-gray">{formatPrice(price)}</span>
          {original_price && original_price > price && (
            <span className="font-raleway text-xs text-brand-gray line-through opacity-60">{formatPrice(original_price)}</span>
          )}
          {original_price && original_price > price && (
            <span className="font-raleway text-xs text-brand-green">{formatPrice(original_price - price)} off</span>
          )}
        </div>
      </div>
    </Link>
  )
}
