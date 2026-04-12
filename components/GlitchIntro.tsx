'use client'

import { useState, useEffect, useRef } from 'react'

const BRAND = 'WILOURIN'
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*<>?/'
const SCRAMBLE_DURATION_MS = 1000
const INTERVAL_MS = 60

function rand() {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

type Phase = 'idle' | 'visible' | 'fading'

export function GlitchIntro() {
  const [phase, setPhase] = useState<Phase>('idle')
  const textRef = useRef<HTMLSpanElement>(null)

  // Effect 1: decide whether to show the intro
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return
    if (sessionStorage.getItem('intro_seen')) return
    setPhase('visible')
  }, [])

  // Effect 2: start the scramble animation — only runs once the span is in the DOM
  useEffect(() => {
    if (phase !== 'visible') return

    const el = textRef.current
    if (!el) return

    el.textContent = BRAND.split('').map(rand).join('')

    let elapsed = 0
    const scramble = setInterval(() => {
      el.textContent = BRAND.split('').map(rand).join('')
      elapsed += INTERVAL_MS

      if (elapsed >= SCRAMBLE_DURATION_MS) {
        clearInterval(scramble)

        // Resolve to real text
        el.textContent = BRAND
        el.style.fontFamily = "'Helvetica Neue', Arial, sans-serif"
        el.style.fontWeight = '900'

        // RGB glitch shadow — start bright
        el.style.textShadow = '6px 0 0 rgba(255,0,0,0.9), -6px 0 0 rgba(0,150,255,0.9)'
        el.style.transition = 'text-shadow 0.5s ease-out'

        // Fade the shadow off on next paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.textShadow = '0px 0 0 rgba(255,0,0,0), 0px 0 0 rgba(0,150,255,0)'
          })
        })
      }
    }, INTERVAL_MS)

    // Fade the overlay out at 2.4s
    const fadeTimer = setTimeout(() => setPhase('fading'), 2400)
    // Unmount + mark seen at 3s
    const doneTimer = setTimeout(() => {
      setPhase('idle')
      sessionStorage.setItem('intro_seen', '1')
    }, 3000)

    return () => {
      clearInterval(scramble)
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [phase])

  if (phase === 'idle') return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: phase === 'fading' ? 'none' : 'all',
      }}
    >
      <span
        ref={textRef}
        style={{
          color: '#fff',
          fontSize: 'clamp(2rem, 11vw, 7rem)',
          fontWeight: 900,
          letterSpacing: '0.2em',
          fontFamily: 'monospace',
          userSelect: 'none',
        }}
      />
    </div>
  )
}
