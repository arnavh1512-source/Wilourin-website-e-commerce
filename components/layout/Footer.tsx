import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const SHOP_LINKS = [
  { label: 'Men', href: '/products?category=men' },
  { label: 'Women', href: '/products?category=women' },
  { label: 'Accessories', href: '/products?category=accessories' },
  { label: 'New Arrivals', href: '/products?badge=New+Arrival' },
  { label: 'Sale', href: '/products?badge=Sale' },
]

const HELP_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Lookbook', href: '/lookbook' },
  { label: 'Size Guide', href: '/products#size-guide' },
  { label: 'Track Order', href: '/account' },
  { label: 'Returns & Exchanges', href: '/about#returns' },
  { label: 'Contact Us', href: '/about#contact' },
]

export function Footer() {
  return (
    <footer className="bg-w-dark text-white">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <div>
            <h3 className="font-prata text-3xl tracking-[0.15em] uppercase text-white">Wilourin</h3>
            <p className="font-raleway text-[9px] tracking-[0.35em] uppercase text-white/40 mt-0.5">Regal Reimagine</p>
          </div>
          <p className="font-raleway text-white/70 text-sm leading-relaxed">
            Premium Indian streetwear crafted for the bold and fearless. Dress the streets.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="https://www.instagram.com/wilourin" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-w-forest transition-colors" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://twitter.com/wilourin" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-w-forest transition-colors" aria-label="X (Twitter)">
              <XIcon />
            </a>
            <a href="https://wa.me/918140081461" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-w-forest transition-colors" aria-label="WhatsApp">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div className="space-y-4">
          <h4 className="font-sans text-xs uppercase tracking-widest text-white">Shop</h4>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-sans text-white/60 hover:text-w-forest text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div className="space-y-4">
          <h4 className="font-sans text-xs uppercase tracking-widest text-white">Help</h4>
          <ul className="space-y-2.5">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-sans text-white/60 hover:text-w-forest text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="font-sans text-xs uppercase tracking-widest text-white">Get in Touch</h4>
          <div className="space-y-2 text-sm text-white/60 font-sans">
            <p>+91 81400 81461</p>
            <p className="text-white/40">Ahmedabad, Gujarat, India</p>
          </div>
          <a
            href="https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20have%20a%20question."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-sans text-xs px-4 py-2 rounded-none font-medium mt-2 hover:bg-[#1ebe5c] transition-colors"
          >
            <MessageCircle size={14} />
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-w-ghost/20" />

      {/* Payment logos + copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-sans text-white/40 text-xs">
          © {new Date().getFullYear()} Wilourin. All rights reserved. Made with love in India.
        </p>
        <div className="flex items-center gap-3">
          {['UPI', 'Paytm', 'Visa', 'Mastercard', 'COD'].map((method) => (
            <span
              key={method}
              className="font-sans text-[10px] uppercase tracking-widest text-white/40 border border-w-ghost/20 px-2 py-1 rounded-none"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
