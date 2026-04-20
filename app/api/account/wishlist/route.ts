import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('wishlist')
    .select('*, products(id, name, slug, original_price, price, product_images(image_url, is_primary))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = z.object({ product_id: z.string().uuid() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid product_id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('wishlist')
    .upsert({ user_id: user.id, product_id: parsed.data.product_id }, { onConflict: 'user_id,product_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const byRow = z.object({ id: z.string().uuid() }).safeParse(body)
  const byProduct = z.object({ product_id: z.string().uuid() }).safeParse(body)
  if (!byRow.success && !byProduct.success) return NextResponse.json({ error: 'Invalid id or product_id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const query = byRow.success
    ? supabase.from('wishlist').delete().eq('id', byRow.data.id).eq('user_id', user.id)
    : supabase.from('wishlist').delete().eq('product_id', byProduct.data!.product_id).eq('user_id', user.id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
