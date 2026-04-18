import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  loyalty_points_per_rupee: z.number().min(0).max(100),
})

async function getAdminSupabase() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return { supabase: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, error: null }
}

export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const [{ data: settings }, { data: transactions }] = await Promise.all([
    supabase!.from('store_settings').select('loyalty_points_per_rupee').eq('id', 1).single(),
    supabase!.from('loyalty_transactions')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({ settings, transactions: transactions ?? [] })
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { error: dbError } = await supabase!
    .from('store_settings')
    .update({ loyalty_points_per_rupee: parsed.data.loyalty_points_per_rupee })
    .eq('id', 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
