'use client'

import { useState } from 'react'
import { useToastStore } from '@/lib/store'

export function NewsletterStrip() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const addToast = useToastStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setDone(true)
        addToast("You're in! Check your inbox for 10% off.", 'success')
      } else {
        addToast(data.message ?? 'Something went wrong.', 'error')
      }
    } catch {
      addToast('Failed to subscribe. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 bg-w-dark text-white">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.4em] text-white/40 mb-4">Stay in the loop</p>
        <h2 className="font-serif text-4xl sm:text-5xl text-white mb-4">Join the Movement</h2>
        <p className="font-sans text-white/50 text-sm mb-8 leading-relaxed">
          Subscribe for exclusive drops, early access, and <strong className="text-white">10% off</strong> your first order.
        </p>
        {done ? (
          <p className="font-serif text-w-forest text-lg">You&apos;re in. Welcome to Wilourin.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-transparent border border-white/30 text-white placeholder:text-white/40 px-4 py-3 text-sm outline-none focus:border-white/60 transition-colors rounded-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-w-forest text-white px-8 py-3 font-sans text-xs uppercase tracking-widest hover:bg-w-emerald transition-colors disabled:opacity-50 rounded-none"
            >
              {loading ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        <p className="font-sans text-xs text-white/30 mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}
