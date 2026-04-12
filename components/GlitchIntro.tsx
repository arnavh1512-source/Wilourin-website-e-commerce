'use client'

import { useState, useEffect, useRef } from 'react'

const BRAND = 'WILOURIN'
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*<>?/'
const FRAMES = Math.ceil(1000 / 60) // ~16 frames @ 60fps = ~1 second of scramble

function rand() {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

type Phase = 'idle' | 'visible' | 'fading'

export function GlitchIntro() {
  const [phase, setPhase] = useState<Phase>('idle')
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return
    if (localStorage.getItem('intro_seen')) return

    setPhase('visible')

    const el = textRef.current
    if (!el) return

    // Phase 1: scramble characters for ~1 second at 60fps
    el.style.fontFamily = 'monospace'
    el.style.letterSpacing = '0.2em'
    el.textContent = BRAND.split('').map(rand).join('')

    let frame = 0
    const scramble = setInterval(() => {
      el.textContent = BRAND.split('').map(rand).join('')
      frame++
      if (frame >= FRAMES) {
        clearInterval(scramble)

        // Phase 2: resolve to real text
        el.textContent = BRAND
        el.style.fontFamily = "'Helvetica Neue', Arial, sans-serif"

        // Phase 3: RGB shadow fades out via CSS transition
        el.style.textShadow = '5px 0 0 rgba(255,0,0,0.9), -5px 0 0 rgba(0,150,255,0.9)'
        el.style.transition = 'text-shadow 0.4s ease-out'

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.textShadow = '0px 0 0 rgba(255,0,0,0), 0px 0 0 rgba(0,150,255,0)'
          })
        })
      }
    }, 60)

    // Phase 4: fade overlay out after 2.4s
    const fadeTimer = setTimeout(() => setPhase('fading'), 2400)
    // Phase 5: unmount + set localStorage at 3s
    const doneTimer = setTimeout(() => {
      setPhase('idle')
      localStorage.setItem('intro_seen', '1')
    }, 3000)

    return () => {
      clearInterval(scramble)
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [])

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
