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
  const supabase = await createClient()

  let settings: Record<string, unknown> | null = null
  let rawCategories: unknown[] | null = null
  let lookbook: unknown[] | null = null
  let featuredProducts: Array<{ id: string; name: string; slug: string; price: number; original_price: number | null; badge: string | null; images: Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }> }> = []

  try {
    const [settingsRes, categoriesRes, lookbookRes] = await Promise.all([
      supabase.from('homepage_settings').select('*').eq('id', 1).single(),
      supabase.from('categories').select('*').eq('is_active', true).is('parent_id', null).order('display_order'),
      supabase.from('lookbook_submissions').select('*').eq('status', 'Approved').order('created_at', { ascending: false }).limit(12),
    ])
    settings = settingsRes.data
    rawCategories = categoriesRes.data
    lookbook = lookbookRes.data
  } catch (e) { console.error('[homepage] data fetch error:', e) }

  // Fetch featured products
  const featuredIds = (settings?.featured_product_ids as string[]) ?? []

  try {
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
  } catch (e) { console.error('[homepage] featured products error:', e) }

  return (
    <>
      <Hero
        headline={(settings?.hero_headline as string) ?? null}
        subtext={(settings?.hero_subtext as string) ?? null}
        imageUrl={(settings?.hero_image_url as string) ?? null}
      />
      <TrustBadges />
      <CategoryGrid categories={(rawCategories ?? []) as Parameters<typeof CategoryGrid>[0]['categories']} />
      <ScarcityStrip />
      <FeaturedProducts products={featuredProducts as Parameters<typeof FeaturedProducts>[0]['products']} />
      <CommunityFeed submissions={(lookbook ?? []) as Parameters<typeof CommunityFeed>[0]['submissions']} />
      <NewsletterStrip />
    </>
  )
}
