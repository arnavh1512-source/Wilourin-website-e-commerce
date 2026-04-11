import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ui/ProductCard'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import { SortSelect } from '@/components/ui/SortSelect'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Shop All' }
export const revalidate = 60

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const BADGES = ['New Arrival', 'Sale', 'Bestseller', 'Low Stock']

interface Props {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = searchParams
  const category = typeof sp.category === 'string' ? sp.category : undefined
  const size = typeof sp.size === 'string' ? sp.size : undefined
  const badge = typeof sp.badge === 'string' ? sp.badge : undefined
  const minPrice = typeof sp.min === 'string' ? Number(sp.min) : undefined
  const maxPrice = typeof sp.max === 'string' ? Number(sp.max) : undefined
  const sort = typeof sp.sort === 'string' ? sp.sort : 'newest'

  const supabase = createClient()

  // Fetch categories for filter sidebar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('is_active', true)
    .order('display_order')

  // Build product query
  let query = supabase
    .from('products')
    .select('id, name, slug, price, original_price, badge, category_id, product_images(id, image_url, is_primary, display_order)')
    .eq('status', 'Published')

  if (category) {
    const cat = categories?.find((c) => c.slug === category)
    if (cat) {
      const subCatIds = (categories ?? []).filter((c) => c.parent_id === cat.id).map((c) => c.id)
      const ids = [cat.id, ...subCatIds]
      query = query.in('category_id', ids)
    }
  }
  if (badge) query = query.eq('badge', badge)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)

  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data: products } = await query.limit(48)

  // Size filter post-query (requires variant join)
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

  const parentCategories = (categories ?? []).filter((c) => !c.parent_id)

  const buildHref = (params: Record<string, string | undefined>) => {
    const base = new URLSearchParams()
    const merged = { category, size, badge, sort, ...params }
    Object.entries(merged).forEach(([k, v]) => { if (v) base.set(k, v) })
    return `/products?${base.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl mb-1">{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}</h1>
        <p className="text-sm text-gray-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-52 shrink-0 space-y-8">
          {/* Category */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold mb-3">Category</h3>
            <ul className="space-y-1.5">
              <li>
                <a href="/products" className={`text-sm ${!category ? 'font-semibold' : 'text-gray-600 hover:text-black'}`}>All</a>
              </li>
              {parentCategories.map((cat) => (
                <li key={cat.id}>
                  <a href={buildHref({ category: cat.slug })} className={`text-sm ${category === cat.slug ? 'font-semibold' : 'text-gray-600 hover:text-black'}`}>
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Size */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold mb-3">Size</h3>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <a
                  key={s}
                  href={buildHref({ size: size === s ? undefined : s })}
                  className={`text-xs border px-2.5 py-1 rounded transition-colors ${size === s ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'border-gray-300 text-gray-600 hover:border-gray-600'}`}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Badge */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold mb-3">Collection</h3>
            <ul className="space-y-1.5">
              {BADGES.map((b) => (
                <li key={b}>
                  <a href={buildHref({ badge: badge === b ? undefined : b })} className={`text-sm ${badge === b ? 'font-semibold' : 'text-gray-600 hover:text-black'}`}>
                    {b}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Clear */}
          {(category || size || badge) && (
            <a href="/products" className="text-xs underline text-gray-500 hover:text-black">Clear all filters</a>
          )}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {/* Sort */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              <SortSelect value={sort} />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="font-serif text-2xl mb-2">No products found</p>
              <p className="text-sm mb-6">Try adjusting your filters.</p>
              <a href="/products" className="text-xs uppercase tracking-widest underline">Clear filters</a>
            </div>
          ) : (
            <Suspense fallback={<SkeletonGrid />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product) => {
                  const imgs = (product.product_images as Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>) ?? []
                  const primary = imgs.find((i) => i.is_primary) ?? imgs[0]
                  const secondary = imgs.find((i) => !i.is_primary)
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
                    />
                  )
                })}
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
