import Link from 'next/link'
import { ProductCard } from '@/components/ui/ProductCard'
import type { Product, ProductImage } from '@/lib/types'

interface FeaturedProductsProps {
  products: Array<Product & { images: ProductImage[] }>
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products.length) return null

  return (
    <section className="py-16 bg-brand-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.4em] text-w-graphite mb-3">Handpicked</p>
            <h2 className="font-serif text-w-dark text-4xl sm:text-5xl">Featured Pieces</h2>
          </div>
          <Link href="/products" className="hidden sm:block font-sans text-xs uppercase tracking-widest text-w-graphite hover:text-w-dark transition-colors underline underline-offset-4">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-w-ghost">
          {products.map((product, i) => {
            const primary = product.images.find((img) => img.is_primary)
            const secondary = product.images.find((img) => !img.is_primary)
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
                aspectRatio={i % 2 === 0 ? '2/3' : '3/4'}
              />
            )
          })}
        </div>
        <div className="text-center mt-8 sm:hidden">
          <Link href="/products" className="font-sans text-xs uppercase tracking-widest text-w-graphite hover:text-w-dark underline underline-offset-4">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
