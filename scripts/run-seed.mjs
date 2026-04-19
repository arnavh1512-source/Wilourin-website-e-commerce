import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fneqxkgotfjbqdsvozsk.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZXF4a2dvdGZqYnFkc3ZvenNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAwMjc2NywiZXhwIjoyMDkxNTc4NzY3fQ.BFAvKShiyLobdznyXjPFm1ZZ0Kq2aKO9q-b9od4mthc'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function upsert(table, data, onConflict) {
  const q = supabase.from(table).upsert(data, onConflict ? { onConflict, ignoreDuplicates: true } : { ignoreDuplicates: true })
  const { error } = await q
  if (error) console.error(`❌ ${table}:`, error.message)
  else console.log(`✅ ${table}: seeded`)
}

async function insert(table, data) {
  const { error } = await supabase.from(table).insert(data)
  if (error && !error.message.includes('duplicate')) console.error(`❌ ${table}:`, error.message)
  else console.log(`✅ ${table}: seeded`)
}

async function main() {
  console.log('🌱 Seeding Wilourin database...\n')

  // Homepage settings
  await upsert('homepage_settings', [{
    id: 1,
    announcement_text: '🖤 Free shipping on orders above ₹999 — Use WELCOME10 for 10% off your first order',
    hero_headline: 'Dress the Streets.',
    hero_subtext: 'Premium Indian streetwear crafted for the bold and fearless.',
    live_stream_headline: 'Wilourin LIVE — New Drop Incoming',
  }], 'id')

  // Store settings
  await upsert('store_settings', [{
    id: 1,
    store_name: 'Wilourin',
    tagline: 'Dress the Streets.',
    contact_email: 'hello@wilourin.com',
    contact_phone: '+91 81400 81461',
    address: 'Ahmedabad, Gujarat, India',
    currency: 'INR',
    free_shipping_threshold: 999,
    standard_shipping_days: '5-7',
    standard_shipping_cost: 99,
    express_shipping_days: '2-3',
    express_shipping_cost: 199,
    instagram_url: 'https://instagram.com/wilourin',
    twitter_url: 'https://twitter.com/wilourin',
  }], 'id')

  // Parent categories
  await upsert('categories', [
    { id: 'a1000000-0000-0000-0000-000000000001', name: 'Men', slug: 'men', display_order: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1503341338985-95ad33e8e0b4?w=800' },
    { id: 'a1000000-0000-0000-0000-000000000002', name: 'Women', slug: 'women', display_order: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800' },
    { id: 'a1000000-0000-0000-0000-000000000003', name: 'Accessories', slug: 'accessories', display_order: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800' },
  ], 'slug')

  // Sub categories
  await upsert('categories', [
    { id: 'b1000000-0000-0000-0000-000000000001', name: 'Tops', slug: 'men-tops', parent_id: 'a1000000-0000-0000-0000-000000000001', display_order: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800' },
    { id: 'b1000000-0000-0000-0000-000000000002', name: 'Bottoms', slug: 'men-bottoms', parent_id: 'a1000000-0000-0000-0000-000000000001', display_order: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800' },
    { id: 'b1000000-0000-0000-0000-000000000003', name: 'Tops', slug: 'women-tops', parent_id: 'a1000000-0000-0000-0000-000000000002', display_order: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800' },
    { id: 'b1000000-0000-0000-0000-000000000004', name: 'Bottoms', slug: 'women-bottoms', parent_id: 'a1000000-0000-0000-0000-000000000002', display_order: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800' },
    { id: 'b1000000-0000-0000-0000-000000000005', name: 'Bags', slug: 'bags', parent_id: 'a1000000-0000-0000-0000-000000000003', display_order: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800' },
    { id: 'b1000000-0000-0000-0000-000000000006', name: 'Caps', slug: 'caps', parent_id: 'a1000000-0000-0000-0000-000000000003', display_order: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800' },
  ], 'slug')

  // Products
  await upsert('products', [
    { id: 'c1000000-0000-0000-0000-000000000001', name: 'Shadow Oversized Tee', slug: 'shadow-oversized-tee', description: 'Heavy 280gsm cotton oversized tee with dropped shoulders. The go-to piece for effortless street style.', category_id: 'b1000000-0000-0000-0000-000000000001', price: 899, original_price: 1299, badge: 'Bestseller', fit_note: 'Oversized fit. Size down for regular fit.', model_height: '6\'1"', model_size: 'L', status: 'Published', is_featured: true, tags: ['oversized','tee','men','cotton'] },
    { id: 'c1000000-0000-0000-0000-000000000002', name: 'Void Cargo Pants', slug: 'void-cargo-pants', description: 'Tactical cargo pants with 6 utility pockets. Tapered fit with adjustable ankle hem.', category_id: 'b1000000-0000-0000-0000-000000000002', price: 1899, original_price: 2499, badge: 'New Arrival', fit_note: 'True to size. Relaxed through hip and thigh.', model_height: '6\'1"', model_size: 'L', status: 'Published', is_featured: true, tags: ['cargo','pants','men','tactical'] },
    { id: 'c1000000-0000-0000-0000-000000000003', name: 'Noir Graphic Hoodie', slug: 'noir-graphic-hoodie', description: 'French terry cotton hoodie with original Wilourin graphic print. Kangaroo pocket, adjustable drawstring.', category_id: 'b1000000-0000-0000-0000-000000000001', price: 1599, original_price: 1999, badge: 'Sale', fit_note: 'Oversized. Size down one for regular fit.', model_height: '6\'1"', model_size: 'L', status: 'Published', is_featured: true, tags: ['hoodie','graphic','men','streetwear'] },
    { id: 'c1000000-0000-0000-0000-000000000004', name: 'Ghost Relaxed Jeans', slug: 'ghost-relaxed-jeans', description: 'Washed denim with subtle distressing. Relaxed straight leg for maximum comfort and style.', category_id: 'b1000000-0000-0000-0000-000000000002', price: 1499, original_price: null, badge: 'New Arrival', fit_note: 'True to size.', model_height: '6\'1"', model_size: '32', status: 'Published', is_featured: false, tags: ['jeans','denim','men','relaxed'] },
    { id: 'c1000000-0000-0000-0000-000000000005', name: 'Echo Crop Tee', slug: 'echo-crop-tee', description: 'Premium ribbed crop tee with raw hem finish. Minimal and versatile for everyday wear.', category_id: 'b1000000-0000-0000-0000-000000000003', price: 699, original_price: 999, badge: 'Bestseller', fit_note: 'Fitted crop. True to size.', model_height: '5\'7"', model_size: 'S', status: 'Published', is_featured: true, tags: ['crop','tee','women','ribbed'] },
    { id: 'c1000000-0000-0000-0000-000000000006', name: 'Onyx Wide Leg Trousers', slug: 'onyx-wide-leg-trousers', description: 'High-waist wide leg trousers in matte finish fabric. Effortlessly stylish with elastic waistband.', category_id: 'b1000000-0000-0000-0000-000000000004', price: 1299, original_price: 1799, badge: 'Sale', fit_note: 'High waist, wide leg. Size up if between sizes.', model_height: '5\'7"', model_size: 'S', status: 'Published', is_featured: true, tags: ['trousers','wide-leg','women','high-waist'] },
    { id: 'c1000000-0000-0000-0000-000000000007', name: 'Ether Boxy Jacket', slug: 'ether-boxy-jacket', description: 'Coach-style boxy jacket in heavyweight twill. Clean lines, minimal branding, maximum impact.', category_id: 'b1000000-0000-0000-0000-000000000003', price: 2499, original_price: 3199, badge: 'New Arrival', fit_note: 'Boxy oversized fit.', model_height: '5\'7"', model_size: 'S', status: 'Published', is_featured: false, tags: ['jacket','coach','women','outerwear'] },
    { id: 'c1000000-0000-0000-0000-000000000008', name: 'Veil Mini Skirt', slug: 'veil-mini-skirt', description: 'A-line mini skirt with front slit detail. Clean minimalist design in soft matte fabric.', category_id: 'b1000000-0000-0000-0000-000000000004', price: 899, original_price: null, badge: null, fit_note: 'True to size.', model_height: '5\'7"', model_size: 'S', status: 'Published', is_featured: false, tags: ['skirt','mini','women','minimal'] },
    { id: 'c1000000-0000-0000-0000-000000000009', name: 'Stealth Backpack', slug: 'stealth-backpack', description: '20L urban backpack in water-resistant nylon. Padded laptop sleeve, hidden pockets, magnetic closure.', category_id: 'b1000000-0000-0000-0000-000000000005', price: 1999, original_price: 2799, badge: 'Bestseller', fit_note: null, model_height: null, model_size: null, status: 'Published', is_featured: true, tags: ['backpack','bag','accessories','unisex'] },
    { id: 'c1000000-0000-0000-0000-000000000010', name: 'Signal Dad Cap', slug: 'signal-dad-cap', description: 'Unstructured 6-panel dad cap with tonal embroidery. One size fits most with adjustable strap.', category_id: 'b1000000-0000-0000-0000-000000000006', price: 499, original_price: 699, badge: null, fit_note: null, model_height: null, model_size: null, status: 'Published', is_featured: false, tags: ['cap','hat','accessories','unisex'] },
  ], 'slug')

  // Product images
  await insert('product_images', [
    { product_id: 'c1000000-0000-0000-0000-000000000001', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000001', image_url: 'https://images.unsplash.com/photo-1503341338985-95ad33e8e0b4?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000002', image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000002', image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000003', image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000003', image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000004', image_url: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000004', image_url: 'https://images.unsplash.com/photo-1541840031508-326f6c32f01e?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000005', image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000005', image_url: 'https://images.unsplash.com/photo-1583759136431-fc4de8efe3e3?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000006', image_url: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000006', image_url: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000007', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000007', image_url: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000008', image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000008', image_url: 'https://images.unsplash.com/photo-1622122201714-77da0ca8e5d2?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000009', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000009', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', display_order: 1, is_primary: false },
    { product_id: 'c1000000-0000-0000-0000-000000000010', image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800', display_order: 0, is_primary: true },
    { product_id: 'c1000000-0000-0000-0000-000000000010', image_url: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800', display_order: 1, is_primary: false },
  ])

  // Product variants
  await insert('product_variants', [
    { product_id: 'c1000000-0000-0000-0000-000000000001', size: 'S', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 25, sku: 'SOT-BLK-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000001', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 30, sku: 'SOT-BLK-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000001', size: 'L', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 4, sku: 'SOT-BLK-L' },
    { product_id: 'c1000000-0000-0000-0000-000000000001', size: 'XL', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 0, sku: 'SOT-BLK-XL' },
    { product_id: 'c1000000-0000-0000-0000-000000000001', size: 'S', color_name: 'Off White', color_hex: '#F5F5F0', stock_qty: 20, sku: 'SOT-WHT-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000001', size: 'M', color_name: 'Off White', color_hex: '#F5F5F0', stock_qty: 15, sku: 'SOT-WHT-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000002', size: 'S', color_name: 'Olive', color_hex: '#556B2F', stock_qty: 18, sku: 'VCP-OLV-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000002', size: 'M', color_name: 'Olive', color_hex: '#556B2F', stock_qty: 22, sku: 'VCP-OLV-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000002', size: 'L', color_name: 'Olive', color_hex: '#556B2F', stock_qty: 3, sku: 'VCP-OLV-L' },
    { product_id: 'c1000000-0000-0000-0000-000000000002', size: 'XL', color_name: 'Olive', color_hex: '#556B2F', stock_qty: 10, sku: 'VCP-OLV-XL' },
    { product_id: 'c1000000-0000-0000-0000-000000000002', size: 'S', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 15, sku: 'VCP-BLK-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000002', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 20, sku: 'VCP-BLK-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000003', size: 'S', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 12, sku: 'NGH-BLK-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000003', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 8, sku: 'NGH-BLK-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000003', size: 'L', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 2, sku: 'NGH-BLK-L' },
    { product_id: 'c1000000-0000-0000-0000-000000000003', size: 'XL', color_name: 'Charcoal', color_hex: '#36454F', stock_qty: 14, sku: 'NGH-CHR-XL' },
    { product_id: 'c1000000-0000-0000-0000-000000000004', size: 'S', color_name: 'Stone Wash', color_hex: '#B8C5D6', stock_qty: 20, sku: 'GRJ-STN-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000004', size: 'M', color_name: 'Stone Wash', color_hex: '#B8C5D6', stock_qty: 25, sku: 'GRJ-STN-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000004', size: 'L', color_name: 'Stone Wash', color_hex: '#B8C5D6', stock_qty: 18, sku: 'GRJ-STN-L' },
    { product_id: 'c1000000-0000-0000-0000-000000000005', size: 'XS', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 20, sku: 'ECT-BLK-XS' },
    { product_id: 'c1000000-0000-0000-0000-000000000005', size: 'S', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 25, sku: 'ECT-BLK-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000005', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 3, sku: 'ECT-BLK-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000005', size: 'S', color_name: 'Off White', color_hex: '#F5F5F0', stock_qty: 18, sku: 'ECT-WHT-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000006', size: 'XS', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 15, sku: 'OWT-BLK-XS' },
    { product_id: 'c1000000-0000-0000-0000-000000000006', size: 'S', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 20, sku: 'OWT-BLK-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000006', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 12, sku: 'OWT-BLK-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000007', size: 'S', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 8, sku: 'EBJ-BLK-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000007', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 4, sku: 'EBJ-BLK-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000007', size: 'L', color_name: 'Camel', color_hex: '#C19A6B', stock_qty: 10, sku: 'EBJ-CAM-L' },
    { product_id: 'c1000000-0000-0000-0000-000000000008', size: 'XS', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 22, sku: 'VMS-BLK-XS' },
    { product_id: 'c1000000-0000-0000-0000-000000000008', size: 'S', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 18, sku: 'VMS-BLK-S' },
    { product_id: 'c1000000-0000-0000-0000-000000000008', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 0, sku: 'VMS-BLK-M' },
    { product_id: 'c1000000-0000-0000-0000-000000000009', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 35, sku: 'SBP-BLK-OS' },
    { product_id: 'c1000000-0000-0000-0000-000000000009', size: 'M', color_name: 'Slate Grey', color_hex: '#708090', stock_qty: 20, sku: 'SBP-GRY-OS' },
    { product_id: 'c1000000-0000-0000-0000-000000000010', size: 'M', color_name: 'Jet Black', color_hex: '#0A0A0A', stock_qty: 50, sku: 'SDC-BLK-OS' },
    { product_id: 'c1000000-0000-0000-0000-000000000010', size: 'M', color_name: 'Off White', color_hex: '#F5F5F0', stock_qty: 30, sku: 'SDC-WHT-OS' },
  ])

  // Reviews
  await insert('reviews', [
    { product_id: 'c1000000-0000-0000-0000-000000000001', reviewer_name: 'Aryan M.', rating: 5, review_text: "Best tee I've bought. The fabric is thick and the oversized fit is perfect.", size_purchased: 'L', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000001', reviewer_name: 'Priya S.', rating: 4, review_text: 'Great quality. Sized down from L to M and it fits perfectly.', size_purchased: 'M', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000001', reviewer_name: 'Rohan K.', rating: 5, review_text: 'Exactly what streetwear should feel like. Heavy, structured, perfect.', size_purchased: 'XL', is_verified: false },
    { product_id: 'c1000000-0000-0000-0000-000000000002', reviewer_name: 'Aditya V.', rating: 5, review_text: 'The cargo pockets are actually useful. Great fabric and fit.', size_purchased: 'L', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000002', reviewer_name: 'Kiran B.', rating: 4, review_text: 'Love the olive color. True to size as advertised.', size_purchased: 'M', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000003', reviewer_name: 'Sahil J.', rating: 5, review_text: 'This hoodie is fire. The graphic is clean and the fabric is premium.', size_purchased: 'L', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000003', reviewer_name: 'Meera T.', rating: 4, review_text: 'Sized down for a regular fit — great decision. Warm and cozy.', size_purchased: 'S', is_verified: false },
    { product_id: 'c1000000-0000-0000-0000-000000000005', reviewer_name: 'Ananya R.', rating: 5, review_text: 'Perfect crop length. Love the raw hem detail. Super versatile.', size_purchased: 'S', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000005', reviewer_name: 'Kavya P.', rating: 5, review_text: 'I bought 3 colors. The fabric is so comfortable and washes well.', size_purchased: 'XS', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000006', reviewer_name: 'Ishaan G.', rating: 4, review_text: 'Extremely flattering wide leg. High waist is true as described.', size_purchased: 'S', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000009', reviewer_name: 'Dev S.', rating: 5, review_text: 'Best urban backpack. Laptop fits perfectly. Water-resistant is real.', size_purchased: 'M', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000009', reviewer_name: 'Riya M.', rating: 5, review_text: 'Bought as a gift. Great quality. Hidden pockets are genius.', size_purchased: 'M', is_verified: false },
    { product_id: 'c1000000-0000-0000-0000-000000000010', reviewer_name: 'Varun A.', rating: 4, review_text: 'Simple, clean cap. Adjustable strap is solid. No complaints.', size_purchased: 'M', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000007', reviewer_name: 'Shreya N.', rating: 5, review_text: 'This jacket elevated my entire wardrobe. Clean lines, perfect boxy fit.', size_purchased: 'S', is_verified: true },
    { product_id: 'c1000000-0000-0000-0000-000000000004', reviewer_name: 'Nikhil R.', rating: 4, review_text: 'Great wash on the denim. Relaxed fit is comfortable all day.', size_purchased: 'M', is_verified: true },
  ])

  // Discount codes
  await upsert('discount_codes', [
    { code: 'WELCOME10', type: 'percentage', value: 10, min_order_amount: 0, usage_limit: null, per_user_limit: 1, is_active: true },
    { code: 'STREET20', type: 'percentage', value: 20, min_order_amount: 1500, usage_limit: 500, per_user_limit: 1, is_active: true },
    { code: 'FLAT150', type: 'flat', value: 150, min_order_amount: 999, usage_limit: 200, per_user_limit: 2, is_active: true },
    { code: 'FREESHIP', type: 'free_shipping', value: 0, min_order_amount: 499, usage_limit: null, per_user_limit: 1, is_active: true },
    { code: 'WILOURIN15', type: 'percentage', value: 15, min_order_amount: 1000, usage_limit: 100, per_user_limit: 1, is_active: true },
  ], 'code')

  // Size guides
  await insert('size_guides', [
    {
      name: 'Men Tops Size Guide',
      category_id: 'b1000000-0000-0000-0000-000000000001',
      measurements: { unit: 'cm', rows: ['XS','S','M','L','XL','XXL'], columns: ['Chest','Shoulder','Length','Sleeve'], data: { XS: { Chest:'86-91', Shoulder:'42', Length:'68', Sleeve:'62' }, S: { Chest:'91-96', Shoulder:'44', Length:'70', Sleeve:'63' }, M: { Chest:'96-101', Shoulder:'46', Length:'72', Sleeve:'64' }, L: { Chest:'101-107', Shoulder:'48', Length:'74', Sleeve:'65' }, XL: { Chest:'107-113', Shoulder:'50', Length:'76', Sleeve:'66' }, XXL: { Chest:'113-120', Shoulder:'52', Length:'78', Sleeve:'67' } } },
    },
    {
      name: 'Women Tops Size Guide',
      category_id: 'b1000000-0000-0000-0000-000000000003',
      measurements: { unit: 'cm', rows: ['XS','S','M','L','XL'], columns: ['Bust','Waist','Hip','Length'], data: { XS: { Bust:'80-83', Waist:'61-64', Hip:'86-89', Length:'58' }, S: { Bust:'83-87', Waist:'64-67', Hip:'89-93', Length:'60' }, M: { Bust:'87-91', Waist:'67-71', Hip:'93-97', Length:'62' }, L: { Bust:'91-96', Waist:'71-76', Hip:'97-102', Length:'64' }, XL: { Bust:'96-102', Waist:'76-82', Hip:'102-108', Length:'66' } } },
    },
    {
      name: 'Accessories Size Guide',
      category_id: 'b1000000-0000-0000-0000-000000000006',
      measurements: { unit: 'cm', rows: ['One Size'], columns: ['Head Circumference','Brim Width'], data: { 'One Size': { 'Head Circumference':'54-60', 'Brim Width':'7' } } },
    },
  ])

  console.log('\n🎉 Seed complete!')
}

main().catch(console.error)
