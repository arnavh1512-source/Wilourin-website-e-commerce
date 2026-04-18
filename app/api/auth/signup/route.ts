import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100).trim(),
})

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const { allowed, retryAfterMs } = checkRateLimit(`auth-signup:${getIP(request)}`, 5, 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  const body = await request.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { email, password, fullName } = parsed.data
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const newUserId = authData.user?.id
  if (!newUserId) return NextResponse.json({ success: true })

  const admin = createAdminClient()
  await admin.from('profiles').upsert({ id: newUserId, full_name: fullName, loyalty_points: 0 })

  return NextResponse.json({ success: true })
}
