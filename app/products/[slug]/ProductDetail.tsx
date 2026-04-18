'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bookmark, Share2, Users } from 'lucide-react'
import { useCartStore, useWishlistStore, useUIStore, useToastStore } from '@/lib/store'
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
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const TABS = ['DESCRIPTION', 'COMPOSITION', 'MEASUREMENTS'] as const
type Tab = typeof TABS[number]

export function ProductDetail({ product, reviews, related, avgRating }: Props) {
  const router = useRouter()
  const images = [...product.product_images].sort((a, b) => a.display_order - b.display_order)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('DESCRIPTION')
  const [sizeError, setSizeError] = useState(false)
  const [qty, setQty] = useState(1)

  const addItem = useCartStore((s) => s.addItem)
  const { isWishlisted, addItem: addWish, removeItem: removeWish } = useWishlistStore()
  const setCartOpen = useUIStore((s) => s.setCartOpen)
  const addToast = useToastStore((s) => s.addToast)
  const wishlisted = isWishlisted(product.id)
  const viewerCount = useViewerCount(product.id)

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
    } else {
      addWish({ id: product.id, name: product.name, slug: product.slug, price: product.price, original_price: product.original_price, badge: product.badge as Parameters<typeof addWish>[0]['badge'], image_url: images[0]?.image_url ?? '' })
      addToast('Saved to wishlist', 'success')
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
    <div className="bg-w-bg min-h-screen">
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
        <div className="bg-w-bg px-4 pt-5 pb-24">
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
            <p className={cn('font-sans text-xs uppercase tracking-widest mb-3', sizeError ? 'text-w-forest' : 'text-w-graphite')}>
              {sizeError ? 'Please select a size' : 'Size'}
            </p>
            <div className="flex flex-wrap gap-2">
              {variantsBySize.map(({ size, variant }) => {
                const outOfStock = !variant || variant.stock_qty === 0
                return (
                  <button key={size}
                    onClick={() => { if (!outOfStock) { setSelectedSize(size); setSizeError(false) } }}
                    disabled={outOfStock}
                    className={cn(
                      'font-sans text-xs px-3 py-2 rounded-none transition-colors',
                      selectedSize === size ? 'bg-w-dark text-white' : outOfStock ? 'border border-w-ghost text-w-ghost cursor-not-allowed line-through' : 'border border-w-ghost text-w-graphite hover:border-w-dark hover:text-w-dark'
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
              addedToCart ? 'bg-w-forest text-white' : 'border border-w-dark text-w-dark hover:bg-w-dark hover:text-white'
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
                    activeTab === tab ? 'border-b-2 border-w-dark text-w-dark' : 'text-w-graphite hover:text-w-dark'
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
                <p className={cn('font-sans text-xs uppercase tracking-widest mb-3', sizeError ? 'text-w-forest' : 'text-w-graphite')}>
                  {sizeError ? 'Please select a size' : 'Size'}
                </p>
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
                          selectedSize === size ? 'bg-w-dark text-white' : outOfStock ? 'border border-w-ghost text-w-ghost cursor-not-allowed line-through' : 'border border-w-ghost text-w-graphite hover:border-w-dark hover:text-w-dark'
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
                  <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-w-dark hover:bg-w-surface transition-colors">+</button>
                </div>
              </div>

              {/* ADD button */}
              <button
                onClick={handleAddToCart}
                className={cn(
                  'w-full font-sans text-xs tracking-widest uppercase py-4 rounded-none transition-colors',
                  addedToCart ? 'bg-w-forest text-white' : 'border border-w-dark text-w-dark hover:bg-w-dark hover:text-white'
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
                        activeTab === tab ? 'border-b-2 border-w-dark text-w-dark' : 'text-w-graphite hover:text-w-dark'
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

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-w-ghost">
          <h2 className="font-serif text-w-dark text-3xl mb-6">Reviews ({reviews.length})</h2>
          <div className="flex items-center gap-3 mb-8">
            <span className="font-serif text-5xl text-w-dark">{avgRating.toFixed(1)}</span>
            <div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= Math.round(avgRating) ? '#1B4332' : 'none'} stroke="#1B4332" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p className="font-sans text-xs text-w-graphite mt-0.5">{reviews.length} reviews</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="bg-w-surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={s <= r.rating ? '#1B4332' : 'none'} stroke="#1B4332" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <span className="font-sans text-xs font-medium text-w-dark">{r.reviewer_name}</span>
                </div>
                {r.review_text && <p className="font-sans text-xs text-w-graphite leading-relaxed">{r.review_text}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

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
