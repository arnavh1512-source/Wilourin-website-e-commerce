import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get('order_number')
  if (!orderNumber) return NextResponse.json({ error: 'Missing order_number' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('orders')
    .select('id, user_id, access_token, order_number, order_status, payment_status, total, subtotal, discount_amount, shipping_cost, shipping_method, promo_code, created_at, order_items(product_name, product_image, size, color_name, quantity, unit_price, total_price)')
    .eq('order_number', orderNumber)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (data.user_id) {
    // Registered user — must be authenticated as that user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== data.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    // Guest order — require the access_token set at order creation
    const token = searchParams.get('token')
    if (!token || token !== data.access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Strip internal fields before returning
  const { access_token: _t, user_id: _u, ...safeData } = data
  return NextResponse.json(safeData)
}
