'use client'

import { useState, useEffect } from 'react'
import { Cookie } from 'lucide-react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-5 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <Cookie size={20} className="text-[#0A0A0A] shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700 leading-relaxed">
          We use cookies to improve your experience and analyse site traffic. By clicking{' '}
          <strong>Accept</strong>, you agree to our use of cookies.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={accept}
          className="flex-1 bg-[#0A0A0A] text-white text-xs uppercase tracking-widest py-2 px-4 rounded hover:bg-gray-800 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={decline}
          className="flex-1 border border-gray-300 text-gray-600 text-xs uppercase tracking-widest py-2 px-4 rounded hover:bg-gray-50 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
