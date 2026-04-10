'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const { setProfile, setIsAdmin } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // Initial session load
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) setProfile(profile)
      const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
      setIsAdmin(!!admin)
    })

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setIsAdmin(false)
      } else if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profile) setProfile(profile)
        const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).single()
        setIsAdmin(!!admin)
      }
    })

    return () => subscription.unsubscribe()
  }, [setProfile, setIsAdmin])

  return <>{children}</>
}
