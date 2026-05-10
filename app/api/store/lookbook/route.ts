import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

const submitSchema = z.object({
  submitter_name: z.string().min(2).max(100).trim(),
  instagram_handle: z.string().max(50).regex(/^@?[\w.]+$/).optional().or(z.literal('')),
  photo_url: z.string().url().max(2000).refine(
    (url) => url.startsWith('https://'),
    'Photo URL must use HTTPS'
  ),
})

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lookbook_submissions')
    .select('id, submitter_name, instagram_handle, photo_url, created_at')
    .eq('status', 'Approved')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  // 3 submissions per hour per IP
  const { allowed, retryAfterMs } = checkRateLimit(`lb:${getIP(request)}`, 3, 60 * 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  const supabase = await createClient()

  const body = await request.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 })
  }
  const { submitter_name, instagram_handle, photo_url } = parsed.data

  const { error } = await supabase.from('lookbook_submissions').insert({
    submitter_name,
    instagram_handle: instagram_handle || null,
    photo_url,
    status: 'Pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
