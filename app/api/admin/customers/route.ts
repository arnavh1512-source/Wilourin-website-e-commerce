import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [{ data: profiles, error }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone, avatar_url, loyalty_points, loyalty_tier, created_at').order('created_at', { ascending: false }),
    supabase.from('orders').select('user_id, total').eq('payment_status', 'Paid').not('user_id', 'is', null),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!profiles) return NextResponse.json([])

  const orderMap = new Map<string, { count: number; total: number }>()
  for (const o of orders ?? []) {
    const e = orderMap.get(o.user_id) ?? { count: 0, total: 0 }
    orderMap.set(o.user_id, { count: e.count + 1, total: e.total + Number(o.total) })
  }

  const enriched = profiles.map((p) => {
    const stats = orderMap.get(p.id) ?? { count: 0, total: 0 }
    return { ...p, orderCount: stats.count, totalSpent: Math.round(stats.total) }
  })

  return NextResponse.json(enriched)
}
