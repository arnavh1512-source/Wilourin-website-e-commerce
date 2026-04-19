import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS, server-side only
// Intentionally untyped (matches createServerClient usage in server.ts)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
