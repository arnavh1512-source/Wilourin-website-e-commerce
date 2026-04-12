import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

// ── Web Lock bypass ────────────────────────────────────────────────────────────
// Supabase auth-js uses navigator.locks.request() to serialize all auth
// operations across tabs. In a Next.js app this causes deadlocks: multiple
// concurrent callers (onAuthStateChange, signInWithPassword, getSession called
// internally by every DB query) all compete for the same named lock.
//
// The server-side middleware validates the session on every request, so the
// client-side lock is redundant for security. We disable it by replacing
// navigator.locks.request with a shim that immediately invokes the callback.
//
// We patch the browser API directly rather than just the Supabase client option
// because createBrowserClient caches a singleton — if the singleton was created
// before our option reached it (common during Fast Refresh), the option is
// silently ignored. The browser-level patch has no such caveat.
if (typeof window !== 'undefined' && window.navigator?.locks) {
  ;(window.navigator.locks as any).request = async (
    _name: string,
    optionsOrCallback: LockGrantedCallback | LockOptions,
    maybeCallback?: LockGrantedCallback
  ) => {
    const fn = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback!
    return fn({ name: _name, mode: 'exclusive' } as Lock)
  }
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
