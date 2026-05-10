-- ═══════════════════════════════════════════════════════
-- WILOURIN — SEED DATA
-- Run after schema.sql and rls.sql
-- ═══════════════════════════════════════════════════════

-- ─── HOMEPAGE SETTINGS ──────────────────────────────────
INSERT INTO homepage_settings (id, announcement_text, hero_headline, hero_subtext, live_stream_headline)
VALUES (
  1,
  '🖤 Free shipping on orders above ₹999 — Use WELCOME10 for 10% off your first order',
  'Dress the Streets.',
  'Premium Indian streetwear crafted for the bold and fearless.',
  'Wilourin LIVE — New Drop Incoming'
) ON CONFLICT (id) DO UPDATE SET
  announcement_text = EXCLUDED.announcement_text,
  hero_headline = EXCLUDED.hero_headline,
  hero_subtext = EXCLUDED.hero_subtext;

-- ─── STORE SETTINGS ─────────────────────────────────────
INSERT INTO store_settings (
  id, store_name, tagline, contact_email, contact_phone,
  address, currency, free_shipping_threshold,
  standard_shipping_days, standard_shipping_cost,
  express_shipping_days, express_shipping_cost,
  instagram_url, twitter_url
) VALUES (
  1, 'Wilourin', 'Dress the Streets.',
  'hello@wilourin.com', '+91 81400 81461',
  'Ahmedabad, Gujarat, India', 'INR', 999,
  '5-7', 99, '2-3', 199,
  'https://instagram.com/wilourin',
  'https://twitter.com/wilourin'
) ON CONFLICT (id) DO UPDATE SET store_name = EXCLUDED.store_name;

