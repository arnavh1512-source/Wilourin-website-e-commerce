import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
// @ts-ignore
import PaytmChecksum from 'paytmchecksum'

const PAYTM_BASE = process.env.PAYTM_WEBSITE === 'DEFAULT'
  ? 'https://securegw.paytm.in'
  : 'https://securegw-stage.paytm.in'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      orderId, txnId, txnAmount, status, checksumHash,
      _meta, bankTxnId, paymentMode,
    } = body

    // ── Verify checksum ───────────────────────────────────
    const paytmParams: Record<string, string> = {
      ORDERID: orderId,
      MID: process.env.PAYTM_MERCHANT_ID!,
      TXNID: txnId,
      TXNAMOUNT: txnAmount,
      PAYMENTMODE: paymentMode ?? '',
      CURRENCY: 'INR',
      STATUS: status,
      BANKTXNID: bankTxnId ?? '',
      CHECKSUMHASH: checksumHash,
    }

    const isValid = await PaytmChecksum.verifySignature(
      paytmParams,
      process.env.PAYTM_MERCHANT_KEY!,
      checksumHash
    )

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Checksum verification failed' }, { status: 400 })
    }

    // ── Double-verify via Paytm Transaction Status API ────
    const statusParams = {
      body: { mid: process.env.PAYTM_MERCHANT_ID!, orderId },
    }
    const statusChecksum = await PaytmChecksum.generateSignature(
      JSON.stringify(statusParams.body),
      process.env.PAYTM_MERCHANT_KEY!
    )
    const statusRes = await fetch(`${PAYTM_BASE}/v3/order/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-checksum': statusChecksum },
      body: JSON.stringify(statusParams),
    })
    const statusData = await statusRes.json()
    const txnStatus = statusData.body?.resultInfo?.resultStatus

    if (txnStatus !== 'TXN_SUCCESS') {
      return NextResponse.json({ success: false, error: 'Payment not successful', status: txnStatus })
    }

    const admin = createAdminClient()
    const meta = _meta

    // ── Create address if guest ───────────────────────────
    let finalAddressId = meta.addressId ?? null
    if (!finalAddressId && meta.guestAddress && meta.userId) {
      const { data: addr } = await admin
        .from('addresses')
        .insert({ ...meta.guestAddress, user_id: meta.userId })
        .select('id')
        .single()
      finalAddressId = addr?.id ?? null
    }

    // ── Insert order ──────────────────────────────────────
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        order_number: orderId,
        user_id: meta.userId ?? null,
        guest_email: meta.guestEmail ?? null,
        address_id: finalAddressId,
        shipping_method: meta.shippingMethod,
        shipping_cost: meta.shippingCost,
        subtotal: meta.subtotal,
        discount_amount: meta.discountAmount,
        points_redeemed: meta.pointsRedeemed,
        total: meta.total,
        payment_status: 'Paid',
        order_status: 'Confirmed',
        paytm_order_id: orderId,
        paytm_txn_id: txnId,
        paytm_txn_amount: txnAmount,
        promo_code: meta.promoCode ?? null,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
    }

    // ── Insert order items + deduct stock ─────────────────
    for (const item of meta.cartItems) {
      await admin.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.id,
        product_name: item.product_name,
        product_image: item.image_url,
        size: item.size,
        color_name: item.color_name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      })

      await admin.rpc('decrement_stock', { variant_id: item.id, qty: item.quantity })
        .catch(() => {
          // Fallback if RPC not created
          admin.from('product_variants')
            .select('stock_qty')
            .eq('id', item.id)
            .single()
            .then(({ data }) => {
              if (data) {
                admin.from('product_variants')
                  .update({ stock_qty: Math.max(0, data.stock_qty - item.quantity) })
                  .eq('id', item.id)
              }
            })
        })
    }

    // ── Award loyalty points ──────────────────────────────
    if (meta.userId) {
      const { data: settings } = await admin.from('store_settings').select('loyalty_points_per_rupee').eq('id', 1).single()
      const ptsPerRupee = settings?.loyalty_points_per_rupee ?? 1
      const pointsEarned = Math.floor(meta.total * ptsPerRupee)

      await admin.from('loyalty_transactions').insert({
        user_id: meta.userId,
        type: 'earned',
        points: pointsEarned,
        description: `Order #${orderId}`,
        order_id: order.id,
      })

      const { data: profile } = await admin.from('profiles').select('loyalty_points').eq('id', meta.userId).single()
      const newPoints = (profile?.loyalty_points ?? 0) + pointsEarned
      const tier = newPoints >= 5000 ? 'Gold' : newPoints >= 1000 ? 'Silver' : 'Bronze'
      await admin.from('profiles').update({ loyalty_points: newPoints, loyalty_tier: tier }).eq('id', meta.userId)

      // Deduct redeemed points
      if (meta.pointsRedeemed > 0) {
        await admin.from('loyalty_transactions').insert({
          user_id: meta.userId,
          type: 'redeemed',
          points: -meta.pointsRedeemed,
          description: `Redeemed for Order #${orderId}`,
          order_id: order.id,
        })
        await admin.from('profiles').update({ loyalty_points: newPoints - meta.pointsRedeemed }).eq('id', meta.userId)
      }
    }

    // ── Mark discount code used ───────────────────────────
    if (meta.promoCode && meta.userId) {
      const { data: discount } = await admin
        .from('discount_codes')
        .select('id, usage_count')
        .eq('code', meta.promoCode)
        .single()
      if (discount) {
        await admin.from('discount_code_usage').insert({
          code_id: discount.id,
          user_id: meta.userId,
          order_id: order.id,
        })
        await admin.from('discount_codes').update({ usage_count: discount.usage_count + 1 }).eq('id', discount.id)
      }
    }

    // ── Send order confirmation email ─────────────────────
    const emailTo = meta.guestEmail
    if (emailTo && process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      resend.emails.send({
        from: 'Wilourin <hello@wilourin.com>',
        to: emailTo,
        subject: `Order Confirmed — #${orderId}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
            <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 8px;">Your order is confirmed. 🖤</h1>
            <p style="color:#555;font-size:14px;margin:0 0 24px;">Order <strong>#${orderId}</strong> has been placed and is being processed.</p>
            <div style="border:1px solid #eee;padding:20px;margin-bottom:24px;">
              <p style="font-size:13px;color:#555;margin:0 0 8px;"><strong>Order Total:</strong> ₹${meta.total}</p>
              <p style="font-size:13px;color:#555;margin:0 0 8px;"><strong>Shipping:</strong> ${meta.shippingMethod} (${meta.shippingCost === 0 ? 'Free' : '₹' + meta.shippingCost})</p>
              <p style="font-size:13px;color:#555;margin:0;"><strong>Estimated Delivery:</strong> ${meta.shippingMethod === 'Express' ? '2–3' : '5–7'} business days</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 28px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Track Your Order</a>
          </div>
        `,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, orderNumber: orderId })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
