import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const homepageSchema = z.object({
  hero_title: z.string().max(500).optional(),
  hero_subtitle: z.string().max(1000).optional(),
  hero_cta_text: z.string().max(200).optional(),
  hero_cta_link: z.string().max(500).optional(),
  hero_image_url: z.string().max(1000).optional(),
  featured_category_ids: z.array(z.string()).optional(),
  featured_product_ids: z.array(z.string()).optional(),
  announcement_text: z.string().max(500).optional(),
  announcement_active: z.boolean().optional(),
  marquee_text: z.string().max(500).optional(),
  show_lookbook: z.boolean().optional(),
})

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

  const [{ data: settings }, { data: products }, { data: categories }] = await Promise.all([
    supabase!.from('homepage_settings').select('*').eq('id', 1).single(),
    supabase!.from('products').select('id, name').eq('status', 'Published').order('name'),
    supabase!.from('categories').select('id, name').order('name'),
  ])

  return NextResponse.json({ settings: settings ?? {}, products: products ?? [], categories: categories ?? [] })
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const parsed = homepageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { error: dbError } = await supabase!.from('homepage_settings').upsert({ id: 1, ...parsed.data })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
