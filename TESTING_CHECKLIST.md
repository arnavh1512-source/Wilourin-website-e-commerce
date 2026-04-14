# Wilourin E-Commerce — Testing Checklist

> Generated from full codebase analysis. Every item maps to real code paths.
> Run through this before every production release.

---

## 1. Glitch Intro Animation

- [ ] Open site in a new browser tab (sessionStorage cleared) — glitch animation plays
- [ ] Animation scrambles characters for ~1 second then resolves to "WILOURIN"
- [ ] RGB text-shadow glitch effect fires after scramble resolves
- [ ] Overlay fades out at ~2.4s, unmounts at ~3s
- [ ] After animation, site is fully interactive (no pointer-event blocks)
- [ ] Open same tab again (sessionStorage has `intro_seen`) — animation does NOT replay
- [ ] Open new tab — animation replays (sessionStorage is per-tab)
- [ ] Visit `/admin` — animation is skipped entirely
- [ ] Animation renders correctly on mobile (font clamp: 2rem–7rem)

---

## 2. Homepage (/)

### Happy Path
- [ ] Homepage loads without errors
- [ ] Announcement bar text shows from homepage settings (or "Delivering to [City]" via IP detection)
- [ ] Hero section renders with image, headline, and CTA button
- [ ] Category grid shows all active parent categories
- [ ] Featured products section renders configured products
- [ ] Lookbook section shows approved submissions (max 12)
- [ ] Newsletter strip renders and accepts email input
- [ ] Trust badges (shipping, returns, etc.) render at bottom

### Edge Cases
- [ ] Homepage with no announcement text set — bar still renders without crashing
- [ ] Homepage with no featured product IDs — fallback to `is_featured=true` products
- [ ] Homepage with 0 featured products total — section renders empty or hidden gracefully
- [ ] Homepage with 0 lookbook submissions — section renders empty gracefully
- [ ] Hero image URL is broken — layout doesn't collapse
- [ ] IP geolocation API fails — announcement bar shows text fallback (no crash)
- [ ] City detected by IP — "Delivering to [City]" shown in announcement bar
- [ ] City stored in localStorage after detection — persists on refresh

---

## 3. Products Page (/products)

### Happy Path
- [ ] `/products` loads all published products (max 48)
- [ ] Product cards show image, name, price, original price (if discounted), badge
- [ ] Filter by category (parent) — shows products in parent + all subcategories
- [ ] Filter by category (child) — shows only that subcategory's products
- [ ] Filter by size (XS, S, M, L, XL, XXL) — only products with that size in stock
- [ ] Filter by badge (New Arrival, Sale, Bestseller, Low Stock)
- [ ] Filter by price range (min=1000, max=5000) — only products in range show
- [ ] Sort by newest — most recently added first
- [ ] Sort by price ascending — cheapest first
- [ ] Sort by price descending — most expensive first
- [ ] Combine category + size + badge + price filters — intersection works correctly
- [ ] "Clear all filters" resets URL to `/products`
- [ ] Click product card — navigates to `/products/[slug]`

### Edge Cases
- [ ] Filter by category slug that doesn't exist — all products shown (no crash)
- [ ] Filter by size with no matching products — empty state shown
- [ ] Price min > price max — no products shown (or all shown, not a crash)
- [ ] `/products?sort=invalid` — defaults to newest, no crash
- [ ] 0 published products total — empty state renders
- [ ] Product image fails to load — placeholder/fallback shown

---

## 4. Product Detail (/products/[slug])

### Happy Path
- [ ] Valid product slug loads full product page
- [ ] Image carousel works (next/prev buttons, thumbnails)
- [ ] Product name, price, original price, description display correctly
- [ ] Badge (New Arrival, Sale, etc.) renders
- [ ] Size selector shows all available sizes
- [ ] Selecting a size updates add-to-cart button state
- [ ] Add to cart → item appears in cart drawer with correct size/quantity
- [ ] Add to wishlist → item persisted in localStorage
- [ ] Wishlist button toggles (add/remove)
- [ ] Reviews section shows rating, count, and individual reviews
- [ ] "Helpful" button on a review increments count
- [ ] Related products section shows up to 4 products in same category
- [ ] Click related product — navigates to its detail page
- [ ] Size guide modal opens and closes

