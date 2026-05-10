import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  product_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid product_id' }, { status: 400 })

  const admin = createAdminClient()
  await admin
    .from('recently_viewed')
    .upsert({ user_id: user.id, product_id: parsed.data.product_id, viewed_at: new Date().toISOString() }, { onConflict: 'user_id,product_id' })

  return NextResponse.json({ ok: true })
}
