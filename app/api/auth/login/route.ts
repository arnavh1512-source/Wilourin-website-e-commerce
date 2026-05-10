import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

export async function POST(request: NextRequest) {
  const { allowed, retryAfterMs } = checkRateLimit(`auth-login:${getIP(request)}`, 10, 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  const body = await request.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  // Generic message — never reveal whether email exists
  if (error) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  return NextResponse.json({ success: true })
}
