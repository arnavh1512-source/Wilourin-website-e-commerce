'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const { setProfile, setIsAdmin } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // onAuthStateChange fires INITIAL_SESSION on mount with the current session —
    // no getUser() or getSession() call needed, so no Web Lock is ever acquired here.
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
  }, [setProfile, setIsAdmin])

  return <>{children}</>
}
