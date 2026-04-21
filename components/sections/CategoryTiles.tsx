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
    label: 'Combo',
    href: '/products?category=combo',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
  },
]

export function CategoryTiles() {
  return (
    <section className="bg-brand-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-prata text-white text-2xl sm:text-3xl mb-6 sm:mb-8">Shop by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-w-ghost">
          {TILES.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="relative overflow-hidden group cursor-pointer aspect-[3/2] sm:aspect-[2/3]"
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
