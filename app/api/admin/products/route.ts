import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const PRODUCT_STATUSES = ['Draft', 'Published', 'Archived'] as const

const productSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/),
  description: z.string().max(10000).optional().nullable(),
  price: z.number().positive(),
  original_price: z.number().positive().optional().nullable(),
  status: z.enum(PRODUCT_STATUSES),
  badge: z.enum(['New', 'Sale', 'Hot', 'Limited']).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().nullable(),
  care_instructions: z.string().max(2000).optional().nullable(),
  material: z.string().max(500).optional().nullable(),
  fit: z.string().max(200).optional().nullable(),
})

const variantSchema = z.object({
  size: z.string().max(20),
  color_name: z.string().max(100).optional().nullable(),
  stock_qty: z.number().int().min(0),
})

const imageSchema = z.object({
  url: z.string().url().max(2000),
  isPrimary: z.boolean(),
})

const postSchema = z.object({
  productData: productSchema,
  variants: z.array(variantSchema).max(50).optional(),
  images: z.array(imageSchema).max(20).optional(),
})

const putSchema = z.object({
  id: z.string().uuid(),
  productData: productSchema.partial(),
  variants: z.array(variantSchema).max(50).optional(),
  images: z.array(imageSchema).max(20).optional(),
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
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { productData, variants, images } = parsed.data

  const { data: product, error: insertError } = await supabase!
    .from('products')
    .insert(productData)
    .select('id')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const productId = product.id

  if (images?.length) {
    const { error: imgError } = await supabase!.from('product_images').insert(
      images.map((img, i) => ({
        product_id: productId,
        image_url: img.url,
        is_primary: img.isPrimary,
        display_order: i,
      }))
    )
    if (imgError) return NextResponse.json({ error: imgError.message }, { status: 500 })
  }

  if (variants?.length) {
    const { error: varError } = await supabase!.from('product_variants').insert(
      variants.map((v) => ({
        product_id: productId,
        size: v.size,
        color_name: v.color_name,
        stock_qty: v.stock_qty,
      }))
    )
    if (varError) return NextResponse.json({ error: varError.message }, { status: 500 })
  }

  return NextResponse.json({ id: productId })
}

export async function PUT(request: Request) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const body = await request.json()
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { id, productData, variants, images } = parsed.data

  await supabase!.from('products').update(productData).eq('id', id)

  if (images !== undefined) {
    await supabase!.from('product_images').delete().eq('product_id', id)
    if (images.length) {
      const { error: imgError } = await supabase!.from('product_images').insert(
        images.map((img, i) => ({
          product_id: id,
          image_url: img.url,
          is_primary: img.isPrimary,
          display_order: i,
        }))
      )
      if (imgError) return NextResponse.json({ error: imgError.message }, { status: 500 })
    }
  }

  if (variants !== undefined) {
    await supabase!.from('product_variants').delete().eq('product_id', id)
    if (variants.length) {
      const { error: varError } = await supabase!.from('product_variants').insert(
        variants.map((v) => ({
          product_id: id,
          size: v.size,
          color_name: v.color_name,
          stock_qty: v.stock_qty,
        }))
      )
      if (varError) return NextResponse.json({ error: varError.message }, { status: 500 })
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
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  // Remove child records first — FK constraints block direct product deletion
  await supabase!.from('product_images').delete().eq('product_id', id)
  await supabase!.from('product_variants').delete().eq('product_id', id)
  await supabase!.from('reviews').delete().eq('product_id', id)

  const { error: deleteError } = await supabase!.from('products').delete().eq('id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
