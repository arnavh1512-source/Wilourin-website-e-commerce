import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Prata, Raleway } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { CookieBanner } from '@/components/ui/CookieBanner'
import { CartDrawer } from '@/components/drawers/CartDrawer'
import { HelpDrawer } from '@/components/drawers/HelpDrawer'

export const dynamic = 'force-dynamic'

const prata = Prata({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-prata',
  display: 'swap',
})

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-raleway',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Wilourin — Regal Reimagine', template: '%s — Wilourin' },
  description: 'Premium Indian fashion crafted for the bold and fearless. Shop men, women, and accessories.',
  keywords: ['Indian fashion', 'premium clothing', 'Wilourin', 'regal fashion'],
  openGraph: {
    type: 'website',
    siteName: 'Wilourin',
    title: 'Wilourin — Regal Reimagine',
    description: 'Premium Indian fashion crafted for the bold and fearless.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${prata.variable} ${raleway.variable}`}>
      <body className="bg-brand-background text-brand-dark antialiased">
        <Providers>
          <Suspense fallback={null}><Navbar /></Suspense>
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
