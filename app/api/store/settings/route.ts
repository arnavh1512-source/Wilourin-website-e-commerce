import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_settings')
    .select('free_shipping_threshold, standard_shipping_cost, express_shipping_cost, standard_shipping_days, express_shipping_days, currency, return_policy_days, loyalty_points_per_rupee')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? {})
}
