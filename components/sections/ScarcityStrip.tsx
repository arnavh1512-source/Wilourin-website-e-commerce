'use client'

import { useEffect, useState } from 'react'
import { SCARCITY_MESSAGES } from '@/lib/utils'

export function ScarcityStrip() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % SCARCITY_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-[#0A0A0A] text-white py-3 overflow-hidden">
      <div className="flex items-center justify-center gap-12">
        {/* Ticker */}
        <div className="flex whitespace-nowrap animate-ticker">
          {[...SCARCITY_MESSAGES, ...SCARCITY_MESSAGES].map((msg, i) => (
            <span key={i} className="text-xs uppercase tracking-widest mx-12 text-gray-300">
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
