import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

// Run this once in Supabase SQL editor:
// CREATE OR REPLACE FUNCTION increment_review_helpful(review_id uuid)
// RETURNS int LANGUAGE sql AS $$
//   UPDATE reviews SET helpful_count = helpful_count + 1
//   WHERE id = review_id RETURNING helpful_count;
// $$;

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const schema = z.object({ reviewId: z.string().uuid() })

export async function POST(req: NextRequest) {
  const { allowed, retryAfterMs } = checkRateLimit(`rv:${getIP(req)}`, 20, 15 * 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid reviewId' }, { status: 400 })
    const { reviewId } = parsed.data

    const admin = createAdminClient()

    // Atomic increment via RPC — avoids read-modify-write race condition
    const { data: newCount, error } = await admin.rpc('increment_review_helpful', { review_id: reviewId })

    if (error) {
      console.error('[reviews/helpful] rpc error:', error.message)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    if (newCount === null) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

    return NextResponse.json({ success: true, count: newCount })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
