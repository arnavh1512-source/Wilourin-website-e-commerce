'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bookmark, Share2, Users, Star } from 'lucide-react'
import { useCartStore, useWishlistStore, useUIStore, useToastStore, useUserStore } from '@/lib/store'
import { formatPrice, isLowStock, cn } from '@/lib/utils'
import { ProductCard } from '@/components/ui/ProductCard'
import { createClient } from '@/lib/supabase/client'
import type { ProductVariant, Review } from '@/lib/types'

function useViewerCount(productId: string) {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`pdp:${productId}`, {
      config: { presence: { key: Math.random().toString(36).slice(2) } },
    })
    channel
      .on('presence', { event: 'sync' }, () => { setCount(Object.keys(channel.presenceState()).length) })
      .subscribe(async (status) => { if (status === 'SUBSCRIBED') await channel.track({ productId, ts: Date.now() }) })
    return () => { supabase.removeChannel(channel) }
  }, [productId])
  return count
}

interface SizeGuideData {
  id: string
  name: string
  image_url: string | null
  measurements: { rows: Array<Record<string, string>>; columns: string[]; unit?: string } | null
}

interface Props {
  product: {
    id: string; name: string; slug: string; description: string | null
    price: number; original_price: number | null; badge: string | null
    fit_note: string | null; model_height: string | null; model_size: string | null
    tags: string[] | null; care_instructions: string | null; material: string | null; fit: string | null
    product_images: Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>
    product_variants: ProductVariant[]
    categories: { id: string; name: string; slug: string } | null
  }
  reviews: Review[]
  related: Array<{ id: string; name: string; slug: string; price: number; original_price: number | null; badge: string | null; product_images: Array<{ id: string; image_url: string; is_primary: boolean }> }>
  avgRating: number
  sizeGuide: SizeGuideData | null
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const TABS = ['DESCRIPTION', 'COMPOSITION', 'MEASUREMENTS'] as const
type Tab = typeof TABS[number]

export function ProductDetail({ product, reviews, related, avgRating, sizeGuide }: Props) {
  const router = useRouter()
  const images = [...product.product_images].sort((a, b) => a.display_order - b.display_order)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('DESCRIPTION')
  const [sizeError, setSizeError] = useState(false)
  const [qty, setQty] = useState(1)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const { isWishlisted, addItem: addWish, removeItem: removeWish } = useWishlistStore()
  const setCartOpen = useUIStore((s) => s.setCartOpen)
  const addToast = useToastStore((s) => s.addToast)
  const wishlisted = isWishlisted(product.id)
  const viewerCount = useViewerCount(product.id)
  const userProfile = useUserStore((s) => s.profile)

  useEffect(() => {
    if (!userProfile) return
    fetch('/api/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id }),
    }).catch(() => {})
  }, [product.id, userProfile])

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
    ? product.product_variants.find((v) => v.size === selectedSize && (activeColor ? v.color_name === activeColor : true)) ?? null
    : null

  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); addToast('Please select a size', 'warning'); return }
    if (!selectedVariant) { addToast('Variant not available', 'error'); return }
    if (selectedVariant.stock_qty === 0) { addToast('Out of stock', 'error'); return }
    setSizeError(false)
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
    setAddedToCart(true)
    addToast(`${product.name} added to cart`, 'success')
    setCartOpen(true)
    setTimeout(() => setAddedToCart(false), 1500)
  }

  const toggleWishlist = () => {
    if (wishlisted) {
      removeWish(product.id)
      addToast('Removed from wishlist', 'info')
      if (userProfile) {
        fetch('/api/account/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        }).catch(() => {})
      }
    } else {
      addWish({ id: product.id, name: product.name, slug: product.slug, price: product.price, original_price: product.original_price, badge: product.badge as Parameters<typeof addWish>[0]['badge'], image_url: images[0]?.image_url ?? '' })
      addToast('Saved to wishlist', 'success')
      if (userProfile) {
        fetch('/api/account/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        }).catch(() => {})
      }
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      addToast('Link copied!', 'info')
    }
  }

  const activeImage = images[activeImageIdx]?.image_url ?? ''

  return (
    <div className="bg-brand-background min-h-screen">
      {/* Mobile/Zara-style layout */}
      <div className="lg:hidden">
        {/* Image hero */}
        <div className="relative" style={{ height: '65vh' }}>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
            <button onClick={() => router.back()} className="w-8 h-8 bg-white/80 backdrop-blur-sm flex items-center justify-center text-w-dark">
              <ArrowLeft size={16} />
            </button>
            <span className="font-sans text-xs text-white/80 bg-black/30 px-2 py-1 rounded-sm">
              {activeImageIdx + 1}/{images.length}
            </span>
            <div className="flex gap-2">
              <button onClick={toggleWishlist} className="w-8 h-8 bg-white/80 backdrop-blur-sm flex items-center justify-center text-w-dark">
                <Bookmark size={15} className={wishlisted ? 'fill-w-forest text-w-forest' : ''} />
              </button>
              <button onClick={handleShare} className="w-8 h-8 bg-white/80 backdrop-blur-sm flex items-center justify-center text-w-dark">
                <Share2 size={15} />
              </button>
            </div>
          </div>

          {/* Image scroll */}
          <div className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-none" onScroll={(e) => {
            const el = e.currentTarget
            const idx = Math.round(el.scrollLeft / el.clientWidth)
            setActiveImageIdx(idx)
          }}>
            {images.map((img) => (
              <div key={img.id} className="flex-shrink-0 w-full h-full snap-start relative">
                <Image src={img.image_url} alt={product.name} fill className="object-cover object-top" priority sizes="100vw" />
              </div>
            ))}
          </div>

          {/* TRY ON button */}
          <button className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm font-sans text-w-dark text-xs tracking-widest uppercase px-3 py-2 flex items-center gap-2">
            <span>⟐</span> TRY ON
          </button>
        </div>

        {/* Mobile product info */}
        <div className="bg-brand-background px-4 pt-5 pb-24">
          {product.badge && (
            <p className="font-sans text-w-forest text-xs tracking-widest uppercase mb-2">{product.badge}</p>
          )}
          {viewerCount > 1 && (
            <p className="font-sans text-xs text-w-graphite flex items-center gap-1 mb-2">
              <Users size={11} /> {viewerCount} people viewing this
            </p>
          )}
          <h1 className="font-sans font-medium text-w-dark text-sm tracking-widest uppercase mb-1">{product.name}</h1>
          <p className="font-sans text-w-dark text-sm mb-0.5">{formatPrice(product.price)}</p>
          <p className="font-sans text-w-graphite text-xs mb-5">MRP incl. of all taxes</p>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mb-5">
              <p className="font-sans text-xs uppercase tracking-widest text-w-graphite mb-3">Colour: {activeColor}</p>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button key={c.name} onClick={() => { setSelectedColor(c.name); setSelectedSize(null) }}
                    className={cn('w-7 h-7 rounded-full border-2 transition-all', activeColor === c.name ? 'border-w-dark scale-110' : 'border-transparent hover:border-w-ghost')}
                    style={{ background: c.hex }} title={c.name} />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className={cn('font-sans text-xs uppercase tracking-widest', sizeError ? 'text-w-forest' : 'text-w-graphite')}>
                {sizeError ? 'Please select a size' : 'Size'}
              </p>
              {sizeGuide && (
                <button onClick={() => setSizeGuideOpen(true)}
                  className="font-sans text-xs text-w-graphite underline hover:text-w-dark transition-colors">
                  Size Guide
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {variantsBySize.map(({ size, variant }) => {
                const outOfStock = !variant || variant.stock_qty === 0
                return (
                  <button key={size}
                    onClick={() => { if (!outOfStock) { setSelectedSize(size); setSizeError(false) } }}
                    disabled={outOfStock}
                    className={cn(
                      'font-sans text-xs px-3 py-2 rounded-none transition-colors',
                      selectedSize === size ? 'bg-w-forest text-white' : outOfStock ? 'border border-w-ghost text-w-ghost cursor-not-allowed line-through' : 'border border-w-ghost text-w-graphite hover:border-white hover:text-white'
                    )}
                  >{size}</button>
                )
              })}
            </div>
          </div>

          {/* ADD button */}
          <button
            onClick={handleAddToCart}
            className={cn(
              'w-full font-sans text-xs tracking-widest uppercase py-4 rounded-none transition-colors mb-4',
              addedToCart ? 'bg-w-forest text-white' : 'border border-white/40 text-white hover:bg-w-forest hover:text-white'
            )}
          >
            {addedToCart ? 'ADDED ✓' : 'ADD TO BAG'}
          </button>

          {/* Description tabs */}
          <div className="mt-8">
            <div className="flex gap-0 border-b border-w-ghost">
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn(
                    'font-sans text-xs tracking-widest uppercase py-3 px-3 -mb-px',
                    activeTab === tab ? 'border-b-2 border-white/40 text-white' : 'text-w-graphite hover:text-w-dark'
                  )}
                >{tab}</button>
              ))}
            </div>
            <div className="py-4 font-sans text-xs text-w-dark tracking-wide uppercase leading-relaxed">
              {activeTab === 'DESCRIPTION' && <p>{product.description ?? 'Premium quality streetwear.'}</p>}
              {activeTab === 'COMPOSITION' && <p>{product.material ?? 'Premium cotton blend.'}</p>}
              {activeTab === 'MEASUREMENTS' && <p>{product.fit_note ?? 'Regular fit. Model wears size M.'}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-2">
              <div className="relative overflow-hidden" style={{ height: '80vh' }}>
                <Image src={activeImage} alt={product.name} fill className="object-cover object-top" priority sizes="50vw" />
                {product.badge && (
                  <span className="absolute top-4 left-4 font-sans bg-w-forest text-white text-xs uppercase tracking-widest px-2 py-1">
                    {product.badge}
                  </span>
                )}
                {/* TRY ON */}
                <button className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm font-sans text-w-dark text-xs tracking-widest uppercase px-3 py-2 flex items-center gap-2">
                  <span>⟐</span> TRY ON
                </button>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImageIdx(i)}
                      className={cn('relative overflow-hidden flex-1', activeImageIdx === i ? 'ring-2 ring-w-dark' : 'opacity-60 hover:opacity-100')}
                      style={{ aspectRatio: '3/4' }}>
                      <Image src={img.image_url} alt="" fill className="object-cover object-top" sizes="100px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="sticky top-24 space-y-5 self-start">
              <div className="flex items-start justify-between">
                <div>
                  {product.badge && <p className="font-sans text-w-forest text-xs tracking-widest uppercase mb-1">{product.badge}</p>}
                  <h1 className="font-sans font-medium text-w-dark text-sm tracking-widest uppercase">{product.name}</h1>
                </div>
                <div className="flex gap-2">
                  <button onClick={toggleWishlist} className="w-9 h-9 border border-w-ghost flex items-center justify-center hover:border-w-dark transition-colors">
                    <Bookmark size={16} className={wishlisted ? 'fill-w-forest text-w-forest' : 'text-w-dark'} />
                  </button>
                  <button onClick={handleShare} className="w-9 h-9 border border-w-ghost flex items-center justify-center hover:border-w-dark transition-colors">
                    <Share2 size={16} className="text-w-dark" />
                  </button>
                </div>
              </div>

              {viewerCount > 1 && (
                <p className="font-sans text-xs text-w-graphite flex items-center gap-1.5">
                  <Users size={12} /> {viewerCount} people viewing this
                </p>
              )}

              <div>
                <p className="font-sans text-w-dark text-base">{formatPrice(product.price)}</p>
                {product.original_price && product.original_price > product.price && (
                  <p className="font-sans text-w-graphite text-sm line-through">{formatPrice(product.original_price)}</p>
                )}
                <p className="font-sans text-w-graphite text-xs mt-0.5">MRP incl. of all taxes</p>
              </div>

              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-w-graphite mb-3">Colour: {activeColor}</p>
                  <div className="flex gap-2">
                    {colors.map((c) => (
                      <button key={c.name} onClick={() => { setSelectedColor(c.name); setSelectedSize(null) }}
                        className={cn('w-7 h-7 rounded-full border-2 transition-all', activeColor === c.name ? 'border-w-dark scale-110' : 'border-transparent hover:border-w-ghost')}
                        style={{ background: c.hex }} title={c.name} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className={cn('font-sans text-xs uppercase tracking-widest', sizeError ? 'text-w-forest' : 'text-w-graphite')}>
                    {sizeError ? 'Please select a size' : 'Size'}
                  </p>
                  {sizeGuide && (
                    <button onClick={() => setSizeGuideOpen(true)}
                      className="font-sans text-xs text-w-graphite underline hover:text-w-dark transition-colors">
                      Size Guide
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {variantsBySize.map(({ size, variant }) => {
                    const outOfStock = !variant || variant.stock_qty === 0
                    const lowStock = variant && isLowStock(variant.stock_qty)
                    return (
                      <button key={size}
                        onClick={() => { if (!outOfStock) { setSelectedSize(size); setSizeError(false) } }}
                        disabled={outOfStock}
                        className={cn(
                          'relative font-sans text-xs px-3 py-2 rounded-none transition-colors',
                          selectedSize === size ? 'bg-w-forest text-white' : outOfStock ? 'border border-w-ghost text-w-ghost cursor-not-allowed line-through' : 'border border-w-ghost text-w-graphite hover:border-white hover:text-white'
                        )}
                      >
                        {size}
                        {lowStock && !outOfStock && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />}
                      </button>
                    )
                  })}
                </div>
                {selectedVariant && isLowStock(selectedVariant.stock_qty) && (
                  <p className="font-sans text-xs text-orange-500 mt-2">Only {selectedVariant.stock_qty} left!</p>
                )}
              </div>

              {/* Qty */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-w-ghost">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-w-dark hover:bg-w-surface transition-colors">−</button>
                  <span className="px-4 py-2 font-sans text-sm text-w-dark">{qty}</span>
                  <button onClick={() => setQty(Math.min(qty + 1, selectedVariant?.stock_qty ?? qty + 1))} disabled={selectedVariant ? qty >= selectedVariant.stock_qty : false} className="px-3 py-2 text-w-dark hover:bg-w-surface transition-colors disabled:opacity-30">+</button>
                </div>
              </div>

              {/* ADD button */}
              <button
                onClick={handleAddToCart}
                className={cn(
                  'w-full font-sans text-xs tracking-widest uppercase py-4 rounded-none transition-colors',
                  addedToCart ? 'bg-w-forest text-white' : 'border border-white/40 text-white hover:bg-w-forest hover:text-white'
                )}
              >
                {addedToCart ? 'ADDED ✓' : 'ADD TO BAG'}
              </button>

              {/* Description tabs */}
              <div className="border-t border-w-ghost pt-6">
                <div className="flex gap-0 border-b border-w-ghost">
                  {TABS.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={cn(
                        'font-sans text-xs tracking-widest uppercase py-3 px-3 -mb-px',
                        activeTab === tab ? 'border-b-2 border-white/40 text-white' : 'text-w-graphite hover:text-w-dark'
                      )}
                    >{tab}</button>
                  ))}
                </div>
                <div className="py-4 font-sans text-xs text-w-dark tracking-wide leading-relaxed">
                  {activeTab === 'DESCRIPTION' && <p>{product.description ?? 'Premium quality streetwear.'}</p>}
                  {activeTab === 'COMPOSITION' && <p>{product.material ?? 'Premium cotton blend. Machine wash cold.'}</p>}
                  {activeTab === 'MEASUREMENTS' && <p>{product.fit_note ?? 'Regular fit. Model is 180cm and wears size M.'}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {sizeGuide && sizeGuideOpen && (
        <SizeGuideModal guide={sizeGuide} onClose={() => setSizeGuideOpen(false)} />
      )}

      {/* Reviews */}
      <ReviewsSection productId={product.id} initialReviews={reviews} initialAvg={avgRating} />

      {/* Related products */}
      {related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-w-ghost">
          <h2 className="font-serif text-w-dark text-3xl mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-w-ghost">
            {related.map((p, i) => {
              const imgs = p.product_images
              const primary = imgs.find((im) => im.is_primary) ?? imgs[0]
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
                  aspectRatio={i % 2 === 0 ? '2/3' : '3/4'}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reviews Section ──────────────────────────────────────────────────────────

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star size={18}
            fill={(hovered || value) >= s ? '#1B4332' : 'none'}
            stroke="#1B4332"
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewsSection({ productId, initialReviews, initialAvg }: {
  productId: string
  initialReviews: Review[]
  initialAvg: number
}) {
  const { profile } = useUserStore()
  const isLoggedIn = !!profile
  const addToast = useToastStore((s) => s.addToast)
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [avgRating, setAvgRating] = useState(initialAvg)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [sizePurchased, setSizePurchased] = useState('')
  const [hasReviewed, setHasReviewed] = useState(false)

  const checkExisting = useCallback(async () => {
    if (!isLoggedIn) return
    const res = await fetch('/api/reviews/check?product_id=' + productId)
    if (res.ok) {
      const data = await res.json()
      setHasReviewed(!!data.exists)
    }
  }, [isLoggedIn, productId])

  useEffect(() => { checkExisting() }, [checkExisting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { addToast('Please select a rating', 'warning'); return }
    setSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, rating, review_text: reviewText || undefined, size_purchased: sizePurchased || undefined }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      addToast(e.error ?? 'Failed to submit review', 'error')
      return
    }
    const newReview = await res.json()
    const updated = [newReview, ...reviews]
    setReviews(updated)
    setAvgRating(updated.reduce((s, r) => s + r.rating, 0) / updated.length)
    setShowForm(false)
    setHasReviewed(true)
    setReviewText('')
    setSizePurchased('')
    setRating(5)
    addToast('Review submitted!', 'success')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-w-ghost">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-w-dark text-3xl">Reviews ({reviews.length})</h2>
        {!isLoggedIn ? (
          <a href="/login" className="font-sans text-xs uppercase tracking-widest border border-white/40 text-white px-4 py-2 hover:bg-w-forest hover:text-white transition-colors">
            Login to Write a Review
          </a>
        ) : hasReviewed ? (
          <span className="font-sans text-xs text-w-graphite">You&apos;ve reviewed this product</span>
        ) : (
          <button onClick={() => setShowForm(!showForm)}
            className="font-sans text-xs uppercase tracking-widest border border-white/40 text-white px-4 py-2 hover:bg-w-forest hover:text-white transition-colors">
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          <span className="font-serif text-5xl text-w-dark">{avgRating.toFixed(1)}</span>
          <div>
            <StarRating value={Math.round(avgRating)} />
            <p className="font-sans text-xs text-w-graphite mt-0.5">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-w-surface p-6 mb-8 space-y-4">
          <h3 className="font-sans text-sm font-medium uppercase tracking-widest text-w-dark">Your Review</h3>
          <div>
            <p className="font-sans text-xs text-w-graphite mb-2 uppercase tracking-wider">Rating *</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="font-sans text-xs text-w-graphite mb-1.5 uppercase tracking-wider block">Size Purchased</label>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button key={s} type="button" onClick={() => setSizePurchased(sizePurchased === s ? '' : s)}
                  className={cn('font-sans text-xs px-3 py-1.5 border transition-colors', sizePurchased === s ? 'bg-w-forest text-white border-w-dark' : 'border-w-ghost text-w-graphite hover:border-w-dark')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-sans text-xs text-w-graphite mb-1.5 uppercase tracking-wider block">Review (optional)</label>
            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
              rows={4} maxLength={1000} placeholder="Share your thoughts about this product..."
              className="w-full border border-w-ghost px-4 py-3 font-sans text-sm text-w-dark outline-none focus:border-w-dark resize-none" />
            <p className="font-sans text-xs text-w-graphite mt-1 text-right">{reviewText.length}/1000</p>
          </div>
          <button type="submit" disabled={submitting}
            className="font-sans text-xs uppercase tracking-widest bg-w-forest text-white px-8 py-3 hover:bg-w-forest transition-colors disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="font-sans text-sm text-w-graphite">No reviews yet. Be the first!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="bg-w-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} />
                  <span className="font-sans text-xs font-medium text-w-dark">{r.reviewer_name}</span>
                </div>
                {r.is_verified && (
                  <span className="font-sans text-[10px] bg-w-forest text-white px-2 py-0.5 uppercase tracking-wider">Verified</span>
                )}
              </div>
              {r.size_purchased && (
                <p className="font-sans text-xs text-w-graphite mb-1">Size: {r.size_purchased}</p>
              )}
              {r.review_text && <p className="font-sans text-xs text-w-graphite leading-relaxed">{r.review_text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Size Guide Modal ─────────────────────────────────────────────────────────

function SizeGuideModal({ guide, onClose }: { guide: SizeGuideData; onClose: () => void }) {
  const rows = guide.measurements?.rows ?? []
  const columns = guide.measurements?.columns ?? []
  const unit = guide.measurements?.unit ?? 'inches'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-w-surface max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-xl text-w-dark">{guide.name}</h2>
            {unit && <p className="font-sans text-xs text-w-graphite mt-0.5">Measurements in {unit}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-xl leading-none">✕</button>
        </div>
        <div className="p-6">
          {guide.image_url ? (
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <Image src={guide.image_url} alt={guide.name} fill className="object-contain" />
            </div>
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                    {columns.map((col) => (
                      <th key={col} className="text-left px-3 py-2 capitalize">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-2 text-w-dark font-sans">{row[col] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No measurement data available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
