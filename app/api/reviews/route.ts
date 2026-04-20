import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

const schema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(1000).optional(),
  size_purchased: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).optional(),
})

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const { allowed, retryAfterMs } = checkRateLimit(`review:${ip}`, 5, 60 * 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  const authClient = await createClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Login required to write a review' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const { product_id, rating, review_text, size_purchased } = parsed.data
  const admin = createAdminClient()

  // Verify product exists
  const { data: product } = await admin.from('products').select('id, name').eq('id', product_id).single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Prevent duplicate reviews from same user on same product
  const { data: existing } = await admin.from('reviews').select('id').eq('user_id', user.id).eq('product_id', product_id).single()
  if (existing) return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })

  // Get reviewer name from profile
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
  const reviewer_name = profile?.full_name ?? user.email?.split('@')[0] ?? 'Anonymous'

  const { data: review, error } = await admin.from('reviews').insert({
    product_id,
    user_id: user.id,
    reviewer_name,
    rating,
    review_text: review_text ?? null,
    size_purchased: size_purchased ?? null,
    is_verified: false,
    helpful_count: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(review, { status: 201 })
}
