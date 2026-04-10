import Link from 'next/link'
import { Instagram, Twitter, Pinterest, MessageCircle } from 'lucide-react'

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
    <footer className="bg-[#0A0A0A] text-white">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <h3 className="font-serif text-3xl tracking-[0.15em] uppercase text-white">Wilourin</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Premium Indian streetwear crafted for the bold and fearless. Dress the streets.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="https://instagram.com/wilourin" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://twitter.com/wilourin" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
              <Twitter size={18} />
            </a>
            <a href="https://wa.me/918140081461" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="WhatsApp">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Shop</h4>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-300 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Help</h4>
          <ul className="space-y-2.5">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-300 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-gray-400 font-medium">Get in Touch</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <p>hello@wilourin.com</p>
            <p>+91 81400 81461</p>
            <p className="text-gray-500">Ahmedabad, Gujarat, India</p>
          </div>
          <a
            href="https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20have%20a%20question."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs px-4 py-2 rounded font-medium mt-2 hover:bg-[#1ebe5c] transition-colors"
          >
            <MessageCircle size={14} />
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Payment logos + copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-xs">
          © {new Date().getFullYear()} Wilourin. All rights reserved. Made with ❤️ in India.
        </p>
        <div className="flex items-center gap-3">
          {['UPI', 'Paytm', 'Visa', 'Mastercard', 'COD'].map((method) => (
            <span
              key={method}
              className="text-[10px] uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-1 rounded"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