### Edge Cases
- [ ] Invalid slug (`/products/does-not-exist`) — 404 page shown
- [ ] Draft product slug — 404 page shown
- [ ] Archived product slug — 404 page shown
- [ ] Product with 0 stock for ALL sizes — "Out of stock" shown, add-to-cart disabled
- [ ] Product with stock=0 for one size but not others — only out-of-stock size disabled
- [ ] Product with no images — fallback image shown, carousel still renders
- [ ] Product with no reviews — "No reviews yet" message
- [ ] Product with no related products — section hidden or "No related products"
- [ ] "Helpful" button rate-limited (20 per 15 min per IP) — graceful error toast

---

## 5. Cart

### Happy Path
- [ ] Add item to cart — cart drawer opens / cart count in navbar increments
- [ ] Cart persists across page navigation (Zustand in-memory)
- [ ] Cart drawer opens via navbar icon
- [ ] Cart item shows image, name, size, price, quantity
- [ ] Increase/decrease quantity — subtotal updates
- [ ] Remove item — item removed, total recalculates
- [ ] Empty cart — "Your cart is empty" message with link to shop
- [ ] "Checkout" button navigates to `/checkout`

### Edge Cases
- [ ] Add same product with same size twice — quantity increments (not duplicate)
- [ ] Add same product with different sizes — two separate line items
- [ ] Cart state lost on page refresh (in-memory Zustand, no persistence) — expected behavior
- [ ] Add 99 of one item — quantity doesn't go above stock limit (if enforced)

---

## 6. Checkout (/checkout)

### Happy Path
- [ ] Load checkout with items in cart — order summary matches cart
- [ ] Logged-in user: saved addresses shown as radio buttons
- [ ] Select saved address — form pre-fills
- [ ] Add new address — form validates all fields (full_name, phone 10 digits, line1, city, state, pincode 6 digits)
- [ ] "Use My Location" fills address from GPS coordinates
- [ ] Delivery estimate shows based on detected city (metro vs non-metro)
- [ ] Select Standard shipping — correct cost shown
- [ ] Select Express shipping — correct cost shown
- [ ] Subtotal ≥ ₹999 — free shipping applied automatically
- [ ] Apply valid promo code — discount deducted from total
- [ ] Remove promo code — discount removed
- [ ] Redeem loyalty points — points-based discount applied
- [ ] Order summary updates in real-time as options change
- [ ] Click "Pay with Paytm" — Paytm UI opens
- [ ] Complete Paytm payment — redirected to `/checkout/success?order=XXXX`

### Edge Cases
- [ ] Load `/checkout` with empty cart — redirected to `/` immediately
- [ ] GPS location denied — manual address entry required, no crash
- [ ] GPS API fails — fallback message, form still usable
- [ ] Promo code expired — "Code has expired" error message
- [ ] Promo code usage limit reached — "Code limit reached" error
- [ ] Promo code minimum order not met — "Minimum order ₹X required" error
- [ ] Promo code per-user limit exceeded — appropriate error message
- [ ] Loyalty points redeemed more than available — capped at balance
- [ ] Address phone not 10 digits — validation error, form not submitted
- [ ] Address pincode not 6 digits — validation error
- [ ] Paytm script fails to load — error shown, user can retry
- [ ] User closes Paytm UI (APP_CLOSED) — returns to checkout, cart preserved
- [ ] Payment fails (PENDING status from Paytm) — success page still shows but with pending status
- [ ] Store settings fail to load — fallback shipping costs used (₹99 standard, ₹199 express, ₹999 free threshold)

---

## 7. Checkout Success (/checkout/success)

### Happy Path
- [ ] After successful payment, redirected to `/checkout/success?order=WIL-XXXX`
- [ ] Page shows order number, items, subtotal, discount, shipping, total
- [ ] "Track Your Order" button links to `/account`
- [ ] Order confirmation email sent to user (if Resend configured)

### Edge Cases
- [ ] Visit `/checkout/success` with no `order` param — error state shown
- [ ] Visit with invalid order number — "Order not found" message
- [ ] Visit with someone else's order number — order displayed (privacy note: no auth check on this route)
- [ ] Cart not cleared after success — check Zustand `clearCart()` called
- [ ] Refresh success page — still shows order (not a one-time page)

---

## 8. Search (/search)

- [ ] Search for existing product name — matching products shown
- [ ] Search for partial match — products matching fragment shown
- [ ] Search returns no results — "No results for X" message
- [ ] Empty search query — appropriate message or redirect
- [ ] Search updates URL with `?q=` param (shareable/bookmarkable link)
- [ ] Click result — navigates to product page

