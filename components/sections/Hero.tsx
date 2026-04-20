'use client'

import Link from 'next/link'

interface HeroProps {
  headline: string | null
  subtext: string | null
  imageUrl: string | null
  videoUrl?: string | null
}

export function Hero({ headline, subtext, imageUrl, videoUrl }: HeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden bg-neutral-900"
      style={{
        height: '100vh',
        ...(imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
      }}
    >
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ zIndex: 0 }}
      >
        {videoUrl && <source src={videoUrl} type="video/mp4" />}
        <source src="/hero.mp4" type="video/mp4" />
        <source
          src="https://videos.pexels.com/video-files/3931949/3931949-uhd_2560_1440_25fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/75" style={{ zIndex: 1 }} />

      {/* Hero text + CTAs */}
      <div className="absolute bottom-16 md:bottom-14 left-1/2 -translate-x-1/2 text-center z-[5] px-4 w-full max-w-3xl">
        <h1 className="font-prata text-white text-4xl md:text-6xl font-light mb-4 leading-tight">
          {headline ?? 'DRESS THE STREETS'}
        </h1>
        <p className="font-raleway text-white/60 text-xs tracking-[0.3em] uppercase mb-8 font-light">
          {subtext ?? 'Premium Indian Fashion'}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/products"
            className="font-raleway text-xs uppercase tracking-[0.2em] bg-brand-green text-white px-8 py-3 hover:bg-brand-green-light transition-colors duration-200"
          >
            Shop Now
          </Link>
          <Link
            href="/lookbook"
            className="font-raleway text-xs uppercase tracking-[0.2em] border border-white text-white px-8 py-3 hover:bg-white hover:text-brand-dark transition-colors duration-200"
          >
            Lookbook
          </Link>
        </div>
        <div className="w-px h-8 bg-white/30 mx-auto mt-8 animate-scroll-down" />
      </div>
    </section>
  )
}
