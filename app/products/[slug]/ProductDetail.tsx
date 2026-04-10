'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, ShoppingBag, Star, ChevronDown, Share2 } from 'lucide-react'
import { useCartStore, useWishlistStore, useUIStore, useToastStore } from '@/lib/store'
import { formatPrice, isLowStock, isOutOfStock, cn } from '@/lib/utils'
import { ProductCard } from '@/components/ui/ProductCard'
import type { ProductVariant, Review } from '@/lib/types'

interface Props {
  product: {
    id: string; name: string; slug: string; description: string | null
    price: number; original_price: number | null; badge: string | null
    fit_note: string | null; model_height: string | null; model_size: string | null
    tags: string[] | null
    product_images: Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>
    product_variants: ProductVariant[]
    categories: { id: string; name: string; slug: string } | null
  }
  reviews: Review[]
  related: Array<{ id: string; name: string; slug: string; price: number; original_price: number | null; badge: string | null; product_images: Array<{ id: string; image_url: string; is_primary: boolean }> }>
  avgRating: number
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function ProductDetail({ product, reviews, related, avgRating }: Props) {
  const images = [...product.product_images].sort((a, b) => a.display_order - b.display_order)
  const [activeImage, setActiveImage] = useState(images[0]?.image_url ?? '')
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [reviewTab, setReviewTab] = useState<'reviews' | 'details'>('reviews')

  const addItem = useCartStore((s) => s.addItem)
  const { isWishlisted, addItem: addWish, removeItem: removeWish } = useWishlistStore()
  const setCartOpen = useUIStore((s) => s.setCartOpen)
  const addToast = useToastStore((s) => s.addToast)
  const wishlisted = isWishlisted(product.id)

  // Group variants by color, then by size
  const colors = Array.from(new Map(
    product.product_variants
      .filter((v) => v.color_name)
      .map((v) => [v.color_name!, { name: v.color_name!, hex: v.color_hex ?? '#000' }])
  ).values())

  const activeColor = selectedColor ?? colors[0]?.name ?? null

  const variantsBySize = SIZE_ORDER.map((size) => {
    const v = product.product_variants.find((pv) =>
      pv.size === size && (activeColor ? pv.color_name === activeColor : true)
    )
    return { size, variant: v ?? null }
  }).filter((x) => x.variant !== null || product.product_variants.some((v) => v.size === x.size))

  const selectedVariant = selectedSize
    ? product.product_variants.find((v) =>
        v.size === selectedSize && (activeColor ? v.color_name === activeColor : true)
      ) ?? null
    : null

  const addToCart = () => {
    if (!selectedSize) { addToast('Please select a size', 'warning'); return }
    if (!selectedVariant) { addToast('Variant not available', 'error'); return }
    if (selectedVariant.stock_qty === 0) { addToast('Out of stock', 'error'); return }

    addItem({
      id: selectedVariant.id,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      image_url: images[0]?.image_url ?? '',
      size: selectedSize,
      color_name: activeColor,
      color_hex: selectedVariant.color_hex,
      price: product.price,
      original_price: product.original_price,
      quantity: qty,
      stock_qty: selectedVariant.stock_qty,
    })
    addToast(`${product.name} added to cart`, 'success')
    setCartOpen(true)
  }

  const toggleWishlist = () => {
    if (wishlisted) {
      removeWish(product.id)
      addToast('Removed from wishlist', 'info')
    } else {
      addWish({ id: product.id, name: product.name, slug: product.slug, price: product.price, original_price: product.original_price, badge: product.badge as Parameters<typeof addWish>[0]['badge'], image_url: images[0]?.image_url ?? '' })
      addToast('Added to wishlist', 'success')
    }
  }

  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-[3/4] relative bg-gray-100 overflow-hidden">
            <Image src={activeImage} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
            {product.badge && (
              <span className="absolute top-4 left-4 bg-[#0A0A0A] text-white text-[10px] uppercase tracking-widest px-2 py-1">
                {product.badge}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img.image_url)}
                className={cn('aspect-square relative bg-gray-100 overflow-hidden border-2 transition-colors', activeImage === img.image_url ? 'border-[#0A0A0A]' : 'border-transparent')}
              >
                <Image src={img.image_url} alt="" fill className="object-cover" sizes="100px" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.categories && (
            <p className="text-xs uppercase tracking-widest text-gray-400">{product.categories.name}</p>
          )}
          <h1 className="font-serif text-4xl font-light">{product.name}</h1>

