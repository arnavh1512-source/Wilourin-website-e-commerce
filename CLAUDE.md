# WILOURIN — CLAUDE CODE RULES

## CRITICAL — NEVER TOUCH THESE FILES
- middleware.ts
- lib/supabase/client.ts
- lib/supabase/server.ts
- app/api/auth/login/route.ts
- app/api/auth/signup/route.ts
- components/layout/Providers.tsx

## AUTH RULES
- Never call supabase.auth.getSession() in any client component
- Never call supabase.auth.getUser() in useEffect
- Never add onAuthStateChange listeners anywhere
- Always get user from server components only
- Always pass userId as prop from server to client components

## DATA FETCHING RULES
- Never call Supabase directly from browser/client components
- **Server components (app/*.tsx without 'use client') MAY call Supabase directly** — they run server-side and are safe
- Client components ('use client') must ONLY call fetch('/api/...')
- All Supabase calls from client components must go through /api/* routes
- Every new feature that needs client-side data needs a new API route in app/api/

## WHEN ADDING NEW FEATURES
- Create the API route first
- Then build the UI component
- Test the API route works before building UI
- Never modify existing working API routes
- Add new routes, never edit old ones

## BEFORE EVERY PUSH
- Make sure npm run build passes with no errors
- Make sure no TypeScript errors exist
- Test the specific feature added only
- Do not refactor or clean up other code

## PAYMENTS
- Never touch app/api/paytm/ routes
- Never modify checkout flow once working
- Test every payment change with test credentials first

## DATABASE
- Never modify existing Supabase tables directly
- New features get new tables
- Always use service role key in API routes
- Never expose service role key to client

## STYLE RULES
- Keep existing Tailwind classes
- Don't change fonts or colors without being asked
- Don't refactor working components
