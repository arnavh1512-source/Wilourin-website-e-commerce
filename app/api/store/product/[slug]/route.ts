import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id, name, slug, description, price, original_price, badge,
      fit_note, model_height, model_size, meta_title, meta_description,
      tags, status, is_featured, category_id, created_at,
      product_images(id, image_url, display_order, is_primary),
      product_variants(id, size, color_name, color_hex, stock_qty, sku),
      categories(id, name, slug)
    `)
    .eq('slug', params.slug)
    .eq('status', 'Published')
    .single()

  if (error || !product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Scope reviews — exclude user_id (PII)
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, review_text, size_purchased, is_verified, helpful_count, created_at')
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
