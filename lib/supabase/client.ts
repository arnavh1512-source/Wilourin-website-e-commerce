import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Bypass the Web Lock API entirely.
        // The lock serializes concurrent auth ops across tabs, but causes deadlocks
        // because onAuthStateChange, getSession, and signInWithPassword all compete
        // for the same lock. The middleware validates the session server-side on every
        // request, so skipping the client-side lock is safe.
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn(),
      },
    }
  )
}
