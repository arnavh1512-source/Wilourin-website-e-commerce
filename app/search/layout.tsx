import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Wilourin\'s full collection of premium Indian streetwear — hoodies, tees, bottoms, and accessories.',
  robots: { index: false, follow: true },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
