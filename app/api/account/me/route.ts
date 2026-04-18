import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const profilePatchSchema = z.object({
  full_name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().regex(/^\d{10}$/).optional().or(z.literal('')),
  avatar_url: z.string().url().max(2000).optional(),
}).strict() // reject any extra keys

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: adminRow }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).single(),
  ])
  return NextResponse.json({ user: { id: user.id, email: user.email }, profile: profile ?? null, isAdmin: !!adminRow })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const parsed = profilePatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
