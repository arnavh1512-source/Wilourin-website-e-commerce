import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { reviewId } = await req.json()
    if (!reviewId) return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 })

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
