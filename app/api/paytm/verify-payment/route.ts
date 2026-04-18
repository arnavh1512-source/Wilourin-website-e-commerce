import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
// @ts-expect-error — paytmchecksum has no types
import PaytmChecksum from 'paytmchecksum'

const PAYTM_BASE = process.env.PAYTM_WEBSITE === 'DEFAULT'
  ? 'https://securegw.paytm.in'
  : 'https://securegw-stage.paytm.in'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, txnId, txnAmount, status, checksumHash, bankTxnId, paymentMode } = body

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // ── Read order intent from DB — never trust client-supplied data ──────────
    const { data: intent, error: intentErr } = await admin
      .from('pending_order_intents')
      .select('*')
      .eq('order_id', orderId)
      .eq('used', false)
      .single()

    if (intentErr || !intent) {
      console.error('[verify-payment] intent not found for orderId:', orderId, intentErr?.message)
      return NextResponse.json({ success: false, error: 'Order session not found or already used' }, { status: 400 })
    }

    // ── Reconcile Paytm's verified amount against server-computed total ───────
    const paytmVerifiedAmount = parseFloat(txnAmount)
    if (Math.abs(paytmVerifiedAmount - Number(intent.total)) > 0.5) {
      console.error(`[verify-payment] amount mismatch: Paytm=${paytmVerifiedAmount}, intent=${intent.total}`)
      return NextResponse.json({ success: false, error: 'Payment amount mismatch' }, { status: 400 })
    }

    // Mark intent as used to prevent replay
    await admin.from('pending_order_intents').update({ used: true }).eq('order_id', orderId)

    // ── Create address if guest ───────────────────────────
    let finalAddressId = intent.address_id ?? null
    if (!finalAddressId && intent.guest_address && intent.user_id) {
      const { data: addr } = await admin
        .from('addresses')
        .insert({ ...intent.guest_address, user_id: intent.user_id })
        .select('id')
        .single()
      finalAddressId = addr?.id ?? null
    }

    // ── Insert order ──────────────────────────────────────
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        order_number: orderId,
        user_id: intent.user_id ?? null,
        guest_email: intent.guest_email ?? null,
        address_id: finalAddressId,
        shipping_method: intent.shipping_method,
        shipping_cost: intent.shipping_cost,
        subtotal: intent.subtotal,
        discount_amount: intent.discount_amount,
        points_redeemed: intent.points_redeemed,
        total: intent.total,
        payment_status: 'Paid',
        order_status: 'Confirmed',
        paytm_order_id: orderId,
        paytm_txn_id: txnId,
        paytm_txn_amount: txnAmount,
        promo_code: intent.promo_code ?? null,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error('[verify-payment] order insert failed:', orderErr?.message)
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
    }

    // ── Insert order items + deduct stock (atomic RPC) ────
    const cartItems = intent.cart_items as Array<{
      id: string; product_id: string; product_name: string; image_url: string;
      size: string; color_name: string; quantity: number; price: number;
    }>

    for (const item of cartItems) {
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

      // Atomic stock decrement via RPC — no read-modify-write fallback
      const { error: rpcErr } = await admin.rpc('decrement_stock', { variant_id: item.id, qty: item.quantity })
      if (rpcErr) {
        console.error('[verify-payment] decrement_stock failed for variant:', item.id, rpcErr.message)
      }
    }

    // ── Award + deduct loyalty points (single atomic RPC) ─
    if (intent.user_id) {
      const { data: settings } = await admin.from('store_settings').select('loyalty_points_per_rupee').eq('id', 1).single()
      const ptsPerRupee = settings?.loyalty_points_per_rupee ?? 1
      const pointsEarned = Math.floor(Number(intent.total) * ptsPerRupee)
      const pointsRedeemed = intent.points_redeemed ?? 0

      if (pointsEarned > 0) {
        await admin.from('loyalty_transactions').insert({
          user_id: intent.user_id,
          type: 'earned',
          points: pointsEarned,
          description: `Order #${orderId}`,
          order_id: order.id,
        })
      }

      if (pointsRedeemed > 0) {
        await admin.from('loyalty_transactions').insert({
          user_id: intent.user_id,
          type: 'redeemed',
          points: -pointsRedeemed,
          description: `Redeemed for Order #${orderId}`,
          order_id: order.id,
        })
      }

      // Single atomic UPDATE — no TOCTOU
      await admin.rpc('adjust_loyalty_points', {
        p_user_id: intent.user_id,
        p_earned: pointsEarned,
        p_redeemed: pointsRedeemed,
      })
    }

    // ── Mark discount code used (atomic increment) ────────
    if (intent.promo_code) {
      const { data: discount } = await admin
        .from('discount_codes')
        .select('id')
        .eq('code', intent.promo_code)
        .single()

      if (discount) {
        await admin.from('discount_code_usage').insert({
          code_id: discount.id,
          user_id: intent.user_id ?? null,
          order_id: order.id,
        })
        await admin.rpc('increment_discount_usage', { p_code_id: discount.id })
      }
    }

    // ── Send order confirmation email ─────────────────────
    const emailTo = intent.guest_email
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
              <p style="font-size:13px;color:#555;margin:0 0 8px;"><strong>Order Total:</strong> ₹${intent.total}</p>
              <p style="font-size:13px;color:#555;margin:0 0 8px;"><strong>Shipping:</strong> ${intent.shipping_method} (${Number(intent.shipping_cost) === 0 ? 'Free' : '₹' + intent.shipping_cost})</p>
              <p style="font-size:13px;color:#555;margin:0;"><strong>Estimated Delivery:</strong> ${intent.shipping_method === 'Express' ? '2–3' : '5–7'} business days</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 28px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Track Your Order</a>
          </div>
        `,
      }).catch((e) => console.error('[verify-payment] email send failed:', e))
    }

    return NextResponse.json({ success: true, orderNumber: orderId })
  } catch (err) {
    console.error('[verify-payment]', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
