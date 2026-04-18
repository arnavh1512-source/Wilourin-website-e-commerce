import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const LOOKBOOK_STATUSES = ['Pending', 'Approved', 'Rejected'] as const

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LOOKBOOK_STATUSES),
})

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

  // Validate status filter if provided
  const validStatus = status && (LOOKBOOK_STATUSES as readonly string[]).includes(status) ? status : null

  let q = supabase!.from('lookbook_submissions').select('*').order('created_at', { ascending: false })
  if (validStatus) q = q.eq('status', validStatus)

  const { data, error: dbError } = await q
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { id, status } = parsed.data
  const { error: dbError } = await supabase!.from('lookbook_submissions').update({ status }).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
