'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react'
import { useCartStore, useUIStore, useWishlistStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Men',         href: '/products?category=men' },
  { label: 'Women',       href: '/products?category=women' },
  { label: 'Accessories', href: '/products?category=accessories' },
  { label: 'Lookbook',    href: '/lookbook' },
  { label: 'About',       href: '/about' },
]

const ICON_COLOR = '#115511'

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuOverlayRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const closeMenuBtnRef = useRef<HTMLButtonElement>(null)
  const wasMenuOpenRef = useRef(false)

  const { toggleCart, toggleSearch, isCartOpen, isSearchOpen, isHelpOpen } = useUIStore()
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const cartCount = useCartStore((s) => s.getItemCount())

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', s)
    return () => window.removeEventListener('scroll', s)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    if (wasMenuOpenRef.current && !menuOpen) menuBtnRef.current?.focus()
    wasMenuOpenRef.current = menuOpen
  }, [menuOpen])

  useEffect(() => {
    const anyOpen = menuOpen || isCartOpen || isSearchOpen || isHelpOpen
    document.body.style.overflow = anyOpen ? 'hidden' : ''
  }, [menuOpen, isCartOpen, isSearchOpen, isHelpOpen])

  useEffect(() => () => { document.body.style.overflow = '' }, [])

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

  const isActive = useCallback((href: string) => pathname === href.split('?')[0], [pathname])

  if (pathname.startsWith('/admin')) return null

  return (
    <>
      <nav
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: scrolled ? 'rgba(244,241,236,0.92)' : 'rgba(244,241,236,0.7)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(21,20,15,0.22)',
          transition: 'background 0.3s',
        }}
      >
        <div className="grid grid-cols-3 items-center px-6 sm:px-8 py-4">
          {/* Left — Search + User (desktop) | Hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <button
              ref={menuBtnRef}
              className="lg:hidden p-1.5"
              style={{ color: ICON_COLOR, background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu size={22} />
            </button>
            <button
              onClick={toggleSearch}
              className="hidden lg:flex p-1.5 transition-opacity hover:opacity-60"
              style={{ color: ICON_COLOR, background: 'transparent', border: 'none', cursor: 'pointer' }}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <Link
              href="/account"
              className="hidden lg:flex p-1.5 transition-opacity hover:opacity-60"
              style={{ color: ICON_COLOR }}
              aria-label="Account"
            >
              <User size={18} />
            </Link>
          </div>

          {/* Center — Logo image */}
          <Link href="/" className="flex justify-center">
            <Image
              src="/wilourin-logo.png"
              alt="WILOURIN"
              width={180}
              height={54}
              style={{ height: 44, width: 'auto', objectFit: 'contain' }}
              priority
            />
          </Link>

          {/* Right — Heart + Cart */}
          <div className="flex items-center justify-end gap-2">
            <Link
              href="/wishlist"
              className="relative p-1.5 transition-opacity hover:opacity-60"
              style={{ color: ICON_COLOR }}
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-[8px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: '#1f4a30', color: '#e8e4d8', minWidth: 14, height: 14, padding: '0 3px', fontFamily: 'Raleway, sans-serif' }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              onClick={toggleCart}
              className="relative p-1.5 transition-opacity hover:opacity-60"
              style={{ color: ICON_COLOR, background: 'transparent', border: 'none', cursor: 'pointer' }}
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-[8px] font-bold rounded-full flex items-center justify-center animate-bounce-once"
                  style={{ background: '#1f4a30', color: '#e8e4d8', minWidth: 14, height: 14, padding: '0 3px', fontFamily: 'Raleway, sans-serif' }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div
          ref={menuOverlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-[60] flex flex-col animate-fade-in"
          style={{ background: '#f4f1ec' }}
        >
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(21,20,15,0.22)' }}
          >
            <Image src="/wilourin-logo.png" alt="WILOURIN" width={140} height={40} style={{ height: 32, width: 'auto' }} />
            <button
              ref={closeMenuBtnRef}
              onClick={() => setMenuOpen(false)}
              style={{ color: '#15140f', background: 'transparent', border: 'none', cursor: 'pointer' }}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col p-6 flex-1 overflow-y-auto">
            <button
              onClick={() => { setMenuOpen(false); toggleSearch() }}
              className="py-4 text-left flex items-center gap-3 font-raleway text-sm tracking-widest uppercase"
              style={{ borderBottom: '1px solid rgba(21,20,15,0.12)', color: 'rgba(21,20,15,0.5)', background: 'transparent', cursor: 'pointer' }}
            >
              <Search size={15} /> Search
            </button>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn('py-4 font-prata text-2xl transition-all hover:pl-2', isActive(link.href) ? 'text-[#115511]' : 'text-[#15140f]')}
                style={{ borderBottom: '1px solid rgba(21,20,15,0.12)', display: 'block' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="p-6 flex gap-3">
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-3 font-raleway text-xs uppercase tracking-widest"
              style={{ border: '1px solid rgba(21,20,15,0.22)', color: '#15140f', textDecoration: 'none' }}
            >
              Account
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-3 font-raleway text-xs uppercase tracking-widest"
              style={{ background: '#0d2818', color: '#e8e4d8', textDecoration: 'none' }}
            >
              Wishlist
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
