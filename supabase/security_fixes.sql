-- ─────────────────────────────────────────────────────────────────────────────
-- Security fixes — run this in Supabase SQL editor before deploying
-- ─────────────────────────────────────────────────────────────────────────────

-- [C-2] Server-side order intent storage (replaces client _meta trust)
CREATE TABLE IF NOT EXISTS pending_order_intents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        text UNIQUE NOT NULL,           -- WIL-... order number
  user_id         uuid REFERENCES auth.users(id),
  cart_items      jsonb NOT NULL DEFAULT '[]',
  address_id      uuid,
  guest_address   jsonb,
  guest_email     text,
  subtotal        numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  points_redeemed integer NOT NULL DEFAULT 0,
  shipping_cost   numeric(12,2) NOT NULL DEFAULT 0,
  shipping_method text NOT NULL DEFAULT 'Standard',
  promo_code      text,
  total           numeric(12,2) NOT NULL,
  used            boolean NOT NULL DEFAULT false,  -- mark consumed after verify
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Auto-expire intents after 24 hours (run pg_cron or clean up manually)
-- DELETE FROM pending_order_intents WHERE created_at < now() - interval '24 hours';

-- RLS: only service role can read/write (no public access)
ALTER TABLE pending_order_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON pending_order_intents USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- [H-6] Atomic stock decrement — creates or replaces the RPC
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(variant_id uuid, qty integer)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE product_variants
  SET stock_qty = GREATEST(0, stock_qty - qty)
  WHERE id = variant_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- [M-2] Atomic loyalty points adjustment (earned + redeemed in one UPDATE)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION adjust_loyalty_points(
  p_user_id  uuid,
  p_earned   integer,
  p_redeemed integer
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE profiles
  SET
    loyalty_points = GREATEST(0, loyalty_points + p_earned - p_redeemed),
    loyalty_tier   = CASE
      WHEN loyalty_points + p_earned - p_redeemed >= 5000 THEN 'Gold'
      WHEN loyalty_points + p_earned - p_redeemed >= 1000 THEN 'Silver'
      ELSE 'Bronze'
    END
  WHERE id = p_user_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- [M-3] Atomic discount usage count increment
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_discount_usage(p_code_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = p_code_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- [existing] increment_review_helpful — ensure it exists
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_review_helpful(review_id uuid)
RETURNS int LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE reviews SET helpful_count = helpful_count + 1
  WHERE id = review_id RETURNING helpful_count;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- [C1] access_token on orders for guest order lookup
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token text;
CREATE INDEX IF NOT EXISTS orders_access_token_idx ON orders(access_token) WHERE access_token IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- [H1] Atomic discount per-user check + usage record + count increment
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_and_use_discount(
  p_code_id uuid,
  p_user_id uuid,
  p_order_id uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_per_user_limit integer;
  v_usage_count    bigint;
BEGIN
  SELECT per_user_limit INTO v_per_user_limit FROM discount_codes WHERE id = p_code_id;
  IF v_per_user_limit IS NOT NULL AND p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
      FROM discount_code_usage WHERE code_id = p_code_id AND user_id = p_user_id;
    IF v_usage_count >= v_per_user_limit THEN RETURN false; END IF;
  END IF;
  INSERT INTO discount_code_usage(code_id, user_id, order_id) VALUES (p_code_id, p_user_id, p_order_id);
  UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = p_code_id;
  RETURN true;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- [H2] decrement_stock — returns false when stock is insufficient
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(variant_id uuid, qty integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stock integer;
BEGIN
  SELECT stock_qty INTO v_stock FROM product_variants WHERE id = variant_id FOR UPDATE;
  IF v_stock IS NULL OR v_stock < qty THEN RETURN false; END IF;
  UPDATE product_variants SET stock_qty = stock_qty - qty WHERE id = variant_id;
  RETURN true;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- [H6] Index for TTL filter on pending_order_intents
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS pending_order_intents_created_at_idx ON pending_order_intents(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- [MEDIUM] Advisor revenue: single aggregate query
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_order_revenue_stats()
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'total_revenue',      COALESCE(SUM(total), 0),
    'this_month_revenue', COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', now()) THEN total ELSE 0 END), 0),
    'last_month_revenue', COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', now() - interval '1 month')
                                             AND created_at <  date_trunc('month', now()) THEN total ELSE 0 END), 0)
  ) FROM orders WHERE payment_status = 'Paid';
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- [LOW] Cleanup stale pending_order_intents (enable pg_cron if available)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT cron.schedule('cleanup-stale-intents', '*/10 * * * *',
--   'DELETE FROM pending_order_intents WHERE used = false AND created_at < now() - interval ''30 minutes''');

-- ─────────────────────────────────────────────────────────────────────────────
-- [LOW] Add expires_at alias column on discount_codes (was expiry_date)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS expires_at timestamptz;
UPDATE discount_codes SET expires_at = expiry_date WHERE expires_at IS NULL AND expiry_date IS NOT NULL;
