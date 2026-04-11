// Re-export the regular browser client for admin pages.
// Admin access is granted via RLS policies that check is_admin() on the signed-in user.
export { createClient as createAdminClientBrowser } from '@/lib/supabase/client'
