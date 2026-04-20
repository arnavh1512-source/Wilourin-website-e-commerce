import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ui/ProductCard'
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Shop All' }
export const revalidate = 60

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const FILTER_PILLS = [
  { label: 'View All', href: '/products' },
  { label: 'Men', href: '/products?category=men' },
  { label: 'Women', href: '/products?category=women' },
  { label: 'Accessories', href: '/products?category=accessories' },
  { label: 'New', href: '/products?badge=New+Arrival' },
  { label: 'Sale', href: '/products?badge=Sale' },
]

interface Props {
  searchParams: Record<string, string | string[] | undefined>
}

function isActive(pill: { href: string }, { category, badge }: { category?: string; badge?: string }) {
  if (pill.href === '/products') return !category && !badge
  if (pill.href.includes('category=men')) return category === 'men'
  if (pill.href.includes('category=women')) return category === 'women'
  if (pill.href.includes('category=accessories')) return category === 'accessories'
  if (pill.href.includes('New+Arrival')) return badge === 'New Arrival'
  if (pill.href.includes('Sale')) return badge === 'Sale'
  return false
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = searchParams
  const category = typeof sp.category === 'string' ? sp.category : undefined
  const size = typeof sp.size === 'string' ? sp.size : undefined
  const badge = typeof sp.badge === 'string' ? sp.badge : undefined
  const minPrice = typeof sp.min === 'string' ? Number(sp.min) : undefined
  const maxPrice = typeof sp.max === 'string' ? Number(sp.max) : undefined
  const sort = typeof sp.sort === 'string' ? sp.sort : 'newest'

  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('is_active', true)
    .order('display_order')

  let query = supabase
    .from('products')
    .select('id, name, slug, price, original_price, badge, category_id, product_images(id, image_url, is_primary, display_order)')
    .eq('status', 'Published')

  if (category) {
    const cat = categories?.find((c) => c.slug === category)
    if (cat) {
      const subCatIds = (categories ?? []).filter((c) => c.parent_id === cat.id).map((c) => c.id)
      query = query.in('category_id', [cat.id, ...subCatIds])
    }
  }
  if (badge) query = query.eq('badge', badge)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)

  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data: products } = await query.limit(200)

  let filteredProducts = products ?? []
  if (size) {
    const { data: variantProductIds } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('size', size)
      .gt('stock_qty', 0)
    const ids = new Set((variantProductIds ?? []).map((v) => v.product_id))
    filteredProducts = filteredProducts.filter((p) => ids.has(p.id))
  }

  const buildHref = (params: Record<string, string | undefined>) => {
    const base = new URLSearchParams()
    const merged = { category, size, badge, sort, ...params }
    Object.entries(merged).forEach(([k, v]) => { if (v) base.set(k, v) })
    const qs = base.toString()
    return `/products${qs ? `?${qs}` : ''}`
  }

  const title = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : badge ?? 'All Products'

  return (
    <div className="bg-brand-background min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <h1 className="font-serif text-w-dark text-4xl mb-1">{title}</h1>
        <p className="font-sans text-sm text-w-graphite">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Horizontal filter pills */}
      <div className="sticky top-16 z-30 bg-brand-background/95 backdrop-blur-sm border-b border-w-ghost">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            {FILTER_PILLS.map((pill) => {
              const active = isActive(pill, { category, badge })
              return (
                <Link
                  key={pill.href}
                  href={pill.href}
                  className={`flex-shrink-0 font-sans text-xs tracking-widest uppercase px-4 py-2 rounded-none transition-colors ${
                    active
                      ? 'bg-w-forest text-white'
                      : 'border border-w-ghost text-w-graphite hover:border-white hover:text-white'
                  }`}
                >
                  {pill.label}
                </Link>
              )
            })}

            {/* Size pills */}
            <div className="w-px h-5 bg-w-ghost mx-2 flex-shrink-0" />
            {SIZES.map((s) => (
              <Link
                key={s}
                href={buildHref({ size: size === s ? undefined : s })}
                className={`flex-shrink-0 font-sans text-xs tracking-widest uppercase px-3 py-2 rounded-none transition-colors ${
                  size === s
                    ? 'bg-w-forest text-white'
                    : 'border border-w-ghost text-w-graphite hover:border-white hover:text-white'
                }`}
              >
                {s}
              </Link>
            ))}

            {/* Sort */}
            <div className="ml-auto flex-shrink-0 flex items-center gap-2">
              {(['newest', 'price_asc', 'price_desc'] as const).map((s) => (
                <Link
                  key={s}
                  href={buildHref({ sort: s })}
                  className={`font-sans text-xs tracking-widest uppercase px-3 py-2 rounded-none transition-colors ${
                    sort === s ? 'text-w-dark font-medium' : 'text-w-graphite hover:text-w-dark'
                  }`}
                >
                  {s === 'newest' ? 'New' : s === 'price_asc' ? 'Low' : 'High'}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-w-dark text-2xl mb-2">No products found</p>
            <p className="font-sans text-sm text-w-graphite mb-6">Try adjusting your filters.</p>
            <Link href="/products" className="font-sans text-xs uppercase tracking-widest underline text-w-graphite hover:text-w-dark">Clear filters</Link>
          </div>
        ) : (
          <Suspense fallback={
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-w-ghost">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-w-surface skeleton" style={{ aspectRatio: i % 2 === 0 ? '2/3' : '3/4' }} />
              ))}
            </div>
          }>
            {/* Zara-style staggered masonry */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-w-ghost">
              {filteredProducts.map((product, index) => {
                const imgs = (product.product_images as Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>) ?? []
                const primary = imgs.find((i) => i.is_primary) ?? imgs[0]
                const secondary = imgs.find((i) => !i.is_primary)
                const aspectRatio = index % 2 === 0 ? '2/3' : '3/4'
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    original_price={product.original_price}
                    badge={product.badge}
                    primaryImage={primary?.image_url ?? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'}
                    secondaryImage={secondary?.image_url}
                    aspectRatio={aspectRatio}
                  />
                )
              })}
            </div>
          </Suspense>
        )}
      </div>
    </div>
  )
}
