import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const safeFilename = z.string().regex(/^[\w.\-]+$/).max(200)

async function getAdminSupabase() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = createAdminClient()
  const { data: adminRow } = await admin.from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminRow) return { supabase: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase: admin, error: null }
}

export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const { data, error: storageError } = await supabase!.storage
    .from('product-images')
    .list('', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } })

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
  const parsed = safeFilename.safeParse(body?.name)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })

  const { error: storageError } = await supabase!.storage.from('product-images').remove([parsed.data])
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