---

## 9. Lookbook (/lookbook)

### Happy Path
- [ ] Page loads with approved submissions in grid
- [ ] Submit form accepts: name, optional instagram handle, photo URL
- [ ] Valid submission → success message, form resets
- [ ] Submitted photo shows "Pending Approval" state (not visible until admin approves)

### Edge Cases
- [ ] Submit with invalid photo URL — "Invalid URL" validation error
- [ ] Submit with instagram handle starting without @ — accepted (regex allows with or without @)
- [ ] Submit with instagram handle with invalid chars — validation error
- [ ] Submit 3 times in 1 hour — all succeed
- [ ] Submit 4th time in 1 hour — 429 rate limit response shown
- [ ] 0 approved submissions — empty state shown gracefully

---

## 10. About Page (/about)

- [ ] Page loads with brand content
- [ ] No API calls — static page renders correctly
- [ ] WhatsApp link opens correctly

---

## 11. Newsletter

- [ ] Enter valid email in newsletter strip → success message
- [ ] Enter invalid email format → validation error
- [ ] Subscribe twice with same email → upsert succeeds (no duplicate error)
- [ ] Rate limit: 3 signups per hour per IP — 4th attempt returns error
- [ ] Welcome email sent via Resend (if `RESEND_API_KEY` is set)
- [ ] Missing `RESEND_API_KEY` — signup still works, email silently skipped

---

## 12. Authentication

### Login (/login)
- [ ] Login with valid email/password — session cookie set, redirected to `/account`
- [ ] Login with `?redirect=/checkout` — redirected to `/checkout` after login
- [ ] Login with wrong password — "Invalid credentials" error
- [ ] Login with non-existent email — "Invalid credentials" error (no user enumeration)
- [ ] Login with empty fields — form validation error
- [ ] Already logged in visiting `/login` — should redirect (check middleware behavior)

### Signup (/signup)
- [ ] Signup with new email + strong password — account created, logged in
- [ ] Signup with existing email — "Email already in use" error
- [ ] Signup with weak password — Supabase rejects with error
- [ ] Signup with valid referral code — new user gets 50 loyalty points
- [ ] Signup with valid referral code — referrer gets 100 loyalty points
- [ ] Signup with invalid referral code — account created, no points, no error to user
- [ ] Referral code auto-uppercases as user types
- [ ] Loyalty transactions created in DB for both users after valid referral

### Session & Logout
- [ ] Session persists across page refresh (cookie-based Supabase auth)
- [ ] Session persists across browser restart (if "Remember me" or persistent cookie)
- [ ] Logout clears session cookie — subsequent requests treated as unauthenticated
- [ ] After logout, visiting `/account` redirects to `/login?redirect=/account`
- [ ] After logout, visiting `/checkout` still works (guest checkout allowed)
- [ ] Expired session (>1 week) — auto-refresh or redirect to login

### OAuth (if configured)
- [ ] Click "Continue with Google" — redirected to Google OAuth
- [ ] Complete Google auth — `/auth/callback` exchanges code, session created
- [ ] Callback with invalid/expired code — redirected to `/account` (or error)

---

## 13. Account (/account)

### Profile Tab
- [ ] Profile loads: full name, email, phone, avatar
- [ ] Edit full name (min 2, max 100 chars) — saves correctly
- [ ] Edit phone (must be 10 digits) — saves correctly
- [ ] Edit phone with invalid format — validation error
- [ ] Clear phone (empty string allowed) — saves correctly
- [ ] Upload avatar image — Cloudinary URL stored in profile
- [ ] Upload non-image file — error shown
- [ ] Extra fields in PATCH body rejected (`.strict()` schema) — 400 error

### Orders Tab
- [ ] All user orders displayed, newest first
- [ ] Order card shows: order number, date, status, total, items
- [ ] Expand order — shows individual items with images
- [ ] Order status badge colors match status (Processing, Shipped, Delivered, etc.)
- [ ] No orders — "No orders yet" with link to shop

### Wishlist Tab
- [ ] Wishlist items load on tab switch
- [ ] Click product — navigates to detail page
- [ ] Remove from wishlist — item disappears
- [ ] No wishlist items — empty state shown