          {/* Rating */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.round(avgRating) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.original_price)}</span>
            )}
          </div>

          {/* Color selector */}
          {colors.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest font-medium mb-3">
                Color: <span className="text-gray-500 normal-case">{activeColor}</span>
              </p>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setSelectedColor(c.name); setSelectedSize(null) }}
                    title={c.name}
                    className={cn('w-7 h-7 rounded-full border-2 transition-all', activeColor === c.name ? 'border-[#0A0A0A] scale-110' : 'border-transparent hover:border-gray-300')}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-3">Size</p>
            <div className="flex flex-wrap gap-2">
              {variantsBySize.map(({ size, variant }) => {
                const outOfStock = !variant || variant.stock_qty === 0
                const lowStock = variant && isLowStock(variant.stock_qty)
                return (
                  <button
                    key={size}
                    onClick={() => !outOfStock && setSelectedSize(size)}
                    disabled={outOfStock}
                    className={cn(
                      'relative border px-4 py-2 text-sm transition-all',
                      selectedSize === size
                        ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                        : outOfStock
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        : 'border-gray-300 hover:border-gray-600'
                    )}
                  >
                    {size}
                    {lowStock && !outOfStock && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
            {selectedVariant && isLowStock(selectedVariant.stock_qty) && (
              <p className="text-xs text-orange-500 mt-2">Only {selectedVariant.stock_qty} left in this size!</p>
            )}
          </div>

          {/* Qty + CTA */}
          <div className="flex gap-3">
            <div className="flex items-center border border-gray-200">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-lg hover:bg-gray-50 transition-colors">−</button>
              <span className="px-4 py-2 text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-lg hover:bg-gray-50 transition-colors">+</button>
            </div>
            <button
              onClick={addToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0A0A0A] text-white py-3 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              <ShoppingBag size={16} />
              Add to Cart
            </button>
            <button
              onClick={toggleWishlist}
              className="border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={18} className={wishlisted ? 'fill-red-500 text-red-500' : ''} />
            </button>
          </div>

          {/* Fit note */}
          {product.fit_note && (
            <p className="text-sm text-gray-500 border-t border-gray-100 pt-4">{product.fit_note}</p>
          )}
          {(product.model_height || product.model_size) && (
            <p className="text-xs text-gray-400">
              Model is {product.model_height}{product.model_size ? `, wearing size ${product.model_size}` : ''}
            </p>
          )}

          {/* Share */}
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); addToast('Link copied!', 'info') }}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors"
          >
            <Share2 size={14} />Share
          </button>
        </div>
      </div>

      {/* Reviews + Details tabs */}
      <div className="mt-16 border-t border-gray-100 pt-10">
        <div className="flex gap-8 border-b border-gray-100 mb-8">
          {(['reviews', 'details'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setReviewTab(tab)}
              className={cn('pb-3 text-sm uppercase tracking-widest transition-colors', reviewTab === tab ? 'border-b-2 border-[#0A0A0A] font-semibold' : 'text-gray-400 hover:text-black')}
            >
              {tab === 'reviews' ? `Reviews (${reviews.length})` : 'Details'}
            </button>
          ))}
        </div>

        {reviewTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Rating summary */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-serif text-6xl">{avgRating.toFixed(1)}</p>
                <div className="flex justify-center mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
              </div>
              <div className="space-y-2">
                {ratingBuckets.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-4">{star}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C9A84C] rounded-full"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review list */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{r.reviewer_name}</span>
                        {r.is_verified && <span className="text-[10px] text-green-600 border border-green-200 px-1.5 py-0.5 rounded">Verified</span>}
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className={s <= r.rating ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                    {r.size_purchased && <p className="text-xs text-gray-400 mb-2">Size purchased: {r.size_purchased}</p>}
                    <p className="text-sm text-gray-700 leading-relaxed">{r.review_text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {reviewTab === 'details' && (
          <div className="max-w-2xl space-y-4 text-sm text-gray-700 leading-relaxed">
            {product.description && <p>{product.description}</p>}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs border border-gray-200 px-2 py-1 rounded text-gray-500">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-3xl mb-8">Complete the Look</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => {
              const imgs = p.product_images ?? []
              const primary = imgs.find((i) => i.is_primary) ?? imgs[0]
              const secondary = imgs.find((i) => !i.is_primary)
              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  original_price={p.original_price}
                  badge={p.badge}
                  primaryImage={primary?.image_url ?? ''}
                  secondaryImage={secondary?.image_url}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
