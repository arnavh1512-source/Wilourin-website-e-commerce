import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { CookieBanner } from '@/components/ui/CookieBanner'
import { CartDrawer } from '@/components/drawers/CartDrawer'
import { HelpDrawer } from '@/components/drawers/HelpDrawer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Wilourin — Premium Indian Streetwear', template: '%s — Wilourin' },
  description: 'Premium Indian streetwear crafted for the bold and fearless. Shop men, women, and accessories.',
  keywords: ['streetwear', 'Indian fashion', 'urban clothing', 'Wilourin'],
  openGraph: {
    type: 'website',
    siteName: 'Wilourin',
    title: 'Wilourin — Premium Indian Streetwear',
    description: 'Premium Indian streetwear crafted for the bold and fearless.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-[#0A0A0A] antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartDrawer />
          <HelpDrawer />
          <ToastContainer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
