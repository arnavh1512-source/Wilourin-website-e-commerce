import Link from 'next/link'
import Image from 'next/image'

const TILES = [
  {
    label: 'Men',
    href: '/products?category=men',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
  },
  {
    label: 'Women',
    href: '/products?category=women',
    image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80',
  },
  {
    label: 'Accessories',
    href: '/products?category=accessories',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80',
  },
  {
    label: 'New Arrivals',
    href: '/products?badge=New+Arrival',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
  },
  {
    label: 'Sale',
    href: '/products?badge=Sale',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
  },
]

export function CategoryTiles() {
  return (
    <section className="bg-w-bg py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-w-dark text-3xl mb-8">Shop by Category</h2>
        <div className="flex gap-px overflow-x-auto lg:grid lg:grid-cols-5 bg-w-ghost">
          {TILES.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="relative flex-shrink-0 w-48 lg:w-auto overflow-hidden group cursor-pointer"
              style={{ aspectRatio: '2/3' }}
            >
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 192px, 20vw"
              />
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-w-dark/75 via-transparent to-transparent" />
              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="font-sans text-white text-xs tracking-widest uppercase block">
                  {tile.label}
                </span>
                <div className="mt-1 h-0.5 bg-w-forest w-0 group-hover:w-full transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
