import Link from 'next/link'
import Image from 'next/image'
import type { Category } from '@/lib/types'

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) return null

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-3">Browse</p>
        <h2 className="font-serif text-4xl sm:text-5xl">Shop by Category</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.slice(0, 3).map((cat, i) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`group relative overflow-hidden ${i === 0 ? 'sm:row-span-2' : ''}`}
            style={{ minHeight: i === 0 ? '520px' : '240px' }}
          >
            <Image
              src={cat.image_url ?? 'https://images.unsplash.com/photo-1503341338985-95ad33e8e0b4?w=800'}
              alt={cat.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="font-serif text-3xl font-light mb-1">{cat.name}</h3>
              <span className="text-xs uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                Shop Now →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
