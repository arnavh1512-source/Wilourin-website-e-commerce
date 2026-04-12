import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Public route to look up a single order by order_number
// Used by the checkout success page
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get('order_number')

  if (!orderNumber) return NextResponse.json({ error: 'Missing order_number' }, { status: 400 })

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json(data)
}
