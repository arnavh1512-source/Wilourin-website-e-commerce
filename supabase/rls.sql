-- ═══════════════════════════════════════════════════════
-- WILOURIN — ROW LEVEL SECURITY POLICIES
-- Run after schema.sql
-- ═══════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ───────────────────────────────────────────
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── CATEGORIES ─────────────────────────────────────────
CREATE POLICY "Public reads active categories" ON categories FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Admin manages categories" ON categories FOR ALL USING (is_admin());

-- ─── PRODUCTS ───────────────────────────────────────────
CREATE POLICY "Public reads published products" ON products FOR SELECT USING (status = 'Published' OR is_admin());
CREATE POLICY "Admin manages products" ON products FOR ALL USING (is_admin());

-- ─── PRODUCT IMAGES ─────────────────────────────────────
CREATE POLICY "Public reads product images" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages product images" ON product_images FOR ALL USING (is_admin());

-- ─── PRODUCT VARIANTS ───────────────────────────────────
CREATE POLICY "Public reads product variants" ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages product variants" ON product_variants FOR ALL USING (is_admin());

-- ─── SIZE GUIDES ────────────────────────────────────────
CREATE POLICY "Public reads size guides" ON size_guides FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages size guides" ON size_guides FOR ALL USING (is_admin());

-- ─── ADDRESSES ──────────────────────────────────────────
CREATE POLICY "Users access own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- ─── ORDERS ─────────────────────────────────────────────
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR guest_email IS NOT NULL);
CREATE POLICY "Admin updates orders" ON orders FOR UPDATE USING (is_admin());

-- ─── ORDER ITEMS ────────────────────────────────────────
CREATE POLICY "Users read own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Insert order items" ON order_items FOR INSERT WITH CHECK (TRUE);

-- ─── REVIEWS ────────────────────────────────────────────
CREATE POLICY "Public reads reviews" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Auth users write reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ─── WISHLIST ───────────────────────────────────────────
CREATE POLICY "Users access own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- ─── DISCOUNT CODES ─────────────────────────────────────
CREATE POLICY "Auth users validate discount codes" ON discount_codes FOR SELECT USING (auth.uid() IS NOT NULL OR TRUE);
CREATE POLICY "Admin manages discount codes" ON discount_codes FOR ALL USING (is_admin());

-- ─── DISCOUNT CODE USAGE ────────────────────────────────
CREATE POLICY "Users read own usage" ON discount_code_usage FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Insert discount usage" ON discount_code_usage FOR INSERT WITH CHECK (TRUE);

-- ─── LOYALTY TRANSACTIONS ───────────────────────────────
CREATE POLICY "Users read own loyalty" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Service role inserts loyalty" ON loyalty_transactions FOR INSERT WITH CHECK (TRUE);

-- ─── LOOKBOOK ───────────────────────────────────────────
CREATE POLICY "Public reads approved lookbook" ON lookbook_submissions FOR SELECT USING (status = 'Approved' OR is_admin());
CREATE POLICY "Auth users submit lookbook" ON lookbook_submissions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manages lookbook" ON lookbook_submissions FOR UPDATE USING (is_admin());

-- ─── HOMEPAGE SETTINGS ──────────────────────────────────
CREATE POLICY "Public reads homepage settings" ON homepage_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages homepage settings" ON homepage_settings FOR ALL USING (is_admin());

-- ─── STORE SETTINGS ─────────────────────────────────────
CREATE POLICY "Public reads store settings" ON store_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages store settings" ON store_settings FOR ALL USING (is_admin());

-- ─── NEWSLETTER ─────────────────────────────────────────
CREATE POLICY "Anyone subscribes newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin reads newsletter" ON newsletter_subscribers FOR SELECT USING (is_admin());

-- ─── RECENTLY VIEWED ────────────────────────────────────
CREATE POLICY "Users access own recently viewed" ON recently_viewed FOR ALL USING (auth.uid() = user_id);

-- ─── ADMIN USERS ────────────────────────────────────────
CREATE POLICY "Admins read admin_users" ON admin_users FOR SELECT USING (is_admin() OR auth.uid() = user_id);
