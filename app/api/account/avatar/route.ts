import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  // Validate session
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Parse multipart form
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate type and size
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File must be JPEG, PNG, WebP, or GIF' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
  }

  // Path is locked to the authenticated user's ID — no path traversal possible
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `avatars/${user.id}.${ext}`
  const bytes = await file.arrayBuffer()

  // Upload via service role — bypasses RLS, server controls the path
  const admin = createServiceClient()
  const { error: upErr } = await admin.storage
    .from('product-images')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (upErr) {
    console.error('[avatar] storage upload error:', upErr)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('product-images').getPublicUrl(path)

  // Persist avatar_url on profile
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)
    .select()
    .single()

  if (profileErr) {
    console.error('[avatar] profile update error:', profileErr)
    return NextResponse.json({ error: 'Failed to save avatar URL' }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: publicUrl, profile })
}
