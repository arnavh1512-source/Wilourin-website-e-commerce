import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json()
    if (!code) return NextResponse.json({ valid: false, message: 'No code provided' })

    const admin = createAdminClient()
    const supabase = await createClient()

    const { data: discount } = await admin
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

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

    // Check per-user limit for logged-in users
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { count } = await admin
        .from('discount_code_usage')
        .select('*', { count: 'exact', head: true })
        .eq('code_id', discount.id)
        .eq('user_id', user.id)

      if ((count ?? 0) >= discount.per_user_limit) {
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

    return NextResponse.json({ valid: true, code: discount, discountAmount })
  } catch (error) {
    return NextResponse.json({ valid: false, message: 'Server error' }, { status: 500 })
  }
}
