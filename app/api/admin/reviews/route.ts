import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminSupabase() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = createAdminClient()
  const { data: adminRow } = await admin.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return { supabase: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase: admin, error: null }
}

export async function GET(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return error!

  const { searchParams } = new URL(req.url)
  const product_id = searchParams.get('product_id')
  const rating = searchParams.get('rating')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('reviews')
    .select('*, products(id, name, slug)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (product_id) query = query.eq('product_id', product_id)
  if (rating) query = query.eq('rating', Number(rating))
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error: err } = await query
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const patchSchema = z.object({
  id: z.string().uuid(),
  is_verified: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return error!

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { id, ...updates } = parsed.data
  const { data, error: err } = await supabase.from('reviews').update(updates).eq('id', id).select().single()
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return error!

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error: err } = await supabase.from('reviews').delete().eq('id', id)
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
