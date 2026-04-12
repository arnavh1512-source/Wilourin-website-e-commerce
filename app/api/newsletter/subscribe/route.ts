import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { checkRateLimit, getIP, tooManyRequests } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().email().max(254) })

export async function POST(req: NextRequest) {
  // 3 signups per hour per IP
  const { allowed, retryAfterMs } = checkRateLimit(`nl:${getIP(req)}`, 3, 60 * 60 * 1000)
  if (!allowed) return tooManyRequests(retryAfterMs)

  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const admin = createAdminClient()

    const { error } = await admin
      .from('newsletter_subscribers')
      .upsert({ email, is_active: true }, { onConflict: 'email' })

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to subscribe' }, { status: 500 })
    }

    // Send welcome email via Resend (non-blocking)
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      resend.emails.send({
        from: 'Wilourin <hello@wilourin.com>',
        to: email,
        subject: "You're in — here's 10% off",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#fff;">
            <h1 style="font-family:Georgia,serif;font-weight:400;font-size:32px;margin:0 0 16px;">Welcome to Wilourin. 🖤</h1>
            <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px;">
              You're officially part of the movement. As a welcome gift, here's 10% off your first order.
            </p>
            <div style="background:#0A0A0A;color:#fff;padding:16px;text-align:center;font-size:22px;letter-spacing:4px;margin:0 0 24px;">
              WELCOME10
            </div>
            <p style="color:#888;font-size:12px;">Valid on your first order. No minimum purchase required.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:16px;">Shop Now</a>
          </div>
        `,
      }).catch(() => {}) // ignore send errors
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid email' }, { status: 400 })
  }
}
