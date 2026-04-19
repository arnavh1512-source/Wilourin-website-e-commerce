import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const discountSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  type: z.enum(['percentage', 'flat', 'free_shipping']),
  value: z.number().min(0),
  min_order_amount: z.number().min(0).optional().default(0),
  usage_limit: z.number().int().positive().optional().nullable(),
  per_user_limit: z.number().int().positive().optional().default(1),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional().default(true),
})

const updateSchema = discountSchema.partial().extend({ id: z.string().uuid() })

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
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const parsed = discountSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error: dbError } = await supabase!.from('discount_codes').insert(parsed.data).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { id, ...data } = parsed.data
  const { error: dbError } = await supabase!.from('discount_codes').update(data).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { error: dbError } = await supabase!.from('discount_codes').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
