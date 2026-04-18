'use client'

import { useEffect, useState, useCallback } from 'react'

const LETTERS = 'WILOURIN'.split('')

export function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'letters' | 'hold' | 'zoom' | 'fade' | 'done'>('letters')

  const dismiss = useCallback(() => {
    setPhase('done')
    setTimeout(() => setVisible(false), 50)
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('wil-splash-shown')) return
    sessionStorage.setItem('wil-splash-shown', '1')
    setVisible(true)

    // letter stagger: 8 letters × 150ms = 1200ms + 300ms buffer = 1500ms
    const holdTimer = setTimeout(() => setPhase('hold'), 1500)
    // hold for 1s
    const zoomTimer = setTimeout(() => setPhase('zoom'), 2500)
    // zoom+fade: 600ms
    const fadeTimer = setTimeout(() => setPhase('fade'), 3100)
    // bg fade: 400ms
    const doneTimer = setTimeout(() => { setPhase('done'); setVisible(false) }, 3500)

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(zoomTimer)
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: '#1B4332',
        opacity: phase === 'fade' ? 0 : 1,
        transition: phase === 'fade' ? 'opacity 400ms ease-out' : 'none',
        pointerEvents: phase === 'done' ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          transform: phase === 'zoom' || phase === 'fade' ? 'scale(1.05)' : 'scale(1)',
          opacity: phase === 'zoom' || phase === 'fade' ? 0 : 1,
          transition: phase === 'zoom' || phase === 'fade' ? 'transform 600ms ease-out, opacity 600ms ease-out' : 'none',
        }}
      >
        <p
          className="font-serif text-white tracking-[0.3em]"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 6rem)', fontWeight: 400 }}
          aria-label="WILOURIN"
        >
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              className="splash-letter"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {letter}
            </span>
          ))}
        </p>
      </div>

      <button
        onClick={dismiss}
        className="absolute bottom-8 right-8 text-white/40 text-xs tracking-widest uppercase hover:text-white/70 transition-colors"
        aria-label="Skip intro"
      >
        Skip
      </button>
    </div>
  )
}