-- ─── CATEGORIES ─────────────────────────────────────────
INSERT INTO categories (id, name, slug, display_order, is_active, image_url) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Men', 'men', 1, TRUE, 'https://images.unsplash.com/photo-1503341338985-95ad33e8e0b4?w=800'),
  ('a1000000-0000-0000-0000-000000000002', 'Women', 'women', 2, TRUE, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800'),
  ('a1000000-0000-0000-0000-000000000003', 'Accessories', 'accessories', 3, TRUE, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, display_order, is_active, image_url) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Tops', 'men-tops', 'a1000000-0000-0000-0000-000000000001', 1, TRUE, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'),
  ('b1000000-0000-0000-0000-000000000002', 'Bottoms', 'men-bottoms', 'a1000000-0000-0000-0000-000000000001', 2, TRUE, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'),
  ('b1000000-0000-0000-0000-000000000003', 'Tops', 'women-tops', 'a1000000-0000-0000-0000-000000000002', 1, TRUE, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800'),
  ('b1000000-0000-0000-0000-000000000004', 'Bottoms', 'women-bottoms', 'a1000000-0000-0000-0000-000000000002', 2, TRUE, 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800'),
  ('b1000000-0000-0000-0000-000000000005', 'Bags', 'bags', 'a1000000-0000-0000-0000-000000000003', 1, TRUE, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'),
  ('b1000000-0000-0000-0000-000000000006', 'Caps', 'caps', 'a1000000-0000-0000-0000-000000000003', 2, TRUE, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800')
ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCTS ───────────────────────────────────────────
INSERT INTO products (id, name, slug, description, category_id, price, original_price, badge, fit_note, model_height, model_size, status, is_featured, tags) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Shadow Oversized Tee', 'shadow-oversized-tee',
   'Heavy 280gsm cotton oversized tee with dropped shoulders. The go-to piece for effortless street style.',
   'b1000000-0000-0000-0000-000000000001', 899, 1299, 'Bestseller', 'Oversized fit. Size down for regular fit.',
   '6''1"', 'L', 'Published', TRUE, ARRAY['oversized','tee','men','cotton']),

  ('c1000000-0000-0000-0000-000000000002', 'Void Cargo Pants', 'void-cargo-pants',
   'Tactical cargo pants with 6 utility pockets. Tapered fit with adjustable ankle hem.',
   'b1000000-0000-0000-0000-000000000002', 1899, 2499, 'New Arrival', 'True to size. Relaxed through hip and thigh.',
   '6''1"', 'L', 'Published', TRUE, ARRAY['cargo','pants','men','tactical']),

  ('c1000000-0000-0000-0000-000000000003', 'Noir Graphic Hoodie', 'noir-graphic-hoodie',
   'French terry cotton hoodie with original Wilourin graphic print. Kangaroo pocket, adjustable drawstring.',
   'b1000000-0000-0000-0000-000000000001', 1599, 1999, 'Sale', 'Oversized. Size down one for regular fit.',
   '6''1"', 'L', 'Published', TRUE, ARRAY['hoodie','graphic','men','streetwear']),

  ('c1000000-0000-0000-0000-000000000004', 'Ghost Relaxed Jeans', 'ghost-relaxed-jeans',
   'Washed denim with subtle distressing. Relaxed straight leg for maximum comfort and style.',
   'b1000000-0000-0000-0000-000000000002', 1499, NULL, 'New Arrival', 'True to size.',
   '6''1"', '32', 'Published', FALSE, ARRAY['jeans','denim','men','relaxed']),

  ('c1000000-0000-0000-0000-000000000005', 'Echo Crop Tee', 'echo-crop-tee',
   'Premium ribbed crop tee with raw hem finish. Minimal and versatile for everyday wear.',
   'b1000000-0000-0000-0000-000000000003', 699, 999, 'Bestseller', 'Fitted crop. True to size.',
   '5''7"', 'S', 'Published', TRUE, ARRAY['crop','tee','women','ribbed']),

  ('c1000000-0000-0000-0000-000000000006', 'Onyx Wide Leg Trousers', 'onyx-wide-leg-trousers',
   'High-waist wide leg trousers in matte finish fabric. Effortlessly stylish with elastic waistband.',
   'b1000000-0000-0000-0000-000000000004', 1299, 1799, 'Sale', 'High waist, wide leg. Size up if between sizes.',
   '5''7"', 'S', 'Published', TRUE, ARRAY['trousers','wide-leg','women','high-waist']),

  ('c1000000-0000-0000-0000-000000000007', 'Ether Boxy Jacket', 'ether-boxy-jacket',
   'Coach-style boxy jacket in heavyweight twill. Clean lines, minimal branding, maximum impact.',
   'b1000000-0000-0000-0000-000000000003', 2499, 3199, 'New Arrival', 'Boxy oversized fit.',
   '5''7"', 'S', 'Published', FALSE, ARRAY['jacket','coach','women','outerwear']),

  ('c1000000-0000-0000-0000-000000000008', 'Veil Mini Skirt', 'veil-mini-skirt',
   'A-line mini skirt with front slit detail. Clean minimalist design in soft matte fabric.',
   'b1000000-0000-0000-0000-000000000004', 899, NULL, NULL, 'True to size.',
   '5''7"', 'S', 'Published', FALSE, ARRAY['skirt','mini','women','minimal']),

  ('c1000000-0000-0000-0000-000000000009', 'Stealth Backpack', 'stealth-backpack',
   '20L urban backpack in water-resistant nylon. Padded laptop sleeve, hidden pockets, magnetic closure.',
   'b1000000-0000-0000-0000-000000000005', 1999, 2799, 'Bestseller', NULL,
   NULL, NULL, 'Published', TRUE, ARRAY['backpack','bag','accessories','unisex']),

  ('c1000000-0000-0000-0000-000000000010', 'Signal Dad Cap', 'signal-dad-cap',
   'Unstructured 6-panel dad cap with tonal embroidery. One size fits most with adjustable strap.',
   'b1000000-0000-0000-0000-000000000006', 499, 699, NULL, NULL,
   NULL, NULL, 'Published', FALSE, ARRAY['cap','hat','accessories','unisex'])
ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCT IMAGES ─────────────────────────────────────
INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1503341338985-95ad33e8e0b4?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1541840031508-326f6c32f01e?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1583759136431-fc4de8efe3e3?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1622122201714-77da0ca8e5d2?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 1, FALSE),
  ('c1000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800', 0, TRUE),
  ('c1000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800', 1, FALSE);

-- ─── PRODUCT VARIANTS ───────────────────────────────────
INSERT INTO product_variants (product_id, size, color_name, color_hex, stock_qty, sku) VALUES
  -- Shadow Oversized Tee
  ('c1000000-0000-0000-0000-000000000001', 'S', 'Jet Black', '#0A0A0A', 25, 'SOT-BLK-S'),
  ('c1000000-0000-0000-0000-000000000001', 'M', 'Jet Black', '#0A0A0A', 30, 'SOT-BLK-M'),
  ('c1000000-0000-0000-0000-000000000001', 'L', 'Jet Black', '#0A0A0A', 4, 'SOT-BLK-L'),
  ('c1000000-0000-0000-0000-000000000001', 'XL', 'Jet Black', '#0A0A0A', 0, 'SOT-BLK-XL'),
  ('c1000000-0000-0000-0000-000000000001', 'S', 'Off White', '#F5F5F0', 20, 'SOT-WHT-S'),
  ('c1000000-0000-0000-0000-000000000001', 'M', 'Off White', '#F5F5F0', 15, 'SOT-WHT-M'),
  -- Void Cargo Pants
  ('c1000000-0000-0000-0000-000000000002', 'S', 'Olive', '#556B2F', 18, 'VCP-OLV-S'),
  ('c1000000-0000-0000-0000-000000000002', 'M', 'Olive', '#556B2F', 22, 'VCP-OLV-M'),
  ('c1000000-0000-0000-0000-000000000002', 'L', 'Olive', '#556B2F', 3, 'VCP-OLV-L'),
  ('c1000000-0000-0000-0000-000000000002', 'XL', 'Olive', '#556B2F', 10, 'VCP-OLV-XL'),
  ('c1000000-0000-0000-0000-000000000002', 'S', 'Jet Black', '#0A0A0A', 15, 'VCP-BLK-S'),
  ('c1000000-0000-0000-0000-000000000002', 'M', 'Jet Black', '#0A0A0A', 20, 'VCP-BLK-M'),
  -- Noir Graphic Hoodie
  ('c1000000-0000-0000-0000-000000000003', 'S', 'Jet Black', '#0A0A0A', 12, 'NGH-BLK-S'),
  ('c1000000-0000-0000-0000-000000000003', 'M', 'Jet Black', '#0A0A0A', 8, 'NGH-BLK-M'),
  ('c1000000-0000-0000-0000-000000000003', 'L', 'Jet Black', '#0A0A0A', 2, 'NGH-BLK-L'),
  ('c1000000-0000-0000-0000-000000000003', 'XL', 'Charcoal', '#36454F', 14, 'NGH-CHR-XL'),
  -- Ghost Relaxed Jeans
  ('c1000000-0000-0000-0000-000000000004', 'S', 'Stone Wash', '#B8C5D6', 20, 'GRJ-STN-S'),
  ('c1000000-0000-0000-0000-000000000004', 'M', 'Stone Wash', '#B8C5D6', 25, 'GRJ-STN-M'),
  ('c1000000-0000-0000-0000-000000000004', 'L', 'Stone Wash', '#B8C5D6', 18, 'GRJ-STN-L'),
  -- Echo Crop Tee
  ('c1000000-0000-0000-0000-000000000005', 'XS', 'Jet Black', '#0A0A0A', 20, 'ECT-BLK-XS'),
  ('c1000000-0000-0000-0000-000000000005', 'S', 'Jet Black', '#0A0A0A', 25, 'ECT-BLK-S'),
  ('c1000000-0000-0000-0000-000000000005', 'M', 'Jet Black', '#0A0A0A', 3, 'ECT-BLK-M'),
  ('c1000000-0000-0000-0000-000000000005', 'S', 'Off White', '#F5F5F0', 18, 'ECT-WHT-S'),
  -- Onyx Wide Leg Trousers
  ('c1000000-0000-0000-0000-000000000006', 'XS', 'Jet Black', '#0A0A0A', 15, 'OWT-BLK-XS'),
  ('c1000000-0000-0000-0000-000000000006', 'S', 'Jet Black', '#0A0A0A', 20, 'OWT-BLK-S'),
  ('c1000000-0000-0000-0000-000000000006', 'M', 'Jet Black', '#0A0A0A', 12, 'OWT-BLK-M'),
  -- Ether Boxy Jacket
  ('c1000000-0000-0000-0000-000000000007', 'S', 'Jet Black', '#0A0A0A', 8, 'EBJ-BLK-S'),
  ('c1000000-0000-0000-0000-000000000007', 'M', 'Jet Black', '#0A0A0A', 4, 'EBJ-BLK-M'),
  ('c1000000-0000-0000-0000-000000000007', 'L', 'Camel', '#C19A6B', 10, 'EBJ-CAM-L'),
  -- Veil Mini Skirt
  ('c1000000-0000-0000-0000-000000000008', 'XS', 'Jet Black', '#0A0A0A', 22, 'VMS-BLK-XS'),
  ('c1000000-0000-0000-0000-000000000008', 'S', 'Jet Black', '#0A0A0A', 18, 'VMS-BLK-S'),
  ('c1000000-0000-0000-0000-000000000008', 'M', 'Jet Black', '#0A0A0A', 0, 'VMS-BLK-M'),
  -- Stealth Backpack
  ('c1000000-0000-0000-0000-000000000009', 'M', 'Jet Black', '#0A0A0A', 35, 'SBP-BLK-OS'),
  ('c1000000-0000-0000-0000-000000000009', 'M', 'Slate Grey', '#708090', 20, 'SBP-GRY-OS'),
  -- Signal Dad Cap
  ('c1000000-0000-0000-0000-000000000010', 'M', 'Jet Black', '#0A0A0A', 50, 'SDC-BLK-OS'),
  ('c1000000-0000-0000-0000-000000000010', 'M', 'Off White', '#F5F5F0', 30, 'SDC-WHT-OS');

-- ─── REVIEWS ────────────────────────────────────────────
INSERT INTO reviews (product_id, reviewer_name, rating, review_text, size_purchased, is_verified) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Aryan M.', 5, 'Best tee I''ve bought. The fabric is thick and the oversized fit is perfect.', 'L', TRUE),
  ('c1000000-0000-0000-0000-000000000001', 'Priya S.', 4, 'Great quality. Sized down from L to M and it fits perfectly.', 'M', TRUE),
  ('c1000000-0000-0000-0000-000000000001', 'Rohan K.', 5, 'Exactly what streetwear should feel like. Heavy, structured, perfect.', 'XL', FALSE),
  ('c1000000-0000-0000-0000-000000000002', 'Aditya V.', 5, 'The cargo pockets are actually useful. Great fabric and fit.', 'L', TRUE),
  ('c1000000-0000-0000-0000-000000000002', 'Kiran B.', 4, 'Love the olive color. True to size as advertised.', 'M', TRUE),
  ('c1000000-0000-0000-0000-000000000003', 'Sahil J.', 5, 'This hoodie is fire. The graphic is clean and the fabric is premium.', 'L', TRUE),
  ('c1000000-0000-0000-0000-000000000003', 'Meera T.', 4, 'Sized down for a regular fit — great decision. Warm and cozy.', 'S', FALSE),
  ('c1000000-0000-0000-0000-000000000005', 'Ananya R.', 5, 'Perfect crop length. Love the raw hem detail. Super versatile.', 'S', TRUE),
  ('c1000000-0000-0000-0000-000000000005', 'Kavya P.', 5, 'I bought 3 colors. The fabric is so comfortable and washes well.', 'XS', TRUE),
  ('c1000000-0000-0000-0000-000000000006', 'Ishaan G.', 4, 'Extremely flattering wide leg. High waist is true as described.', 'S', TRUE),
  ('c1000000-0000-0000-0000-000000000009', 'Dev S.', 5, 'Best urban backpack. Laptop fits perfectly. Water-resistant is real.', 'M', TRUE),
  ('c1000000-0000-0000-0000-000000000009', 'Riya M.', 5, 'Bought as a gift. Great quality. Hidden pockets are genius.', 'M', FALSE),
  ('c1000000-0000-0000-0000-000000000010', 'Varun A.', 4, 'Simple, clean cap. Adjustable strap is solid. No complaints.', 'M', TRUE),
  ('c1000000-0000-0000-0000-000000000007', 'Shreya N.', 5, 'This jacket elevated my entire wardrobe. Clean lines, perfect boxy fit.', 'S', TRUE),
  ('c1000000-0000-0000-0000-000000000004', 'Nikhil R.', 4, 'Great wash on the denim. Relaxed fit is comfortable all day.', 'M', TRUE);

-- ─── DISCOUNT CODES ─────────────────────────────────────
INSERT INTO discount_codes (code, type, value, min_order_amount, usage_limit, per_user_limit, is_active, expiry_date) VALUES
  ('WELCOME10', 'percentage', 10, 0, NULL, 1, TRUE, NOW() + INTERVAL '1 year'),
  ('STREET20', 'percentage', 20, 1500, 500, 1, TRUE, NOW() + INTERVAL '6 months'),
  ('FLAT150', 'flat', 150, 999, 200, 2, TRUE, NOW() + INTERVAL '3 months'),
  ('FREESHIP', 'free_shipping', 0, 499, NULL, 1, TRUE, NOW() + INTERVAL '6 months'),
  ('WILOURIN15', 'percentage', 15, 1000, 100, 1, TRUE, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- ─── SIZE GUIDES ────────────────────────────────────────
INSERT INTO size_guides (name, category_id, measurements) VALUES
  ('Men Tops Size Guide', 'b1000000-0000-0000-0000-000000000001', '{
    "unit": "cm",
    "rows": ["XS", "S", "M", "L", "XL", "XXL"],
    "columns": ["Chest", "Shoulder", "Length", "Sleeve"],
    "data": {
      "XS": {"Chest": "86-91", "Shoulder": "42", "Length": "68", "Sleeve": "62"},
      "S": {"Chest": "91-96", "Shoulder": "44", "Length": "70", "Sleeve": "63"},
      "M": {"Chest": "96-101", "Shoulder": "46", "Length": "72", "Sleeve": "64"},
      "L": {"Chest": "101-107", "Shoulder": "48", "Length": "74", "Sleeve": "65"},
      "XL": {"Chest": "107-113", "Shoulder": "50", "Length": "76", "Sleeve": "66"},
      "XXL": {"Chest": "113-120", "Shoulder": "52", "Length": "78", "Sleeve": "67"}
    }
  }'),
  ('Women Tops Size Guide', 'b1000000-0000-0000-0000-000000000003', '{
    "unit": "cm",
    "rows": ["XS", "S", "M", "L", "XL"],
    "columns": ["Bust", "Waist", "Hip", "Length"],
    "data": {
      "XS": {"Bust": "80-83", "Waist": "61-64", "Hip": "86-89", "Length": "58"},
      "S": {"Bust": "83-87", "Waist": "64-67", "Hip": "89-93", "Length": "60"},
      "M": {"Bust": "87-91", "Waist": "67-71", "Hip": "93-97", "Length": "62"},
      "L": {"Bust": "91-96", "Waist": "71-76", "Hip": "97-102", "Length": "64"},
      "XL": {"Bust": "96-102", "Waist": "76-82", "Hip": "102-108", "Length": "66"}
    }
  }'),
  ('Accessories Size Guide', 'b1000000-0000-0000-0000-000000000006', '{
    "unit": "cm",
    "rows": ["One Size"],
    "columns": ["Head Circumference", "Brim Width"],
    "data": {
      "One Size": {"Head Circumference": "54-60", "Brim Width": "7"}
    }
  }');
