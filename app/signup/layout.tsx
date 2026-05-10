import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join Wilourin and earn loyalty points on every purchase. Free shipping, exclusive drops, and member-only deals.',
  robots: { index: true, follow: true },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
