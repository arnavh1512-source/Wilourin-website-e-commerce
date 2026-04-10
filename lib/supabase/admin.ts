import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

// Service role client — bypasses RLS, server-side only
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
