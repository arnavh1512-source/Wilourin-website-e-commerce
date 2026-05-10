import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Your saved Wilourin favourites — premium Indian streetwear pieces you love.',
  robots: { index: false, follow: false },
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
