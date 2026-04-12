import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductDetail } from './ProductDetail'

export const revalidate = 60

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name, meta_title, meta_description').eq('slug', params.slug).single()
  return {
    title: data?.meta_title ?? data?.name,
    description: data?.meta_description ?? undefined,
  }
}

export default async function ProductPage({ params }: Props) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`*, product_images(*), product_variants(*), categories(id, name, slug)`)
    .eq('slug', params.slug)
    .eq('status', 'Published')
    .single()

  if (!product) notFound()

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

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <ProductDetail
      product={product}
      reviews={reviews ?? []}
      related={related ?? []}
      avgRating={avgRating}
    />
  )
}
