import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAdminSupabase() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return { supabase: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, error: null }
}

export async function GET(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let q = supabase!.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
  if (status) q = q.eq('order_status', status)
  if (search) q = q.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`)

  const { data, error: dbError } = await q
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const { id, fields } = body
  if (!id || !fields) return NextResponse.json({ error: 'Missing id or fields' }, { status: 400 })

  const { data, error: updateError } = await supabase!.from('orders').update(fields).eq('id', id).select().single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(data)
}
