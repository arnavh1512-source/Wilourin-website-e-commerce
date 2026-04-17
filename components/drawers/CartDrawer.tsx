'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, Minus, ShoppingBag, Tag, Truck } from 'lucide-react'
import { useCartStore, useUIStore, useToastStore } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'

export function CartDrawer() {
  const { isCartOpen, toggleCart } = useUIStore()
  const { items, removeItem, updateQuantity, getSubtotal, promoCode, discountAmount, setPromoCode, clearCart } = useCartStore()
  const addToast = useToastStore((s) => s.addToast)

  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [freeThreshold, setFreeThreshold] = useState(999)
  const [shippingCost, setShippingCost] = useState(99)

  useEffect(() => {
    fetch('/api/store/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.free_shipping_threshold != null) setFreeThreshold(Number(d.free_shipping_threshold))
        if (d.standard_shipping_cost != null) setShippingCost(Number(d.standard_shipping_cost))
      })
      .catch(() => {})
  }, [])

  const subtotal = getSubtotal()
  const shippingFree = subtotal >= freeThreshold
  const shipping = shippingFree ? 0 : shippingCost
  const total = subtotal - discountAmount + shipping

  const applyPromo = async () => {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim().toUpperCase(), subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setPromoCode(data.code.code, data.discountAmount)
        addToast(`Promo applied — you saved ${formatPrice(data.discountAmount)}!`, 'success')
      } else {
        addToast(data.message ?? 'Invalid promo code', 'error')
      }
    } catch {
      addToast('Failed to validate code. Try again.', 'error')
    } finally {
      setPromoLoading(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleCart() }
    if (isCartOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isCartOpen, toggleCart])

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[55] bg-black/40 drawer-backdrop" onClick={toggleCart} aria-hidden />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md z-[60] bg-white shadow-2xl flex flex-col transition-transform duration-350',
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <span className="font-serif text-xl">Your Cart</span>
            {items.length > 0 && <span className="text-xs text-gray-500">({items.length} {items.length === 1 ? 'item' : 'items'})</span>}
          </div>
          <button onClick={toggleCart} aria-label="Close cart" className="opacity-60 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <ShoppingBag size={48} className="text-gray-200" />
            <p className="font-serif text-2xl">Your cart is empty</p>
            <p className="text-sm text-gray-500">Add some pieces to get started.</p>
            <button onClick={toggleCart} className="mt-2 bg-[#0A0A0A] text-white text-xs uppercase tracking-widest px-8 py-3">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Free shipping bar */}
            {!shippingFree && (
              <div className="bg-gray-50 px-6 py-2.5 text-xs text-gray-600 flex items-center gap-2">
                <Truck size={12} />
                Add {formatPrice(freeThreshold - subtotal)} more for <strong>free shipping</strong>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <Link href={`/products/${item.product_slug}`} onClick={toggleCart} className="shrink-0">
                    <div className="w-20 h-24 bg-gray-100 relative overflow-hidden rounded-sm">
                      <Image src={item.image_url} alt={item.product_name} fill className="object-cover" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Size: {item.size}
                      {item.color_name && ` · ${item.color_name}`}
                    </p>
                    <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-gray-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_qty}
                          className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="px-6 py-3 border-t border-gray-100">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 border border-gray-200 px-3 py-2 rounded">
                  <Tag size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={promoCode ?? promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    disabled={!!promoCode}
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </div>
                {promoCode ? (
                  <button
                    onClick={() => { setPromoCode(null, 0); setPromoInput('') }}
                    className="text-xs text-red-500 underline px-2"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading}
                    className="bg-[#0A0A0A] text-white text-xs px-4 py-2 uppercase tracking-widest disabled:opacity-50"
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                )}
              </div>
            </div>

            {/* Summary + CTA */}
            <div className="px-6 py-5 border-t border-gray-100 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({promoCode})</span><span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingFree ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-100">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                onClick={toggleCart}
                className="block w-full text-center bg-[#0A0A0A] text-white py-4 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Checkout
              </Link>
              <button onClick={toggleCart} className="block w-full text-center text-xs text-gray-500 underline">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
