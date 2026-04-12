import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

// ── Web Lock bypass ────────────────────────────────────────────────────────────
// Supabase auth-js serialises every auth operation behind a navigator.locks
// named lock. In a Next.js app several callers (onAuthStateChange, signIn,
// getSession triggered by DB queries) race for the same lock and deadlock.
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

const noOpLock = async (
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<unknown>
) => fn()

export function createClient() {
  const isClient = typeof window !== 'undefined'

  // ── Proxy fetch (browser only) ──────────────────────────────────────────────
  // We MUST keep the real Supabase URL as supabaseUrl so the storage key
  // (sb-rznljjxrgpssuzwqiemv-auth-token) matches what the server-side client
  // reads from cookies. But we rewrite every outgoing fetch to go through the
  // Vercel rewrite proxy so the browser never dials Supabase directly
  // (avoids IPv6-only endpoints that some ISPs can't reach).
  const proxyFetch: typeof fetch | undefined = isClient
    ? async (input: RequestInfo | URL, init?: RequestInit) => {
        const original = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const proxied = input
          .toString()
          .replace(original, `${window.location.origin}/supabase-proxy`)
        return fetch(proxied, init)
      }
    : undefined

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { lock: noOpLock },
      global: { fetch: proxyFetch },
    }
  )
}
