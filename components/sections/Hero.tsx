'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'MEN', href: '/products?category=men' },
  { label: 'WOMEN', href: '/products?category=women' },
  { label: 'ACCESSORIES', href: '/products?category=accessories' },
  { label: 'NEW ARRIVALS', href: '/products?badge=New+Arrival' },
  { label: 'LOOKBOOK', href: '/lookbook' },
]

interface HeroProps {
  headline: string | null
  subtext: string | null
  imageUrl: string | null
  videoUrl?: string | null
}

export function Hero({ headline, subtext, imageUrl, videoUrl }: HeroProps) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelReady, setPanelReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setPanelReady(true), 4000)
    return () => clearTimeout(t)
  }, [])

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

      {/* LEFT PANEL — desktop */}
      {!isMobile && (
        <>
          <div
            className="absolute top-0 left-0 h-full flex flex-col"
            style={{
              width: 280,
              zIndex: 10,
              backgroundColor: 'rgba(26,26,26,0.85)',
              backdropFilter: 'blur(12px)',
              transform: panelReady && panelOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 500ms ease-out',
            }}
          >
            <div className="px-8 pt-10 pb-6 border-b border-white/10">
              <span className="font-prata text-white text-sm tracking-widest uppercase">Wilourin</span>
            </div>
            <nav className="flex flex-col gap-8 px-8 pt-10 flex-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-raleway text-white text-xs tracking-[0.2em] uppercase hover:text-brand-green-light transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {panelReady && (
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-white/70 hover:text-white transition-all duration-300"
              style={{
                zIndex: 11,
                left: panelOpen ? 280 : 0,
                transition: 'left 500ms ease-out, color 200ms',
                width: 24,
                height: 48,
                backgroundColor: 'rgba(26,26,26,0.7)',
              }}
              aria-label={panelOpen ? 'Collapse panel' : 'Expand panel'}
            >
              {panelOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </>
      )}

      {/* MOBILE BOTTOM SHEET */}
      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-10 flex flex-row overflow-x-auto gap-6 px-6 py-4"
          style={{ backgroundColor: 'rgba(26,26,26,0.85)', backdropFilter: 'blur(12px)' }}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-raleway text-white text-[10px] tracking-[0.2em] uppercase whitespace-nowrap hover:text-brand-green-light transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Bottom hero text + CTAs */}
      <div
        className="absolute bottom-16 md:bottom-14 left-1/2 -translate-x-1/2 text-center z-[5] px-4"
        style={{ marginLeft: !isMobile && panelOpen ? 140 : 0, transition: 'margin 500ms ease-out' }}
      >
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
