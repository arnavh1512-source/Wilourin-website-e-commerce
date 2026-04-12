import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(`*, product_images(*), product_variants(*), categories(id, name, slug)`)
    .eq('slug', params.slug)
    .eq('status', 'Published')
    .single()

  if (error || !product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })

  const { data: related } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, badge, product_images(id, image_url, is_primary)')
    .eq('status', 'Published')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)

  return NextResponse.json({ product, reviews: reviews ?? [], related: related ?? [] })
}
