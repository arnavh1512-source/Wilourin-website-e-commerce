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