### Addresses Tab
- [ ] All saved addresses listed
- [ ] Add new address — all fields validate (name, phone 10 digits, line1, city, state, pincode 6 digits)
- [ ] Edit address — form pre-fills, saves correctly
- [ ] Set as default — `is_default` toggles, only one default at a time
- [ ] Delete address — removed from list
- [ ] No addresses — "No addresses saved" message

### Loyalty Tab
- [ ] Points balance displayed
- [ ] Tier shown (Bronze/Silver/Gold based on points)
- [ ] Referral code displayed
- [ ] "Copy code" copies to clipboard
- [ ] "Share on WhatsApp" opens WhatsApp with pre-filled referral message
- [ ] Transaction history shows point additions/deductions

---

## 14. Admin Panel (/admin/*)

### Access Control
- [ ] Non-logged-in user visits `/admin` — redirect to `/login`
- [ ] Logged-in non-admin visits `/admin` — redirect to `/` (403 handled by middleware)
- [ ] Admin user visits `/admin` — dashboard loads

### Dashboard (/admin)
- [ ] Revenue metrics display (total, this month, last month, growth %)
- [ ] Order count by status shown
- [ ] Low stock variants listed
- [ ] Pending refund count shown
- [ ] All data updates from real DB (service role bypasses RLS)

### Products (/admin/products)
- [ ] All products listed (Published, Draft, Archived)
- [ ] Create product — all fields save, images upload to Cloudinary
- [ ] Edit product — pre-fills existing data
- [ ] Change product status (Draft → Published) — appears on storefront after revalidate
- [ ] Delete product — removed from list and storefront
- [ ] Add product images — multiple images with order
- [ ] Add product variants (size, color, stock, price)
- [ ] Edit variant stock — stock quantity updates

### Orders (/admin/orders)
- [ ] All orders listed (all users)
- [ ] Filter by order status
- [ ] Update order status → customer sees updated status in account
- [ ] Add admin note — saved to order
- [ ] View customer details for each order

### Customers (/admin/customers)
- [ ] All registered users listed
- [ ] Click customer — see their orders and profile info

### Categories (/admin/categories)
- [ ] Create category — appears in storefront after revalidate
- [ ] Edit category name/slug
- [ ] Set parent/child hierarchy
- [ ] Toggle is_active — inactive categories hidden from storefront
- [ ] Set display_order — categories sort correctly on storefront

### Discounts (/admin/discounts)
- [ ] Create discount code — appears in validation
- [ ] Set expiry date — expired codes rejected
- [ ] Set usage limit — codes rejected after limit reached
- [ ] Set per-user limit — individual user limit enforced
- [ ] Set minimum order amount — codes rejected below minimum
- [ ] Set type (percentage vs fixed)
- [ ] Disable/delete code — no longer accepted

### Loyalty (/admin/loyalty)
- [ ] Configure points per rupee spent
- [ ] Configure tier thresholds (Bronze/Silver/Gold)
- [ ] View loyalty transaction history

### Lookbook (/admin/lookbook)
- [ ] View pending submissions
- [ ] Approve submission — appears on public lookbook page
- [ ] Reject submission — hidden from public page
- [ ] View approved/rejected submissions in separate tabs

### Homepage (/admin/homepage)
- [ ] Set announcement bar text
- [ ] Set hero image URL, headline, subheadline, CTA text
- [ ] Set featured product IDs
- [ ] Save settings — public homepage reflects changes within 30s (revalidation)

### Settings (/admin/settings)
- [ ] Set standard shipping cost
- [ ] Set express shipping cost
- [ ] Set free shipping threshold
- [ ] Set loyalty points per rupee
- [ ] Save settings — checkout reflects updated values

### AI Advisor (/admin/advisor)
- [ ] Page loads with greeting message
- [ ] Send message — Anthropic API called, response displayed
- [ ] Response includes real store data (revenue, orders, stock)
- [ ] Quick prompt buttons send pre-filled messages
- [ ] Greeting bubble NOT sent to Anthropic API (slice(1) fix)
- [ ] Long response displays correctly (no truncation)
- [ ] Rate limit: 30 requests per 15 min — 31st attempt returns error
- [ ] Non-admin tries to call `/api/advisor` directly — 403 Forbidden

---

## 15. API — Rate Limiting

- [ ] `/api/newsletter/subscribe` — 4th request in 1 hour from same IP → 429
- [ ] `/api/store/lookbook` POST — 4th request in 1 hour → 429
- [ ] `/api/reviews/helpful` POST — 21st request in 15 min → 429
- [ ] `/api/discount/validate` — 11th request in 1 min → 429
- [ ] `/api/advisor` (admin) — 31st request in 15 min → 429
- [ ] 429 response includes `Retry-After` header
- [ ] Rate limit resets after window expires — requests succeed again
- [ ] Rate limit is per-IP (different IPs have independent limits)

