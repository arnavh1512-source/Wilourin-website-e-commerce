'use client'

import { SCARCITY_MESSAGES } from '@/lib/utils'

export function ScarcityStrip() {
  return (
    <div className="bg-w-forest text-white py-3 overflow-hidden">
      <div className="flex items-center justify-center gap-12">
        <div className="flex whitespace-nowrap animate-ticker">
          {[...SCARCITY_MESSAGES, ...SCARCITY_MESSAGES].map((msg, i) => (
            <span key={i} className="font-sans text-xs uppercase tracking-widest mx-6 sm:mx-12 text-white/80">
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
