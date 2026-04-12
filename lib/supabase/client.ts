import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

// ── Web Lock bypass ────────────────────────────────────────────────────────────
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

// ── Global fetch proxy (browser only) ─────────────────────────────────────────
// @supabase/ssr's createBrowserClient does NOT route auth calls through
// global.fetch — auth-js uses its own internal fetch reference.
// Patching window.fetch globally is the only reliable way to intercept every
// Supabase request (auth + db + storage) and redirect them through the Vercel
// rewrite proxy so the browser never dials the IPv6-only Supabase endpoint.
if (typeof window !== 'undefined') {
  const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const _native = window.fetch.bind(window)
  ;(window as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString()
    if (url.startsWith(SUPABASE_ORIGIN)) {
      const proxied = url.replace(
        SUPABASE_ORIGIN,
        `${window.location.origin}/supabase-proxy`
      )
      return _native(
        input instanceof Request ? new Request(proxied, input) : proxied,
        init
      )
    }
    return _native(input, init)
  }
}

const noOpLock = async (
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<unknown>
) => fn()

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { lock: noOpLock } }
  )
}