---

## 16. API — Input Validation

- [ ] PATCH `/api/account/me` with `full_name: "X"` (1 char, < min 2) → 400
- [ ] PATCH `/api/account/me` with `phone: "123"` (not 10 digits) → 400
- [ ] PATCH `/api/account/me` with `avatar_url: "not-a-url"` → 400
- [ ] PATCH `/api/account/me` with extra field `{ role: "admin" }` → 400 (strict schema)
- [ ] POST `/api/account/addresses` with `pincode: "123"` (< 6 digits) → 400
- [ ] POST `/api/account/addresses` with `phone: "abcdefghij"` (non-digits) → 400
- [ ] POST `/api/reviews/helpful` with `reviewId: "not-a-uuid"` → 400
- [ ] POST `/api/advisor/customer` with `messages: []` (empty array) → 400
- [ ] POST `/api/discount/validate` with `code: "'; DROP TABLE--"` → 400 (regex fails)
- [ ] POST `/api/store/lookbook` with `photo_url: "not-a-url"` → 400

---

## 17. API — Authentication & Authorization

- [ ] GET `/api/account/me` without session → 401
- [ ] GET `/api/account/addresses` without session → 401
- [ ] POST `/api/account/addresses` without session → 401
- [ ] PUT `/api/account/addresses` without session → 401
- [ ] DELETE `/api/account/addresses` without session → 401
- [ ] PATCH `/api/account/me` without session → 401
- [ ] POST `/api/advisor` (admin) without session → 401
- [ ] POST `/api/advisor` (admin) as non-admin user → 403
- [ ] PUT `/api/account/addresses` with another user's address ID → silently fails (RLS: `.eq('user_id', user.id)`)
- [ ] DELETE `/api/account/addresses` with another user's address ID → silently fails

---

## 18. API — Error States & Loading

- [ ] Supabase unreachable — API returns 500 with error message (not crash)
- [ ] Anthropic API down — advisor returns 500 with `Anthropic: ...` error
- [ ] Anthropic API key missing — returns `ANTHROPIC_API_KEY not configured` (customer advisor)
- [ ] Order not found at `/api/store/order` — 404 returned
- [ ] Product slug not found at `/api/store/product/[slug]` — 404 returned
- [ ] Loading states show spinner/skeleton on all data-fetching components
- [ ] Error toast appears for failed cart/wishlist operations

---

## 19. Navigation & Deep Links

- [ ] Direct visit to `/products?category=men&size=L&sort=price-asc` — filters apply correctly
- [ ] Navbar logo → navigates to `/`
- [ ] Navbar "Men" / "Women" / "Accessories" → `/products?category=X`
- [ ] Navbar cart icon → opens cart drawer
- [ ] Navbar user icon (logged in) → `/account`
- [ ] Navbar user icon (logged out) → `/login`
- [ ] Footer links navigate correctly (About, Lookbook, Wishlist, etc.)
- [ ] WhatsApp button in footer/help drawer opens `wa.me/918140081461`
- [ ] Browser back/forward navigation preserves filter state
- [ ] `/account?tab=orders` — opens directly on Orders tab (if supported)
- [ ] Redirects: `/account` → `/login?redirect=/account` (unauthenticated)

---

## 20. Location Detection

- [ ] "Use My Location" on checkout → browser permission prompt appears
- [ ] Grant GPS permission → coordinates fetched → BigDataCloud API called → city/state/pincode fills form
- [ ] Deny GPS permission → error message shown, manual entry still works
- [ ] BigDataCloud API timeout → fallback message, form usable
- [ ] Metro city detected (Mumbai, Delhi, Bangalore, etc.) → delivery estimate: Standard 3-4 days, Express 1-2 days
- [ ] Non-metro city detected → delivery estimate: Standard 5-7 days, Express 2-3 days
- [ ] IP-based city detection on homepage (silent, no permission) → "Delivering to [City]" in announcement bar
- [ ] City stored in `localStorage` after detection → persists across page loads
- [ ] No internet → IP detection silently fails, announcement bar shows text fallback

---

## 21. Wishlist (localStorage)

