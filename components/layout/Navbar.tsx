'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Heart, User, Search, Menu, X, Crown } from 'lucide-react'
import { useCartStore, useUIStore, useWishlistStore } from '@/lib/store'
import { AnnouncementBar } from './AnnouncementBar'
import { cn } from '@/lib/utils'
import { detectCityByIP, getStoredCity, setStoredCity } from '@/lib/location'

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
  const [_scrolled, setScrolled] = useState(false)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const { toggleCart: uiToggleCart, toggleSearch } = useUIStore()
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const cartCount = useCartStore((s) => s.getItemCount())
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; loyalty_tier?: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [detectedCity, setDetectedCity] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch('/api/store/homepage')
      .then((r) => r.json())
      .then((data) => setAnnouncement(data?.settings?.announcement_text ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const stored = getStoredCity()
    if (stored) { setDetectedCity(stored); return }
    detectCityByIP()
      .then((city) => {
        if (city) { setStoredCity(city); setDetectedCity(city) }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/account/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return
        setProfile(data.profile)
        setIsAdmin(data.isAdmin ?? false)
      })
      .catch(() => {})
  }, [])

  const isAdminRoute = pathname.startsWith('/admin')
  if (isAdminRoute) return null

  const isHome = pathname === '/'
  const dark = isHome  // dark navbar only on homepage

  return (
    <>
      <AnnouncementBar text={announcement ?? (detectedCity ? `Delivering to ${detectedCity}` : null)} />
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          dark ? 'bg-w-dark border-b border-white/10' : 'bg-w-bg border-b border-w-ghost shadow-sm'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Nav links (desktop) */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'font-sans text-sm tracking-wide transition-colors duration-200',
                    pathname === link.href
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
              <button
                onClick={toggleSearch}
                aria-label="Search"
                className={cn('transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}
              >
                <Search size={20} />
              </button>
              <Link
                href="/wishlist"
                className={cn('relative transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-w-forest text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={uiToggleCart}
                className={cn('relative transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-w-forest text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-bounce-once">
                    {cartCount}
                  </span>
                )}
              </button>
              <Link
                href={profile ? '/account' : '/login'}
                className={cn('relative transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-w-dark hover:text-w-forest')}
                aria-label="Account"
              >
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
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-4 text-2xl font-serif text-w-dark border-b border-w-ghost hover:pl-2 hover:text-w-forest transition-all"
              >
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
            <Link href={profile ? '/account' : '/login'} onClick={() => setMenuOpen(false)} className="flex-1 text-center py-3 border border-w-dark text-w-dark text-sm uppercase tracking-widest hover:bg-w-dark hover:text-white transition-colors rounded-none">
              {profile ? 'My Account' : 'Login'}
            </Link>
            {!profile && (
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-3 bg-w-forest text-white text-sm uppercase tracking-widest hover:bg-w-emerald transition-colors rounded-none">
                Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
