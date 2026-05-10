import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_BUCKETS = new Set(['product-images'])
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: adminRow } = await admin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string | null

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File must be JPEG, PNG, WebP, GIF, or SVG' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const fileName = `${randomBytes(16).toString('hex')}.${ext}`

    const bytes = await file.arrayBuffer()
    const { data, error } = await admin.storage
      .from(bucket)
      .upload(fileName, bytes, { contentType: file.type, upsert: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(data.path)
    return NextResponse.json({ success: true, url: publicUrl, path: data.path })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
