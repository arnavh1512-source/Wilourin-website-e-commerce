import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  const { email, password, fullName } = await request.json()
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const newUserId = authData.user?.id
  if (!newUserId) return NextResponse.json({ success: true })

  // Upsert profile (fallback if trigger didn't fire)
  const admin = createAdminClient()
  await admin.from('profiles').upsert({
    id: newUserId,
    full_name: fullName,
    loyalty_points: 0,
  })

  return NextResponse.json({ success: true })
}
