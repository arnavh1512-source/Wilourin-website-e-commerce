'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag, Heart, User, Search, Menu, X, Crown } from 'lucide-react'
import { useCartStore, useUIStore, useWishlistStore } from '@/lib/store'
import { AnnouncementBar } from './AnnouncementBar'
import { cn } from '@/lib/utils'
import { detectCityByIP, getStoredCity, setStoredCity } from '@/lib/location'

// L3: module-level cache — Navbar persists across soft navigations so these
// fetch once per browser session rather than on every route change
const _cache: { announcement?: string | null; city?: string; profile?: { full_name?: string; avatar_url?: string; loyalty_tier?: string } | null; isAdmin?: boolean } = {}

const NAV_LINKS = [
  { label: 'Men', href: '/products?category=men' },
  { label: 'Women', href: '/products?category=women' },
  { label: 'Accessories', href: '/products?category=accessories' },
  { label: 'Lookbook', href: '/lookbook' },
  { label: 'About', href: '/about' },
]

const TIER_COLORS: Record<string, string> = {
  Gold: 'text-yellow-500',
  Silver: 'text-gray-400',
  Bronze: 'text-amber-700',
}

export function Navbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [announcement, setAnnouncement] = useState<string | null>(null)
  // L2: null = loading, prevents city flash before real data resolves
  const [announcementReady, setAnnouncementReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [detectedCity, setDetectedCity] = useState<string>('')

  const { toggleCart: uiToggleCart, toggleSearch } = useUIStore()
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const cartCount = useCartStore((s) => s.getItemCount())
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; loyalty_tier?: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // H3: check both pathname and query params for active link
  const isActive = useCallback((href: string) => {
    const [hPath, hQuery] = href.split('?')
    if (pathname !== hPath) return false
    if (!hQuery) return true
    return hQuery.split('&').every(pair => {
      const [k, v] = pair.split('=')
      return searchParams.get(k) === v
    })
  }, [pathname, searchParams])

  // L2 + L3: fetch announcement once, cache result, no city flash
  useEffect(() => {
    if ('announcement' in _cache) {
      setAnnouncement(_cache.announcement ?? null)
      setAnnouncementReady(true)
      return
    }
    fetch('/api/store/homepage')
      .then((r) => r.json())
      .then((data) => {
        const text = data?.settings?.announcement_text ?? null
        _cache.announcement = text
        setAnnouncement(text)
        setAnnouncementReady(true)
      })
      .catch(() => { _cache.announcement = null; setAnnouncementReady(true) })
  }, [])

  useEffect(() => {
    if (_cache.city) { setDetectedCity(_cache.city); return }
    const stored = getStoredCity()
    if (stored) { _cache.city = stored; setDetectedCity(stored); return }
    detectCityByIP()
      .then((city) => { if (city) { _cache.city = city; setStoredCity(city); setDetectedCity(city) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if ('profile' in _cache) {
      setProfile(_cache.profile ?? null)
      setIsAdmin(_cache.isAdmin ?? false)
      return
    }
    fetch('/api/account/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        _cache.profile = data?.profile ?? null
        _cache.isAdmin = data?.isAdmin ?? false
        setProfile(_cache.profile ?? null)
        setIsAdmin(_cache.isAdmin ?? false)
      })
      .catch(() => { _cache.profile = null; _cache.isAdmin = false })
  }, [])

  const isAdminRoute = pathname.startsWith('/admin')
  if (isAdminRoute) return null

  // M4: dark only on homepage — evaluated per render so it tracks navigation correctly
  const dark = pathname === '/'

  // L2: show announcement bar only once data has resolved to avoid city flash
  const announcementText = announcementReady
    ? (announcement ?? (detectedCity ? `Delivering to ${detectedCity}` : null))
    : null

  return (
    <>
      <AnnouncementBar text={announcementText} />
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          dark ? 'bg-w-dark border-b border-white/10' : 'bg-w-bg border-b border-w-ghost shadow-sm'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Nav links */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'font-sans text-sm tracking-wide transition-colors duration-200',
                    isActive(link.href)
                      ? (dark ? 'text-w-emerald border-b border-w-emerald' : 'text-w-forest border-b border-w-forest')
                      : (dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile — hamburger */}
            <button
              className={cn('lg:hidden p-2 transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Center — Logo */}
            <Link
              href="/"
              className={cn('absolute left-1/2 -translate-x-1/2 font-serif text-2xl tracking-[0.15em] uppercase', dark ? 'text-white' : 'text-w-dark')}
            >
              Wilourin
            </Link>

            {/* Right — Icons */}
            <div className="flex items-center gap-4">
              <button onClick={toggleSearch} aria-label="Search"
                className={cn('transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}>
                <Search size={20} />
              </button>
              <Link href="/wishlist" aria-label="Wishlist"
                className={cn('relative transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}>
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-w-forest text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button onClick={uiToggleCart} aria-label="Cart"
                className={cn('relative transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}>
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-w-forest text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-bounce-once">
                    {cartCount}
                  </span>
                )}
              </button>
              <Link href={profile ? '/account' : '/login'} aria-label="Account"
                className={cn('relative transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}>
                <User size={20} />
                {profile && (
                  <span className={cn('absolute -top-1.5 -right-1.5 text-[8px]', TIER_COLORS[profile.loyalty_tier ?? ''])}>
                    <Crown size={10} />
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link href="/admin" className={cn('hidden lg:block font-sans text-xs uppercase tracking-widest transition-colors', dark ? 'text-white/50 hover:text-white' : 'text-w-graphite hover:text-w-dark')}>
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-w-bg flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-6 py-5 border-b border-w-ghost">
            <span className="font-serif text-2xl tracking-[0.15em] uppercase text-w-dark">Wilourin</span>
            <button onClick={() => setMenuOpen(false)} className="text-w-dark" aria-label="Close menu"><X size={24} /></button>
          </div>
          <nav className="flex flex-col gap-1 p-6 flex-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className="py-4 text-2xl font-serif text-w-dark border-b border-w-ghost hover:pl-2 hover:text-w-forest transition-all">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="py-4 text-2xl font-serif border-b border-w-ghost text-w-graphite">
                Admin Panel
              </Link>
            )}
          </nav>
          <div className="p-6 flex gap-4">
            <Link href={profile ? '/account' : '/login'} onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-3 border border-w-dark text-w-dark text-sm uppercase tracking-widest hover:bg-w-dark hover:text-white transition-colors rounded-none">
              {profile ? 'My Account' : 'Login'}
            </Link>
            {!profile && (
              <Link href="/signup" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-3 bg-w-forest text-white text-sm uppercase tracking-widest hover:bg-w-emerald transition-colors rounded-none">
                Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
