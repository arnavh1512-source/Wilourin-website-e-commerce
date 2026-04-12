import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { data, error: dbError } = await supabase!
    .from('products')
    .select('*, categories(name), product_images(image_url, is_primary), product_variants(id, size, color_name, stock_qty)')
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const { productData, variants, images } = body

  const { data: product, error: insertError } = await supabase!
    .from('products')
    .insert(productData)
    .select('id')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const productId = product.id

  if (images?.length) {
    await supabase!.from('product_images').insert(
      images.map((img: any, i: number) => ({
        product_id: productId,
        image_url: img.url,
        is_primary: img.isPrimary,
        display_order: i,
      }))
    )
  }

  if (variants?.length) {
    await supabase!.from('product_variants').insert(
      variants.map((v: any) => ({
        product_id: productId,
        size: v.size,
        color_name: v.color_name,
        stock_qty: Number(v.stock_qty),
      }))
    )
  }

  return NextResponse.json({ id: productId })
}

export async function PUT(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const { id, productData, variants, images } = body

  await supabase!.from('products').update(productData).eq('id', id)

  if (images !== undefined) {
    await supabase!.from('product_images').delete().eq('product_id', id)
    if (images.length) {
      await supabase!.from('product_images').insert(
        images.map((img: any, i: number) => ({
          product_id: id,
          image_url: img.url,
          is_primary: img.isPrimary,
          display_order: i,
        }))
      )
    }
  }

  if (variants !== undefined) {
    await supabase!.from('product_variants').delete().eq('product_id', id)
    if (variants.length) {
      await supabase!.from('product_variants').insert(
        variants.map((v: any) => ({
          product_id: id,
          size: v.size,
          color_name: v.color_name,
          stock_qty: Number(v.stock_qty),
        }))
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error: deleteError } = await supabase!.from('products').delete().eq('id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
