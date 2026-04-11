'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store'

// Pages where we must NOT run any Supabase auth calls.
// onAuthStateChange acquires the Web Lock immediately on registration,
// which blocks signInWithPassword / signUp from ever completing.
const AUTH_PAGES = ['/login', '/signup']

export function Providers({ children }: { children: React.ReactNode }) {
  const { setProfile, setIsAdmin } = useUserStore()
  const pathname = usePathname()

  useEffect(() => {
    if (AUTH_PAGES.includes(pathname)) return

    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setProfile(null)
        setIsAdmin(false)
        return
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (profile) setProfile(profile)
      const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).single()
      setIsAdmin(!!admin)
    })

    return () => subscription.unsubscribe()
  }, [pathname, setProfile, setIsAdmin])

  return <>{children}</>
}
