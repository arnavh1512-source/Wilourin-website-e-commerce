import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get('order_number')
  if (!orderNumber) return NextResponse.json({ error: 'Missing order_number' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('id, user_id, order_number, order_status, payment_status, total, subtotal, discount_amount, shipping_cost, shipping_method, promo_code, created_at, order_items(product_name, product_image, size, color_name, quantity, unit_price, total_price)')
    .eq('order_number', orderNumber)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // If the order belongs to a registered user, require that user to be authenticated
  if (data.user_id) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== data.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  // Guest orders (user_id is null) remain accessible by order number

  return NextResponse.json(data)
}
