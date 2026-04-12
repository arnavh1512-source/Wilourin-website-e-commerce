'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, ChevronRight, Coins, Truck, LocateFixed } from 'lucide-react'
import { useCartStore, useUserStore, useToastStore } from '@/lib/store'
import { formatPrice, INDIAN_STATES } from '@/lib/utils'
import { detectLocationByGPS, getDeliveryEstimate, getStoredCity, setStoredCity } from '@/lib/location'
import type { Address } from '@/lib/types'

const addressSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(10).max(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6, 'Must be 6 digits'),
  email: z.string().email().optional(),
})
type AddressForm = z.infer<typeof addressSchema>

const STEPS = ['Address', 'Shipping', 'Payment', 'Review']

declare global {
  interface Window {
    Paytm: {
      CheckoutJS: {
        init: (config: Record<string, unknown>) => Promise<void>
        invoke: () => void
      }
    }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, promoCode, discountAmount, clearCart } = useCartStore()
  const { profile } = useUserStore()
  const addToast = useToastStore((s) => s.addToast)

  const [step, setStep] = useState(0)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<'Standard' | 'Express'>('Standard')
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [paying, setPaying] = useState(false)
  const [storeSettings, setStoreSettings] = useState({ freeThreshold: 999, standardCost: 99, expressCost: 199, standardDays: '5–7', expressDays: '2–3', pointsPerRupee: 1 })
  const [detectedCity, setDetectedCity] = useState<string>('')
  const [locating, setLocating] = useState(false)

  const handleUseMyLocation = async () => {
    setLocating(true)
    try {
      const result = await detectLocationByGPS()
      // Match state to INDIAN_STATES list (case-insensitive)
      const matchedState = INDIAN_STATES.find(
        (s) => s.toLowerCase() === result.state.toLowerCase()
      ) ?? result.state
      setValue('city', result.city)
      setValue('state', matchedState)
      if (result.pincode) setValue('pincode', result.pincode)
      setDetectedCity(result.city)
      setStoredCity(result.city)
      addToast(`Location detected — ${result.city}, ${matchedState}`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof GeolocationPositionError && err.code === 1
        ? 'Location access denied — please fill manually'
        : 'Could not detect location — please fill manually'
      addToast(msg, 'error')
    } finally {
      setLocating(false)
    }
  }

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  })

  const subtotal = getSubtotal()
  const freeShipping = subtotal >= storeSettings.freeThreshold
  const shippingCost = freeShipping ? 0 : (shippingMethod === 'Express' ? storeSettings.expressCost : storeSettings.standardCost)
  const maxPointsRedeemable = Math.min(profile?.loyalty_points ?? 0, Math.floor(subtotal * 0.2 / 10) * 10)
  const pointsDiscount = redeemPoints ? Math.floor(maxPointsRedeemable / 10) : 0
  const total = Math.max(0, subtotal - discountAmount - pointsDiscount + shippingCost)

  useEffect(() => {
    if (items.length === 0) { router.replace('/'); return }

    // Seed city from localStorage
    const stored = getStoredCity()
    if (stored) setDetectedCity(stored)

    // Load store settings
    fetch('/api/store/settings').then((r) => r.json()).then((data) => {
      if (data) setStoreSettings({
        freeThreshold: data.free_shipping_threshold,
        standardCost: data.standard_shipping_cost,
        expressCost: data.express_shipping_cost,
        standardDays: data.standard_shipping_days,
        expressDays: data.express_shipping_days,
        pointsPerRupee: data.loyalty_points_per_rupee,
      })
    })

    // Load saved addresses
    if (profile) {
      fetch('/api/account/addresses').then((r) => r.json()).then((data) => {
        const addresses = Array.isArray(data) ? data : []
        setSavedAddresses(addresses)
        const def = addresses.find((a: any) => a.is_default)
        if (def) setSelectedAddressId(def.id)
        else if (addresses.length) setSelectedAddressId(addresses[0].id)
        else setUseNewAddress(true)
      })
    } else {
      setUseNewAddress(true)
    }
  }, [profile, items.length, router])

  const loadPaytmScript = () =>
    new Promise<void>((resolve) => {
      if (window.Paytm) { resolve(); return }
      const script = document.createElement('script')
      const base = process.env.NEXT_PUBLIC_PAYTM_ENV === 'PROD'
        ? 'https://securegw.paytm.in'
        : 'https://securegw-stage.paytm.in'
      script.src = `${base}/merchantpgpui/checkoutjs/merchants/${process.env.NEXT_PUBLIC_PAYTM_MERCHANT_ID}.js`
      script.onload = () => resolve()
      document.body.appendChild(script)
    })

  const placeOrder = handleSubmit(async (formData) => {
    setPaying(true)
    try {
      const res = await fetch('/api/paytm/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items,
          addressId: selectedAddressId,
          guestAddress: useNewAddress ? formData : undefined,
          guestEmail: formData.email,
          promoCode,
          pointsToRedeem: redeemPoints ? maxPointsRedeemable : 0,
          shippingMethod,
        }),
      })
      const data = await res.json()
      if (!data.txnToken) { addToast(data.error ?? 'Order creation failed', 'error'); return }

      await loadPaytmScript()

      const config = {
        root: '',
        flow: 'DEFAULT',
        data: {
          orderId: data.orderId,
          token: data.txnToken,
          tokenType: 'TXN_TOKEN',
          amount: data.amount,
        },
        merchant: { redirect: false },
        handler: {
          notifyMerchant: async (eventName: string, eventData: Record<string, string>) => {
            if (eventName === 'APP_CLOSED') { setPaying(false) }
          },
          transactionStatus: async (paymentData: Record<string, string>) => {
            const verifyRes = await fetch('/api/paytm/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...paymentData, _meta: data._meta }),
            })
            const verified = await verifyRes.json()
            if (verified.success) {
              clearCart()
              router.push(`/checkout/success?order=${verified.orderNumber}`)
            } else {
              addToast('Payment failed or could not be verified. Please try again.', 'error')
              setPaying(false)
            }
          },
        },
      }

      await window.Paytm.CheckoutJS.init(config)
      window.Paytm.CheckoutJS.invoke()
    } catch {
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setPaying(false)
    }
  })

  if (items.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif text-4xl mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i <= step ? 'bg-[#0A0A0A] text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
            <span className={`text-sm ${i === step ? 'font-semibold' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left — form */}
        <div className="lg:col-span-3 space-y-8">

          {/* Step 0 — Address */}
          <section>
            <h2 className="font-serif text-2xl mb-5">Delivery Address</h2>
            {/* Saved addresses */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3 mb-5">
                {savedAddresses.map((addr) => (
                  <label key={addr.id} className={`flex items-start gap-3 border p-4 cursor-pointer rounded transition-colors ${selectedAddressId === addr.id && !useNewAddress ? 'border-[#0A0A0A]' : 'border-gray-200 hover:border-gray-400'}`}>
                    <input type="radio" name="address" checked={selectedAddressId === addr.id && !useNewAddress} onChange={() => { setSelectedAddressId(addr.id); setUseNewAddress(false) }} className="mt-1" />
                    <div className="text-sm">
                      <p className="font-medium">{addr.full_name}</p>
                      <p className="text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-gray-500">{addr.phone}</p>
                    </div>
                  </label>
                ))}
                <button onClick={() => { setUseNewAddress(true); setSelectedAddressId(null) }} className="text-sm underline text-gray-500">+ Use a different address</button>
              </div>
            )}

            {/* New address form */}
            {(useNewAddress || savedAddresses.length === 0) && (
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="flex items-center gap-1.5 text-xs border border-gray-300 px-3 py-1.5 rounded hover:border-gray-500 transition-colors disabled:opacity-50"
                  >
                    <LocateFixed size={13} />
                    {locating ? 'Detecting…' : 'Use My Location'}
                  </button>
                </div>
                {!profile && (
                  <div className="sm:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">Email *</label>
                    <input {...register('email')} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" placeholder="your@email.com" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                )}
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">Full Name *</label>
                  <input {...register('full_name')} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                  {errors.full_name && <p className="text-xs text-red-500 mt-1">Required</p>}
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">Phone *</label>
                  <input {...register('phone')} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" placeholder="10-digit mobile" />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">Enter 10-digit phone</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">Address Line 1 *</label>
                  <input {...register('line1')} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                  {errors.line1 && <p className="text-xs text-red-500 mt-1">Required</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">Address Line 2</label>
                  <input {...register('line2')} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">City *</label>
                  <input {...register('city')} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">State *</label>
                  <select {...register('state')} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white">
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1">Pincode *</label>
                  <input {...register('pincode')} maxLength={6} className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                  {errors.pincode && <p className="text-xs text-red-500 mt-1">Enter 6-digit pincode</p>}
                </div>
              </form>
            )}
          </section>

          {/* Step 1 — Shipping */}
          <section>
            <h2 className="font-serif text-2xl mb-5">Shipping Method</h2>
            {detectedCity && (
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <LocateFixed size={11} />
                Delivering to <span className="font-medium text-gray-700">{detectedCity}</span>
              </p>
            )}
            <div className="space-y-3">
              {(() => {
                const est = detectedCity ? getDeliveryEstimate(detectedCity) : null
                return [
                  { method: 'Standard' as const, label: `Standard — ${est ? est.standard : storeSettings.standardDays}`, cost: freeShipping ? 'Free' : formatPrice(storeSettings.standardCost) },
                  { method: 'Express' as const, label: `Express — ${est ? est.express : storeSettings.expressDays}`, cost: freeShipping ? 'Free' : formatPrice(storeSettings.expressCost) },
                ]
              })().map(({ method, label, cost }) => (
                <label key={method} className={`flex items-center justify-between border p-4 cursor-pointer rounded transition-colors ${shippingMethod === method ? 'border-[#0A0A0A]' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={shippingMethod === method} onChange={() => setShippingMethod(method)} />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      {freeShipping && <p className="text-xs text-green-600">Free shipping applied</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{cost}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Step 2 — Loyalty points */}
          {profile && (profile.loyalty_points ?? 0) >= 10 && (
            <section>
              <h2 className="font-serif text-2xl mb-5">Loyalty Points</h2>
              <label className="flex items-center justify-between border border-gray-200 p-4 rounded cursor-pointer">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={redeemPoints} onChange={(e) => setRedeemPoints(e.target.checked)} />
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Coins size={14} />
                      Redeem {maxPointsRedeemable} points
                    </p>
                    <p className="text-xs text-gray-500">Save {formatPrice(pointsDiscount)} on this order</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{profile.loyalty_points} pts available</span>
              </label>
            </section>
          )}
        </div>

        {/* Right — Order summary */}
        <div className="lg:col-span-2">
          <div className="border border-gray-100 p-6 rounded space-y-5 sticky top-24">
            <h3 className="font-serif text-xl">Order Summary</h3>

            {/* Items */}
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 flex-1 mr-2 truncate">{item.product_name} × {item.quantity} <span className="text-gray-400">({item.size})</span></span>
                  <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({promoCode})</span><span>-{formatPrice(discountAmount)}</span></div>}
              {pointsDiscount > 0 && <div className="flex justify-between text-[#C9A84C]"><span>Points redeemed</span><span>-{formatPrice(pointsDiscount)}</span></div>}
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1"><Truck size={13} />Shipping</span>
                <span>{freeShipping ? 'Free' : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A] text-white py-4 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              <Lock size={14} />
              {paying ? 'Opening Paytm…' : 'Pay with Paytm'}
            </button>

            <div className="flex flex-wrap justify-center gap-2">
              {['UPI', 'Cards', 'Wallets', 'Net Banking', 'BNPL', 'EMI'].map((m) => (
                <span key={m} className="text-[10px] text-gray-400 border border-gray-100 px-2 py-1 rounded">{m}</span>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
              <Lock size={11} />Secured by Paytm Payment Gateway
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
