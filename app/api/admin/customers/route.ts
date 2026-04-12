import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!profiles) return NextResponse.json([])

  // Enrich with order stats
  const enriched = await Promise.all(profiles.map(async (p) => {
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .eq('user_id', p.id)
      .eq('payment_status', 'Paid')
    const totalSpent = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0)
    return { ...p, orderCount: orders?.length ?? 0, totalSpent: Math.round(totalSpent) }
  }))

  return NextResponse.json(enriched)
}
