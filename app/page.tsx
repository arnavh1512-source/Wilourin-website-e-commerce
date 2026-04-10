import { createClient } from '@/lib/supabase/server'
import { Hero } from '@/components/sections/Hero'
import { CategoryGrid } from '@/components/sections/CategoryGrid'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { ScarcityStrip } from '@/components/sections/ScarcityStrip'
import { CommunityFeed } from '@/components/sections/CommunityFeed'
import { NewsletterStrip } from '@/components/sections/NewsletterStrip'
import { TrustBadges } from '@/components/sections/TrustBadges'

export const revalidate = 30

export default async function HomePage() {
  const supabase = createClient()

  // Fetch all homepage data in parallel
  const [
    { data: settings },
    { data: rawCategories },
    { data: lookbook },
  ] = await Promise.all([
    supabase.from('homepage_settings').select('*').eq('id', 1).single(),
    supabase.from('categories').select('*').eq('is_active', true).is('parent_id', null).order('display_order'),
    supabase.from('lookbook_submissions').select('*').eq('status', 'Approved').order('created_at', { ascending: false }).limit(12),
  ])

  // Fetch featured products
  const featuredIds = settings?.featured_product_ids ?? []
  let featuredProducts: Array<{ id: string; name: string; slug: string; price: number; original_price: number | null; badge: string | null; images: Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }> }> = []

  if (featuredIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, badge, product_images(id, image_url, is_primary, display_order)')
      .eq('status', 'Published')
      .in('id', featuredIds)
      .limit(8)
    featuredProducts = (data ?? []).map((p: Record<string, unknown>) => ({
      ...(p as { id: string; name: string; slug: string; price: number; original_price: number | null; badge: string | null }),
      images: (p.product_images as Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>) ?? [],
    }))
  }

  // Fallback: fetch 8 featured/published products if none pinned
  if (featuredProducts.length === 0) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, badge, is_featured, product_images(id, image_url, is_primary, display_order)')
      .eq('status', 'Published')
      .eq('is_featured', true)
      .limit(8)
    featuredProducts = (data ?? []).map((p: Record<string, unknown>) => ({
      ...(p as { id: string; name: string; slug: string; price: number; original_price: number | null; badge: string | null }),
      images: (p.product_images as Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>) ?? [],
    }))
  }

  return (
    <>
      <Hero
        headline={settings?.hero_headline ?? null}
        subtext={settings?.hero_subtext ?? null}
        imageUrl={settings?.hero_image_url ?? null}
      />
      <TrustBadges />
      <CategoryGrid categories={rawCategories ?? []} />
      <ScarcityStrip />
      <FeaturedProducts products={featuredProducts as Parameters<typeof FeaturedProducts>[0]['products']} />
      <CommunityFeed submissions={lookbook ?? []} />
      <NewsletterStrip />
    </>
  )
}
