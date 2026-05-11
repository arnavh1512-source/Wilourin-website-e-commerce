import Link from 'next/link'
import Image from 'next/image'

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

const STUDIO_LINKS = [
  { label: 'Lookbook', href: '/lookbook' },
  { label: 'About Wilourin', href: '/about' },
  { label: 'New Arrivals', href: '/products?badge=New+Arrival' },
  { label: 'All Collections', href: '/products' },
]

const HELP_LINKS = [
  { label: 'Size Guide', href: '/products#size-guide' },
  { label: 'Track Order', href: '/account' },
  { label: 'Returns', href: '/about#returns' },
  { label: 'Contact', href: '/about#contact' },
]

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand + Stay in touch */}
          <div className="space-y-8">
            <Image src="/wilourin-logo.png" alt="Wilourin" width={120} height={40} className="brightness-0 invert" />
            <div>
              <p className="font-raleway text-[10px] uppercase tracking-[0.35em] text-white/40 mb-3">Stay in touch</p>
              <a
                href="https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20want%20to%20stay%20updated%20on%20new%20drops!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 border border-white/20 text-white/70 hover:border-white/60 hover:text-white font-raleway text-xs px-4 py-3 transition-colors w-full justify-center"
              >
                <WhatsAppIcon />
                <span className="tracking-widest uppercase">WhatsApp us</span>
              </a>
            </div>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/wilourin" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="https://wa.me/918140081461" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="WhatsApp">
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Studio */}
          <div>
            <h4 className="font-raleway text-[10px] uppercase tracking-[0.35em] text-white/40 mb-6">Studio</h4>
            <ul className="space-y-3">
              {STUDIO_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-prata text-white/70 hover:text-white text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-raleway text-[10px] uppercase tracking-[0.35em] text-white/40 mb-6">Help</h4>
            <ul className="space-y-3">
              {HELP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-prata text-white/70 hover:text-white text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AHMEDABAD decorative */}
        <div className="border-t border-white/10 pt-8 overflow-hidden">
          <p className="font-prata text-white/5 leading-none tracking-[0.15em] uppercase select-none whitespace-nowrap" style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}>
            AHMEDABAD
          </p>
        </div>

        {/* Copyright + payment */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4">
          <p className="font-raleway text-white/30 text-xs">
            © {new Date().getFullYear()} Wilourin. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {['UPI', 'Razorpay', 'COD'].map((m) => (
              <span key={m} className="font-raleway text-[9px] uppercase tracking-widest text-white/25 border border-white/10 px-2 py-0.5">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
