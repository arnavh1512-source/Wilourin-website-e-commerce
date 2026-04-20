/**
 * In-memory rate limiter.
 * On Vercel serverless each instance has its own store — good enough for abuse
 * prevention on a small store. For global enforcement at scale, swap Map for
 * Upstash Redis.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Prune expired entries periodically to prevent memory leak
let calls = 0
function pruneIfNeeded() {
  if (++calls % 200 !== 0) return
  const now = Date.now()
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k)
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  pruneIfNeeded()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  store.set(key, { ...entry, count: entry.count + 1 })
  return { allowed: true, retryAfterMs: 0 }
}

/** Extract real client IP from Vercel / proxy headers */
export function getIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/** Standard 429 response with Retry-After header */
export function tooManyRequests(retryAfterMs: number): Response {
  const seconds = Math.ceil(retryAfterMs / 1000)
  const minutes = Math.ceil(seconds / 60)
  return new Response(
    JSON.stringify({ error: `Too many requests. Try again in ${minutes} minute(s).` }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(seconds),
      },
    }
  )
}
