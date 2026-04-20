import { NextRequest, NextResponse } from 'next/server'
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
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('recently_viewed')
    .select('product_id, viewed_at, products(id, name, slug)')
    .order('viewed_at', { ascending: false })
    .limit(500)

  if (from) query = query.gte('viewed_at', from)
  if (to) query = query.lte('viewed_at', to)

  const { data, error: err } = await query
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })

  // Group by product_id and count views
  const counts: Record<string, { product_id: string; name: string; slug: string; views: number; last_viewed: string }> = {}
  for (const row of data ?? []) {
    const pid = row.product_id
    const product = (Array.isArray(row.products) ? row.products[0] : row.products) as { id: string; name: string; slug: string } | null
    if (!counts[pid]) {
      counts[pid] = { product_id: pid, name: product?.name ?? pid, slug: product?.slug ?? '', views: 0, last_viewed: row.viewed_at }
    }
    counts[pid].views++
    if (row.viewed_at > counts[pid].last_viewed) counts[pid].last_viewed = row.viewed_at
  }

  const result = Object.values(counts).sort((a, b) => b.views - a.views)
  return NextResponse.json(result)
}
