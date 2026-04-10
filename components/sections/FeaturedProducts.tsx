import Link from 'next/link'
import { ProductCard } from '@/components/ui/ProductCard'
import type { Product, ProductImage } from '@/lib/types'

interface FeaturedProductsProps {
  products: Array<Product & { images: ProductImage[] }>
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products.length) return null

  return (
    <section className="py-20 bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-3">Handpicked</p>
            <h2 className="font-serif text-4xl sm:text-5xl">Featured Pieces</h2>
          </div>
          <Link href="/products" className="hidden sm:block text-xs uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const primary = product.images.find((i) => i.is_primary)
            const secondary = product.images.find((i) => !i.is_primary)
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
        <div className="text-center mt-10 sm:hidden">
          <Link href="/products" className="text-xs uppercase tracking-widest underline underline-offset-4">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
