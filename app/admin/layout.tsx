import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from './_components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminRow) redirect('/')

  return <AdminShell>{children}</AdminShell>
}
