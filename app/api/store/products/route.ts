import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const size = searchParams.get('size')
  const badge = searchParams.get('badge')
  const minPrice = searchParams.get('min') ? Number(searchParams.get('min')) : undefined
  const maxPrice = searchParams.get('max') ? Number(searchParams.get('max')) : undefined
  const sort = searchParams.get('sort') ?? 'newest'
  const search = searchParams.get('search')

  // Fetch categories first if filtering by category
  let categoryIds: string[] | null = null
  if (category) {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug, parent_id')
      .eq('is_active', true)

    const cat = (categories ?? []).find((c) => c.slug === category)
    if (cat) {
      const subCatIds = (categories ?? []).filter((c) => c.parent_id === cat.id).map((c) => c.id)
      categoryIds = [cat.id, ...subCatIds]
    }
  }

  let query = supabase
    .from('products')
    .select('id, name, slug, price, original_price, badge, category_id, product_images(id, image_url, is_primary, display_order)')
    .eq('status', 'Published')

  if (categoryIds) query = query.in('category_id', categoryIds)
  if (badge) query = query.eq('badge', badge)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)

  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data: products, error } = await query.limit(48)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let result = products ?? []

  // Size filter post-query
  if (size) {
    const { data: variantProductIds } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('size', size)
      .gt('stock_qty', 0)
    const ids = new Set((variantProductIds ?? []).map((v) => v.product_id))
    result = result.filter((p) => ids.has(p.id))
  }

  return NextResponse.json(result)
}
