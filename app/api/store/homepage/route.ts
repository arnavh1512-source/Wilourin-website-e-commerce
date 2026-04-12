import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const [{ data: settings }, { data: categories }] = await Promise.all([
    supabase.from('homepage_settings').select('*').eq('id', 1).single(),
    supabase.from('categories').select('id, name, slug, image_url').eq('is_active', true).order('display_order'),
  ])

  // Fetch featured products if any IDs are configured
  let featuredProducts: any[] = []
  if (settings?.featured_product_ids?.length) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, badge, product_images(id, image_url, is_primary)')
      .in('id', settings.featured_product_ids)
      .eq('status', 'Published')
    featuredProducts = data ?? []
  }

  return NextResponse.json({
    settings: settings ?? {},
    categories: categories ?? [],
    featuredProducts,
  })
}
