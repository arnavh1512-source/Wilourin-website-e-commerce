import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'flat' | 'free_shipping'
  value: number
  expiry_date: string | null
  usage_limit: number | null
  usage_count: number
  min_order_amount: number
  per_user_limit: number
  is_active: boolean
}

const schema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/i),
  subtotal: z.number().min(0).max(1_000_000),
})

export async function POST(req: NextRequest) {
  // 10 attempts per minute per IP
  const { allowed, retryAfterMs } = checkRateLimit(`disc:${getIP(req)}`, 10, 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ valid: false, message: 'Invalid request' }, { status: 400 })
    const { code, subtotal } = parsed.data

    const admin = createAdminClient()
    const supabase = await createClient()

    const { data: discount } = await admin
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single() as unknown as { data: DiscountCode | null }

    if (!discount) return NextResponse.json({ valid: false, message: 'Invalid or expired promo code' })

    // Check expiry
    if (discount.expiry_date && new Date(discount.expiry_date) < new Date()) {
      return NextResponse.json({ valid: false, message: 'This promo code has expired' })
    }

    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return NextResponse.json({ valid: false, message: 'This promo code has reached its usage limit' })
    }

    // Check min order
    if (subtotal < discount.min_order_amount) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order of ₹${discount.min_order_amount} required for this code`,
      })
    }

    // Check per-user limit
    const { data: { user } } = await supabase.auth.getUser()
    if (discount.per_user_limit > 0 && !user) {
      return NextResponse.json({ valid: false, message: 'Please log in to use this promo code' })
    }
    if (user) {
      const { count } = await admin
        .from('discount_code_usage')
        .select('*', { count: 'exact', head: true })
        .eq('code_id', discount.id)
        .eq('user_id', user.id)

      if (discount.per_user_limit > 0 && (count ?? 0) >= discount.per_user_limit) {
        return NextResponse.json({ valid: false, message: 'You have already used this promo code' })
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.type === 'percentage') {
      discountAmount = Math.round((subtotal * discount.value) / 100)
    } else if (discount.type === 'flat') {
      discountAmount = Math.min(discount.value, subtotal)
    } else if (discount.type === 'free_shipping') {
      discountAmount = 0 // handled separately in checkout
    }

    return NextResponse.json({
      valid: true,
      code: { code: discount.code, type: discount.type, value: discount.value },
      discountAmount,
    })
  } catch {
    return NextResponse.json({ valid: false, message: 'Server error' }, { status: 500 })
  }
}
