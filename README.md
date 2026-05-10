# Wilourin — Premium Indian Streetwear E-Commerce

Full-stack e-commerce platform for **Wilourin**, a premium streetwear brand from Ahmedabad, India. Built with Next.js 14 App Router, Supabase, and Paytm payments.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, Server Components) |
| Database & Auth | Supabase (PostgreSQL + RLS + SSR auth) |
| Styling | Tailwind CSS |
| Media | Cloudinary (product images, uploads) |
| Payments | Paytm Payment Gateway |
| AI Advisor | Anthropic Claude (admin business advisor) |
| Email | Resend |
| Deployment | Vercel |
| Language | TypeScript |

---

## Features

### Customer Storefront
- Product catalogue with category, size, price, and badge filters
- Product detail pages with image gallery, size guide, and variant selection
- Cart with promo/discount code support and live shipping calculation
- Checkout with address management and Paytm payment
- Order tracking via order number lookup
- Wishlist (persisted per account)
- Lookbook page
- Newsletter signup with welcome email
- Loyalty points system (Bronze / Silver / Gold tiers)
- Glitch intro animation (shown once per visitor)
- Full mobile-responsive design

### Customer Account
- Email + password auth (Supabase SSR, cookie-based)
- Profile management with server-side avatar upload
- Saved addresses (multiple, with default)
- Order history and status tracking
- Loyalty points history

### Admin Dashboard (`/admin`)
- Orders management — status updates, tracking numbers, notes
- Products & variants management (sizes, stock, images via Cloudinary)
- Categories management
- Discount codes (percentage and fixed, expiry, usage limits)
- Customer list with order stats
- Homepage content editor (hero, featured products/categories, announcements)
- Lookbook management
- Size guide management
- Store settings (shipping thresholds, tax, return policy)
- Media library
- Loyalty programme management
- AI business advisor (Claude Sonnet) with real-time store insights

### Security
- All Supabase calls server-side only via `/api/*` routes
- Service role key never exposed to client
- Avatar uploads validated and proxied through server API
- Input validated with Zod on every write endpoint
- Rate limiting on advisor and sensitive endpoints
- `crypto.randomBytes` for order number generation
- Security headers via `next.config.mjs`

---

## Environment Variables

Create `.env.local` in the project root:

```env
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic (admin AI advisor)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Paytm Payment Gateway
PAYTM_MERCHANT_ID=your_paytm_merchant_id
PAYTM_MERCHANT_KEY=your_paytm_merchant_key
PAYTM_WEBSITE=WEBSTAGING
PAYTM_CHANNEL_ID=WEB
PAYTM_INDUSTRY_TYPE=Retail
NEXT_PUBLIC_PAYTM_MERCHANT_ID=your_paytm_merchant_id

# Cloudinary (media/image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Resend (transactional email)
RESEND_API_KEY=your_resend_api_key
```

> **Never commit `.env.local` to git.** It is already in `.gitignore`.

---

## Running Locally

**Prerequisites:** Node.js 18+, npm

```bash
# 1. Clone the repo
git clone https://github.com/arnavh1512-source/Wilourin-website-e-commerce.git
cd Wilourin-website-e-commerce

# 2. Install dependencies
npm install

# 3. Add environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin) — requires a user row in the `admin_users` Supabase table.

---

## Deployment (Vercel)

1. Push the repo to GitHub (already done).
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo.
3. Add all environment variables from the table above in the Vercel project settings. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
4. Set `PAYTM_WEBSITE` to `DEFAULT` for production (vs `WEBSTAGING` for test).
5. Deploy — Vercel auto-detects Next.js, no build config needed.

For subsequent deploys, every push to `main` triggers an automatic Vercel deployment.

---

## Project Structure

```
app/
├── (storefront)         # Customer-facing pages
│   ├── page.tsx         # Homepage
│   ├── products/        # Catalogue + product detail
│   ├── checkout/        # Checkout + success
│   ├── account/         # Customer account
│   ├── wishlist/
│   ├── lookbook/
│   └── search/
├── admin/               # Admin dashboard (protected)
│   ├── orders/
│   ├── products/
│   ├── customers/
│   ├── discounts/
│   ├── homepage/
│   ├── settings/
│   └── advisor/
└── api/                 # All API routes
    ├── account/         # Account CRUD
    ├── admin/           # Admin CRUD (auth-gated)
    ├── advisor/         # AI advisor (admin only)
    ├── store/           # Public product/order data
    ├── paytm/           # Payment gateway
    └── auth/            # Login / signup / logout

components/
├── layout/              # Navbar, footer, providers
├── drawers/             # Cart, help drawers
└── ui/                  # Shared UI components

lib/
├── supabase/            # client.ts, server.ts, admin.ts
├── store.ts             # Zustand stores (cart, UI, toast)
└── utils.ts             # Formatting, helpers
```
