import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAdminSupabase() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return { supabase: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, error: null }
}

export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const { data, error: storageError } = await supabase!.storage
    .from('product-images')
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const files = (data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const { data: { publicUrl } } = supabase!.storage.from('product-images').getPublicUrl(f.name)
      return { ...f, url: publicUrl }
    })

  return NextResponse.json(files)
}

export async function DELETE(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const { name } = body
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const { error: storageError } = await supabase!.storage.from('product-images').remove([name])
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
