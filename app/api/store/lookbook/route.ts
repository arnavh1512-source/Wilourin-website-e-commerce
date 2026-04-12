import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lookbook_submissions')
    .select('*')
    .eq('status', 'Approved')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const body = await request.json()
  const { submitter_name, instagram_handle, photo_url } = body

  if (!submitter_name || !photo_url) {
    return NextResponse.json({ error: 'Name and photo URL are required' }, { status: 400 })
  }

  const { error } = await supabase.from('lookbook_submissions').insert({
    submitter_name,
    instagram_handle: instagram_handle || null,
    photo_url,
    status: 'Pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
