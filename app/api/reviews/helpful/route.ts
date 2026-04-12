import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const schema = z.object({ reviewId: z.string().uuid() })

export async function POST(req: NextRequest) {
  // 20 helpful votes per 15 minutes per IP
  const { allowed, retryAfterMs } = checkRateLimit(`rv:${getIP(req)}`, 20, 15 * 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid reviewId' }, { status: 400 })
    const { reviewId } = parsed.data

    const admin = createAdminClient()
    const { data: review } = await admin
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single()

    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

    const { error } = await admin
      .from('reviews')
      .update({ helpful_count: review.helpful_count + 1 })
      .eq('id', reviewId)

    if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    return NextResponse.json({ success: true, count: review.helpful_count + 1 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
