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
  const { email, password, fullName, referralCode } = await request.json()
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
    referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    loyalty_points: 0,
  })

  // Handle referral
  if (referralCode) {
    const code = String(referralCode).trim().toUpperCase()

    const { data: referrer } = await admin
      .from('profiles')
      .select('id, loyalty_points')
      .eq('referral_code', code)
      .neq('id', newUserId)
      .single()

    if (referrer) {
      const referrerId = referrer.id as string
      const referrerCurrentPoints = (referrer.loyalty_points as number) ?? 0

      await Promise.all([
        // Tag new user as referred
        admin.from('profiles').update({ referred_by: referrerId, loyalty_points: 50 }).eq('id', newUserId),

        // Referrer gets 100 points
        admin.from('profiles').update({ loyalty_points: referrerCurrentPoints + 100 }).eq('id', referrerId),

        // Loyalty transaction for referrer
        admin.from('loyalty_transactions').insert({
          user_id: referrerId,
          type: 'referral',
          points: 100,
          description: 'Referral bonus — friend joined Wilourin',
        }),

        // Loyalty transaction for new user
        admin.from('loyalty_transactions').insert({
          user_id: newUserId,
          type: 'referral',
          points: 50,
          description: 'Welcome bonus — signed up via referral',
        }),
      ])
    }
  }

  return NextResponse.json({ success: true })
}
