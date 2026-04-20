import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const product_id = searchParams.get('product_id')
  if (!product_id) return NextResponse.json({ exists: false })

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ exists: false })

  const admin = createAdminClient()
  const { data } = await admin.from('reviews').select('id').eq('user_id', user.id).eq('product_id', product_id).single()
  return NextResponse.json({ exists: !!data })
}
