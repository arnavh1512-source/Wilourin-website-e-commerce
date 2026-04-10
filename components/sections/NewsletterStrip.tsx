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
    <section className="py-20 bg-[#0A0A0A] text-white">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-4">Stay in the loop</p>
        <h2 className="font-serif text-4xl sm:text-5xl mb-4">Join the Movement</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Subscribe for exclusive drops, early access, and <strong className="text-white">10% off</strong> your first order.
        </p>
        {done ? (
          <p className="text-green-400 text-lg font-serif">You&apos;re in. Welcome to Wilourin. 🖤</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-white/50 transition-colors rounded-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-[#0A0A0A] px-8 py-3 text-xs uppercase tracking-widest font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        <p className="text-xs text-gray-600 mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}
