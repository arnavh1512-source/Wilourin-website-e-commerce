'use client'

import Link from 'next/link'
import Image from 'next/image'

interface HeroProps {
  headline: string | null
  subtext: string | null
  imageUrl: string | null
}

export function Hero({ headline, subtext, imageUrl }: HeroProps) {
  const defaultImage = 'https://images.unsplash.com/photo-1503341338985-95ad33e8e0b4?w=1600&q=90'

  return (
    <section className="relative h-[92vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src={imageUrl ?? defaultImage}
        alt="Wilourin hero"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.4em] mb-6 opacity-80">New Collection</p>
        <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-light leading-none mb-6 text-balance">
          {headline ?? 'Dress the Streets.'}
        </h1>
        <p className="text-base sm:text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
          {subtext ?? 'Premium Indian streetwear crafted for the bold and fearless.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products?category=men"
            className="bg-white text-[#0A0A0A] px-10 py-4 text-sm uppercase tracking-widest font-medium hover:bg-off-white transition-colors"
          >
            Shop Men
          </Link>
          <Link
            href="/products?category=women"
            className="border border-white text-white px-10 py-4 text-sm uppercase tracking-widest font-medium hover:bg-white/10 transition-colors"
          >
            Shop Women
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <div className="w-px h-10 bg-white/30 animate-pulse" />
      </div>
    </section>
  )
}
