import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  // Manually insert profile as fallback in case the trigger fails
  if (authData.user) {
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name: fullName,
      referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    })
  }

  return NextResponse.json({ success: true })
}
