'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag, Heart, User, Search, Menu, X, Crown } from 'lucide-react'
import { useCartStore, useUIStore, useWishlistStore } from '@/lib/store'
import { AnnouncementBar } from './AnnouncementBar'
import { cn } from '@/lib/utils'
import { detectCityByIP, getStoredCity, setStoredCity } from '@/lib/location'

// Browser-only singleton — do not remove 'use client' or this becomes a cross-request data leak
const ANNOUNCEMENT_TTL = 5 * 60 * 1000
const _cache: { announcement?: string | null; announcementAt?: number; city?: string } = {}

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

interface ProfileShape {
  full_name?: string
  avatar_url?: string
  loyalty_tier?: string
  [key: string]: unknown
}

export function Navbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [announcementReady, setAnnouncementReady] = useState(false)
  const [cityReady, setCityReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [detectedCity, setDetectedCity] = useState<string>('')

  const { toggleCart, toggleSearch, isCartOpen, isSearchOpen, isHelpOpen } = useUIStore()
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const cartCount = useCartStore((s) => s.getItemCount())
  const [profile, setProfile] = useState<ProfileShape | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const profileFetched = useRef(false)
  const prevPathRef = useRef('')
  const wasMenuOpenRef = useRef(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const closeMenuBtnRef = useRef<HTMLButtonElement>(null)
  const menuOverlayRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const cacheValid = 'announcement' in _cache && _cache.announcementAt && Date.now() - _cache.announcementAt < ANNOUNCEMENT_TTL
    if (cacheValid) {
      setAnnouncement(_cache.announcement ?? null)
      setAnnouncementReady(true)
      return
    }
    fetch('/api/store/homepage')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const text = data?.settings?.announcement_text ?? null
        _cache.announcement = text
        _cache.announcementAt = Date.now()
        setAnnouncement(text)
        setAnnouncementReady(true)
      })
      .catch(() => { setAnnouncementReady(true) })
  }, [])

  useEffect(() => {
    const stored = getStoredCity()
    if (stored && stored !== _cache.city) { _cache.city = stored; setDetectedCity(stored); setCityReady(true); return }
    if (_cache.city !== undefined) { setDetectedCity(_cache.city); setCityReady(true); return }
    detectCityByIP()
      .then((city) => {
        _cache.city = city || ''
        if (city) { setStoredCity(city); setDetectedCity(city) }
      })
      .catch(() => { _cache.city = ''; setDetectedCity('') })
      .finally(() => setCityReady(true))
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Return focus to hamburger whenever menu transitions from open → closed
  useEffect(() => {
    if (wasMenuOpenRef.current && !menuOpen) menuBtnRef.current?.focus()
    wasMenuOpenRef.current = menuOpen
  }, [menuOpen])

  // H1: merged into one effect to guarantee auth-reset runs before fetch guard check
  useEffect(() => {
    const AUTH_PATHS = ['/login', '/signup', '/auth/callback']
    // Only reset when LEAVING an auth page — not when arriving, to prevent double-fetch race
    if (AUTH_PATHS.includes(prevPathRef.current) && !AUTH_PATHS.includes(pathname)) profileFetched.current = false
    prevPathRef.current = pathname

    if (profileFetched.current) return
    profileFetched.current = true
    const ac = new AbortController()
    fetch('/api/account/me', { signal: ac.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setProfile(data?.profile ?? null)
        setIsAdmin(data?.isAdmin ?? false)
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setProfile(null)
        setIsAdmin(false)
      })
    return () => ac.abort()
  }, [pathname])

  // Coordinate scroll lock with all overlays — prevents clobbering cart/search drawers
  useEffect(() => {
    const anyOpen = menuOpen || isCartOpen || isSearchOpen || isHelpOpen
    document.body.style.overflow = anyOpen ? 'hidden' : ''
  }, [menuOpen, isCartOpen, isSearchOpen, isHelpOpen])

  // Release scroll lock on unmount only (e.g. navigate to /admin while menu is open)
  useEffect(() => () => { document.body.style.overflow = '' }, [])

  // Focus management: move focus into menu on open, trap Tab inside
  useEffect(() => {
    if (!menuOpen) return
    closeMenuBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); return }
      if (e.key === 'Tab') {
        const focusable = menuOverlayRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (!focusable?.length) return
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const isAdminRoute = pathname.startsWith('/admin')
  if (isAdminRoute) return null

  // M2: gate on both resolving to prevent race-condition pop-in
  const announcementText = announcementReady && cityReady
    ? (announcement ?? (detectedCity ? `Delivering to ${detectedCity}` : null))
    : null

  return (
    <>
      <AnnouncementBar text={announcementText} loading={!announcementReady || !cityReady} />
      <header className="sticky top-0 z-50 w-full transition-all duration-300 bg-w-forest border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            {/* Left — Nav links (desktop) / Hamburger (mobile) */}
            <div className="flex items-center">
              <nav className="hidden lg:flex items-center gap-8">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'font-sans text-sm tracking-wide transition-colors duration-200',
                      isActive(link.href)
                        ? 'text-brand-green border-b border-brand-green'
                        : 'text-white/70 hover:text-white'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <button
                ref={menuBtnRef}
                className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <Menu size={22} />
              </button>
            </div>

            {/* Center — Logo */}
            <Link href="/" className="flex flex-col items-center justify-center leading-none min-w-0">
              <span className="font-prata text-base sm:text-2xl tracking-normal sm:tracking-[0.15em] uppercase text-white truncate">Wilourin</span>
              <span className="hidden sm:block font-raleway text-[8px] tracking-[0.35em] uppercase mt-0.5 text-white/40">Regal Reimagine</span>
            </Link>

            {/* Right — Icons */}
            <div className="flex items-center justify-end gap-3 sm:gap-4">
              <button onClick={toggleSearch} aria-label="Search" className="hidden sm:block text-white/70 hover:text-white transition-colors">
                <Search size={20} />
              </button>
              <Link href="/wishlist" aria-label="Wishlist" className="relative text-white/70 hover:text-white transition-colors">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-green text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button onClick={toggleCart} aria-label="Cart" className="relative text-white/70 hover:text-white transition-colors">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-green text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-bounce-once">
                    {cartCount}
                  </span>
                )}
              </button>
              <Link href={profile ? '/account' : '/login'} aria-label={profile?.loyalty_tier ? `Account — ${profile.loyalty_tier} member` : 'Account'}
                className="relative text-white/70 hover:text-white transition-colors">
                <User size={20} />
                {profile && (
                  <span aria-hidden="true" className={cn('absolute -top-1.5 -right-1.5 text-[8px]', TIER_COLORS[profile.loyalty_tier ?? ''] ?? 'text-white/40')}>
                    <Crown size={10} />
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hidden lg:block font-sans text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div ref={menuOverlayRef} id="mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed inset-0 z-[60] bg-w-forest flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex flex-col leading-none">
              <span className="font-prata text-2xl tracking-[0.15em] uppercase text-white">Wilourin</span>
              <span className="font-raleway text-[8px] tracking-[0.35em] uppercase text-white/40 mt-0.5">Regal Reimagine</span>
            </div>
            <button ref={closeMenuBtnRef} onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white" aria-label="Close menu"><X size={24} /></button>
          </div>
          <nav className="flex flex-col gap-1 p-6 flex-1">
            <button onClick={() => { setMenuOpen(false); toggleSearch() }}
              className="py-3 text-xl font-prata text-white/60 border-b border-white/10 text-left hover:pl-2 hover:text-brand-green transition-all flex items-center gap-3">
              <Search size={18} /> Search
            </button>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className="py-3 text-xl sm:text-2xl font-prata text-white border-b border-white/10 hover:pl-2 hover:text-brand-green transition-all">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="py-4 text-2xl font-prata border-b border-white/10 text-white/40">
                Admin Panel
              </Link>
            )}
          </nav>
          <div className="p-6 flex gap-4">
            <Link href={profile ? '/account' : '/login'} onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-3 border border-white/30 text-white text-sm uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-colors rounded-none">
              {profile ? 'My Account' : 'Login'}
            </Link>
            {!profile && (
              <Link href="/signup" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-3 bg-brand-green text-white text-sm uppercase tracking-widest hover:bg-brand-green-light transition-colors rounded-none">
                Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
