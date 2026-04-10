import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
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

    if (!file || !bucket) return NextResponse.json({ error: 'Missing file or bucket' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

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
