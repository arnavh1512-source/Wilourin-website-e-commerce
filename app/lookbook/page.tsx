import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { LookbookClient } from './LookbookClient'

export const metadata: Metadata = {
  title: 'Lookbook & Style Feed',
  description: 'See how the Wilourin community styles their pieces. Submit your own look.',
}

export const revalidate = 60

export default async function LookbookPage() {
  const supabase = createClient()
  const { data: submissions } = await supabase
    .from('lookbook_submissions')
    .select('*')
    .eq('status', 'Approved')
    .order('created_at', { ascending: false })

  return <LookbookClient submissions={submissions ?? []} />
}
