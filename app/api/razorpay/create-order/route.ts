import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cartItems, addressId, guestAddress, guestEmail, promoCode, pointsToRedeem, shippingMethod } = body

    if (!cartItems?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ── Server-side price validation ──────────────────────
    const productIds = cartItems.map((i: { product_id: string }) => i.product_id)
    const { data: products } = await admin
      .from('products')
      .select('id, price, status')
      .in('id', productIds)

    const priceMap = new Map<string, number>((products ?? []).map((p: { id: string; price: number }) => [p.id, p.price]))

    let subtotal = 0
    for (const item of cartItems) {
      const serverPrice = priceMap.get(item.product_id)
      if (!serverPrice) return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 400 })
      subtotal += serverPrice * item.quantity
    }

    // ── Fetch store settings ──────────────────────────────
    const { data: settings } = await admin.from('store_settings').select('*').eq('id', 1).single()
    const freeThreshold = settings?.free_shipping_threshold ?? 999
    const standardCost = settings?.standard_shipping_cost ?? 99
    const expressCost = settings?.express_shipping_cost ?? 199

    let shippingCost = 0
    if (subtotal < freeThreshold) {
      shippingCost = shippingMethod === 'Express' ? expressCost : standardCost
    }

    // ── Validate discount code ────────────────────────────
    let discountAmount = 0
    if (promoCode) {
      const { data: discount } = await admin
        .from('discount_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (discount && subtotal >= discount.min_order_amount) {
        if (discount.type === 'percentage') {
          discountAmount = Math.round((subtotal * discount.value) / 100)
        } else if (discount.type === 'flat') {
          discountAmount = Math.min(discount.value, subtotal)
        } else if (discount.type === 'free_shipping') {
          shippingCost = 0
        }
      }
    }

    // ── Points redemption ─────────────────────────────────
    let pointsDiscount = 0
    if (pointsToRedeem && user) {
      const { data: profile } = await admin.from('profiles').select('loyalty_points').eq('id', user.id).single()
      const availablePoints = profile?.loyalty_points ?? 0
      const redeemable = Math.min(pointsToRedeem, availablePoints)
      pointsDiscount = Math.floor(redeemable / 10)
    }

    const total = Math.max(0, subtotal - discountAmount - pointsDiscount + shippingCost)
    const orderId = generateOrderNumber()

    // ── Store order intent server-side ────────────────────
    const { error: intentErr } = await admin.from('pending_order_intents').insert({
      order_id: orderId,
      user_id: user?.id ?? null,
      cart_items: cartItems,
      address_id: addressId ?? null,
      guest_address: guestAddress ?? null,
      guest_email: guestEmail ?? user?.email ?? null,
      subtotal,
      discount_amount: discountAmount,
      points_redeemed: pointsToRedeem ?? 0,
      shipping_cost: shippingCost,
      shipping_method: shippingMethod ?? 'Standard',
      promo_code: promoCode ?? null,
      total,
    })

    if (intentErr) {
      console.error('[razorpay/create-order] intent insert failed:', intentErr.message)
      return NextResponse.json({ error: 'Failed to create order session' }, { status: 500 })
    }

    // ── Create Razorpay order ─────────────────────────────
    const amountInPaise = Math.round(total * 100)
    const authHeader = `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { order_id: orderId, user_id: user?.id ?? 'guest' },
      }),
    })

    const rzpData = await rzpRes.json()

    if (!rzpRes.ok || !rzpData.id) {
      console.error('[razorpay/create-order] Razorpay order creation failed:', rzpData)
      return NextResponse.json({ error: 'Razorpay order creation failed' }, { status: 500 })
    }

    return NextResponse.json({
      orderId,
      razorpayOrderId: rzpData.id,
      amount: amountInPaise,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('[razorpay/create-order]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
