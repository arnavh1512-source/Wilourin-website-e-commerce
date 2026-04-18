// ═══════════════════════════════════════════════════════
// WILOURIN — TYPESCRIPT TYPES
// ═══════════════════════════════════════════════════════

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── DATABASE TYPES ──────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      product_images: { Row: ProductImage; Insert: Partial<ProductImage>; Update: Partial<ProductImage> }
      product_variants: { Row: ProductVariant; Insert: Partial<ProductVariant>; Update: Partial<ProductVariant> }
      size_guides: { Row: SizeGuide; Insert: Partial<SizeGuide>; Update: Partial<SizeGuide> }
      addresses: { Row: Address; Insert: Partial<Address>; Update: Partial<Address> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> }
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> }
      wishlist: { Row: WishlistItem; Insert: Partial<WishlistItem>; Update: Partial<WishlistItem> }
      discount_codes: { Row: DiscountCode; Insert: Partial<DiscountCode>; Update: Partial<DiscountCode> }
      discount_code_usage: { Row: DiscountCodeUsage; Insert: Partial<DiscountCodeUsage>; Update: Partial<DiscountCodeUsage> }
      loyalty_transactions: { Row: LoyaltyTransaction; Insert: Partial<LoyaltyTransaction>; Update: Partial<LoyaltyTransaction> }
      lookbook_submissions: { Row: LookbookSubmission; Insert: Partial<LookbookSubmission>; Update: Partial<LookbookSubmission> }
      homepage_settings: { Row: HomepageSettings; Insert: Partial<HomepageSettings>; Update: Partial<HomepageSettings> }
      store_settings: { Row: StoreSettings; Insert: Partial<StoreSettings>; Update: Partial<StoreSettings> }
      newsletter_subscribers: { Row: NewsletterSubscriber; Insert: Partial<NewsletterSubscriber>; Update: Partial<NewsletterSubscriber> }
      recently_viewed: { Row: RecentlyViewed; Insert: Partial<RecentlyViewed>; Update: Partial<RecentlyViewed> }
      admin_users: { Row: AdminUser; Insert: Partial<AdminUser>; Update: Partial<AdminUser> }
    }
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean }
    }
  }
}

// ─── TABLE ROW TYPES ────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  loyalty_points: number
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold'
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  price: number
  original_price: number | null
  badge: 'New Arrival' | 'Low Stock' | 'Sale' | 'Bestseller' | null
  fit_note: string | null
  model_height: string | null
  model_size: string | null
  meta_title: string | null
  meta_description: string | null
  tags: string[] | null
  status: 'Draft' | 'Published' | 'Archived'
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  display_order: number
  is_primary: boolean
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  color_name: string | null
  color_hex: string | null
  stock_qty: number
  sku: string | null
  created_at: string
}

export interface SizeGuide {
  id: string
  name: string
  category_id: string | null
  image_url: string | null
  measurements: Json | null
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  full_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  guest_email: string | null
  address_id: string | null
  shipping_method: string
  shipping_cost: number
  subtotal: number
  discount_amount: number
  points_redeemed: number
  total: number
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  order_status: 'Processing' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refund Requested'
  paytm_order_id: string | null
  paytm_txn_id: string | null
  paytm_txn_amount: string | null
  tracking_number: string | null
  promo_code: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  product_image: string | null
  size: string
  color_name: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface Review {
  id: string
  product_id: string
  user_id: string | null
  reviewer_name: string
  rating: number
  review_text: string | null
  size_purchased: string | null
  is_verified: boolean
  helpful_count: number
  created_at: string
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'flat' | 'free_shipping'
  value: number
  min_order_amount: number
  usage_limit: number | null
  per_user_limit: number
  usage_count: number
  applicable_categories: string[] | null
  expiry_date: string | null
  is_active: boolean
  created_at: string
}

export interface DiscountCodeUsage {
  id: string
  code_id: string | null
  user_id: string | null
  order_id: string | null
  used_at: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  type: 'earned' | 'redeemed' | 'referral' | 'bonus'
  points: number
  description: string | null
  order_id: string | null
  created_at: string
}

export interface LookbookSubmission {
  id: string
  user_id: string | null
  submitter_name: string
  instagram_handle: string | null
  photo_url: string
  status: 'Pending' | 'Approved' | 'Rejected'
  created_at: string
}

export interface HomepageSettings {
  id: number
  announcement_text: string | null
  hero_image_url: string | null
  hero_headline: string | null
  hero_subtext: string | null
  live_stream_date: string | null
  live_stream_headline: string | null
  featured_product_ids: string[] | null
  featured_category_ids: string[] | null
  updated_at: string
}

export interface StoreSettings {
  id: number
  store_name: string
  tagline: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  currency: string
  free_shipping_threshold: number
  standard_shipping_days: string
  standard_shipping_cost: number
  express_shipping_days: string
  express_shipping_cost: number
  instagram_url: string | null
  twitter_url: string | null
  pinterest_url: string | null
  maintenance_mode: boolean
  loyalty_points_per_rupee: number
  referral_reward_referrer: number
  referral_reward_referee: number
  updated_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  is_active: boolean
  subscribed_at: string
}

export interface RecentlyViewed {
  id: string
  user_id: string
  product_id: string
  viewed_at: string
}

export interface AdminUser {
  user_id: string
  created_at: string
}

// ─── COMPUTED / JOINED TYPES ─────────────────────────────

export interface ProductWithDetails extends Product {
  images: ProductImage[]
  variants: ProductVariant[]
  category: Category | null
  reviews: Review[]
  avg_rating: number
  review_count: number
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
  profile: Pick<Profile, 'full_name'> | null
  address: Address | null
}

// ─── CART ────────────────────────────────────────────────

export interface CartItem {
  id: string                // variant id
  product_id: string
  product_name: string
  product_slug: string
  image_url: string
  size: string
  color_name: string | null
  color_hex: string | null
  price: number
  original_price: number | null
  quantity: number
  stock_qty: number
}

// ─── WISHLIST ────────────────────────────────────────────

export interface WishlistProduct {
  id: string                // product id
  name: string
  slug: string
  price: number
  original_price: number | null
  badge: Product['badge']
  image_url: string
}

// ─── PAYTM ───────────────────────────────────────────────

export interface PaytmCreateOrderPayload {
  cartItems: CartItem[]
  addressId?: string
  guestAddress?: Omit<Address, 'id' | 'user_id' | 'created_at'>
  guestEmail?: string
  promoCode?: string
  pointsToRedeem?: number
  shippingMethod: 'Standard' | 'Express'
}

export interface PaytmCreateOrderResponse {
  orderId: string
  txnToken: string
  amount: string
  callbackUrl: string
}

export interface PaytmVerifyPayload {
  orderId: string
  txnId: string
  txnAmount: string
  status: string
  checksumHash: string
  bankTxnId?: string
  paymentMode?: string
}

// ─── DISCOUNT ────────────────────────────────────────────

export interface DiscountValidateResponse {
  valid: boolean
  code?: { code: string; type: DiscountCode['type']; value: number }
  discountAmount?: number
  message?: string
}

// ─── AI ADVISOR ──────────────────────────────────────────

export interface AdvisorMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StoreInsights {
  totalRevenue: number
  totalOrders: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  totalProducts: number
  lowStockProducts: Array<{ name: string; size: string; stock_qty: number }>
  topProducts: Array<{ name: string; order_count: number; revenue: number }>
  ordersByStatus: Record<string, number>
  refundRequested: number
  unusedDiscountCodes: string[]
}

// ─── TOAST ───────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}
