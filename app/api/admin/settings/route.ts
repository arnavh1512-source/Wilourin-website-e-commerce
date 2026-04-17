import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const settingsSchema = z.object({
  store_name: z.string().max(200).optional(),
  store_email: z.string().email().optional(),
  store_phone: z.string().max(20).optional(),
  store_address: z.string().max(500).optional(),
  currency: z.string().max(10).optional(),
  free_shipping_threshold: z.number().min(0).optional(),
  standard_shipping_cost: z.number().min(0).optional(),
  express_shipping_cost: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  order_confirmation_email: z.boolean().optional(),
  shipping_email: z.boolean().optional(),
  return_policy_days: z.number().int().min(0).optional(),
  maintenance_mode: z.boolean().optional(),
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

  const { data, error: dbError } = await supabase!.from('store_settings').select('*').eq('id', 1).single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? {})
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { error: dbError } = await supabase!.from('store_settings').upsert({ id: 1, ...parsed.data })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
