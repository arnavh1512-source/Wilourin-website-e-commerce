import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

// Bypass the Web Lock API entirely.
// The lock serializes concurrent auth ops across tabs, but causes deadlocks
// because onAuthStateChange, getSession, and signInWithPassword all compete
// for the same lock. The middleware validates the session server-side on every
// request, so skipping the client-side lock is safe.
//
// IMPORTANT: We patch client.auth.lock directly (not just via the options object)
// because createBrowserClient caches a singleton in module memory. If the singleton
// was created before this option was added (e.g. during a dev Fast Refresh cycle),
// the options-based lock bypass would be ignored. Patching the property directly
// ensures the bypass is applied even on a stale cached client.
const lockBypass = async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn()

export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: lockBypass,
      },
    }
  )
  // Patch the lock directly on the GoTrueClient instance so it takes effect
  // even when createBrowserClient returns a cached singleton that predates this bypass.
  ;(client.auth as any).lock = lockBypass
  return client
}
