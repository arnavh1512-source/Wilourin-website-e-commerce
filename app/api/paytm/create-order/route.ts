import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils'
// @ts-ignore — paytmchecksum has no types
import PaytmChecksum from 'paytmchecksum'

const PAYTM_BASE = process.env.PAYTM_WEBSITE === 'DEFAULT'
  ? 'https://securegw.paytm.in'
  : 'https://securegw-stage.paytm.in'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cartItems, addressId, guestAddress, guestEmail, promoCode, pointsToRedeem, shippingMethod } = body

    if (!cartItems?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ── Server-side price validation ─────────────────────
    const productIds = cartItems.map((i: { product_id: string }) => i.product_id)
    const { data: products } = await admin
      .from('products')
      .select('id, price, status')
      .in('id', productIds)

    const priceMap = new Map((products ?? []).map((p) => [p.id, p.price]))

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
      pointsDiscount = Math.floor(redeemable / 10) // 10 points = ₹1
    }

    const total = Math.max(0, subtotal - discountAmount - pointsDiscount + shippingCost)
    const orderId = generateOrderNumber()

    // ── Generate Paytm checksum ───────────────────────────
    const paytmParams = {
      body: {
        requestType: 'Payment',
        mid: process.env.PAYTM_MERCHANT_ID!,
        websiteName: process.env.PAYTM_WEBSITE!,
        orderId,
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paytm/verify-payment`,
        txnAmount: { value: total.toFixed(2), currency: 'INR' },
        userInfo: { custId: user?.id ?? guestEmail ?? 'GUEST' },
      },
    }

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      process.env.PAYTM_MERCHANT_KEY!
    )

    // ── Call Paytm initiateTransaction API ────────────────
    const paytmRes = await fetch(
      `${PAYTM_BASE}/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MERCHANT_ID}&orderId=${orderId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-checksum': checksum,
        },
        body: JSON.stringify(paytmParams),
      }
    )

    const paytmData = await paytmRes.json()

    if (!paytmData.body?.txnToken) {
      return NextResponse.json({ error: 'Paytm token generation failed', details: paytmData }, { status: 500 })
    }

    return NextResponse.json({
      orderId,
      txnToken: paytmData.body.txnToken,
      amount: total.toFixed(2),
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paytm/verify-payment`,
      // Pass metadata for verify step
      _meta: {
        cartItems,
        addressId,
        guestAddress,
        guestEmail: guestEmail ?? user?.email,
        userId: user?.id ?? null,
        subtotal,
        discountAmount,
        pointsRedeemed: pointsToRedeem ?? 0,
        shippingCost,
        shippingMethod,
        promoCode: promoCode ?? null,
        total,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