- [ ] Add to wishlist — product ID stored in localStorage
- [ ] Remove from wishlist — product ID removed
- [ ] Wishlist persists across page refresh and new tabs
- [ ] Wishlist works without being logged in (localStorage-based)
- [ ] Visit `/wishlist` — products fetched from API using stored IDs
- [ ] Wishlist item for deleted/archived product — detail page returns 404, wishlist page handles gracefully

---

## 22. Offline / No Internet

- [ ] Homepage with no internet — Next.js cached pages may still load
- [ ] Product page with no internet — cached: loads; uncached: error state
- [ ] Cart actions with no internet — fetch fails, error toast shown
- [ ] Checkout with no internet — form displays but API calls fail with error
- [ ] Supabase calls fail gracefully — no unhandled promise rejections
- [ ] Anthropic calls fail gracefully — error shown in advisor, not blank screen

---

## 23. Performance Checkpoints

- [ ] Homepage loads in < 3s on 4G (Next.js SSR with 30s revalidation cache)
- [ ] Products page loads in < 2s (server-rendered, no client waterfall)
- [ ] Product detail loads in < 2s
- [ ] Cart drawer opens instantly (Zustand in-memory, no API call)
- [ ] Checkout page loads in < 3s (requires auth + address API calls)
- [ ] Images load via Cloudinary CDN (check `next/image` optimization applied)
- [ ] No layout shift (CLS) on homepage hero image load
- [ ] Admin dashboard loads in < 5s (multiple parallel DB queries)
- [ ] Admin advisor response time < 10s (Claude Sonnet call)
- [ ] Rate limiter does not add perceptible latency to normal requests

---

## 24. Security Headers

- [ ] Response includes `X-Frame-Options: SAMEORIGIN` — page cannot be iframed
- [ ] Response includes `X-Content-Type-Options: nosniff`
- [ ] Response includes `X-XSS-Protection: 1; mode=block`
- [ ] Response includes `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Response includes `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- [ ] API routes do not expose `SUPABASE_SERVICE_ROLE_KEY` in any response
- [ ] API routes do not expose `ANTHROPIC_API_KEY` in any response
- [ ] Supabase RLS prevents users from reading other users' data via anon client

---

## 25. Mobile / Responsive Behavior

- [ ] Homepage renders correctly on 375px (iPhone SE) — no horizontal scroll
- [ ] Product grid switches to 2-column on mobile
- [ ] Cart drawer is full-screen on mobile (not side panel)
- [ ] Checkout form is usable on mobile keyboard (no covered inputs)
- [ ] Navbar collapses to hamburger menu on mobile
- [ ] Admin panel is usable on tablet (min 768px)
- [ ] Glitch animation font size clamps correctly on mobile (clamp(2rem, 11vw, 7rem))
- [ ] WhatsApp button visible on all screen sizes

---

## 26. Paytm Payment Integration

- [ ] "Pay with Paytm" button triggers `/api/paytm/create-order` → returns transaction token
- [ ] Paytm JS SDK loads and renders payment UI
- [ ] Successful payment triggers `/api/paytm/verify-payment` → order created in DB
- [ ] Failed payment returns to checkout with error message
- [ ] User closes Paytm modal (APP_CLOSED) → checkout state preserved
- [ ] Paytm callback with tampered amount → server-side verification catches mismatch
- [ ] Order created with correct: items, total, discount, shipping, user ID
- [ ] Loyalty points awarded after successful payment (if configured)
- [ ] Discount code usage count incremented after successful payment

---

## 27. Known Edge Cases from Code

- [ ] `order_number` on success page is public (no auth check) — verify if this is acceptable
- [ ] Category filter in `/api/store/products` falls back to no-filter if slug not found (silent, no error)
- [ ] Rate limit is in-memory per serverless instance — different instances have independent limits (expected on Vercel)
- [ ] `sessionStorage` cleared on browser close — glitch intro will replay on next session
- [ ] Supabase admin client (`Database` type) resolves all tables to `never` due to incomplete type definition — actual runtime works but TypeScript errors exist in paytm routes
- [ ] `/api/store/order` does not require auth — any order number can be looked up (privacy consideration)
- [ ] Cart state is NOT persisted (in-memory Zustand) — browser refresh empties cart
- [ ] Referral code failure is silent — user gets no feedback if code lookup fails due to DB error
- [ ] GlitchIntro uses two effects to avoid textRef.current being null on first render — verify this works consistently across browsers
