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

export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return error!

  const { data, error: err } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })

  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const patchSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return error!

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { id, is_active } = parsed.data
  const { data, error: err } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single()

  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  return NextResponse.json(data)
}
