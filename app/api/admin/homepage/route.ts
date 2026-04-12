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

export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const [{ data: settings }, { data: products }, { data: categories }] = await Promise.all([
    supabase!.from('homepage_settings').select('*').eq('id', 1).single(),
    supabase!.from('products').select('id, name').eq('status', 'Published').order('name'),
    supabase!.from('categories').select('id, name').order('name'),
  ])

  return NextResponse.json({ settings: settings ?? {}, products: products ?? [], categories: categories ?? [] })
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const { error: dbError } = await supabase!.from('homepage_settings').upsert({ id: 1, ...body })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
