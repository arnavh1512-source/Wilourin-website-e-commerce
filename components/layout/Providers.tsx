'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const { setProfile, setIsAdmin } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setProfile(null)
        setIsAdmin(false)
        return
      }
      // Defer DB queries outside the signInWithPassword lock context.
      // auth-js holds lockAcquired=true while notifying listeners; calling
      // getSession() here would queue in pendingInLock and deadlock.
      setTimeout(async () => {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profile) setProfile(profile)
        const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).single()
        setIsAdmin(!!admin)
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [setProfile, setIsAdmin])

  return <>{children}</>
}
