'use client'

import { useEffect, useState } from 'react'

const LETTERS = ['W', 'I', 'L', 'O', 'U', 'R', 'I', 'N']

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'inflate' | 'explode' | 'exit'>('idle')

  useEffect(() => {
    if (sessionStorage.getItem('splashShown')) return
    setVisible(true)
    const t1 = setTimeout(() => setPhase('inflate'), 50)
    const t2 = setTimeout(() => setPhase('explode'), 1300)
    const t3 = setTimeout(() => setPhase('exit'), 2300)
    const t4 = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('splashShown', 'true')
    }, 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  if (!visible) return null

  const groupScale = phase === 'exit' ? 3 : phase === 'explode' ? 2.5 : phase === 'inflate' ? 1.8 : 1
  const groupOpacity = phase === 'exit' ? 0 : 1

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={phase === 'exit' ? 'Wilourin loaded' : 'Loading Wilourin'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#292929',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 500ms ease' : 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: phase === 'explode' ? '12px' : phase === 'inflate' ? '8px' : '4px',
          transform: `scale(${groupScale})`,
          opacity: groupOpacity,
          transition: phase === 'exit'
            ? 'transform 500ms ease, opacity 500ms ease'
            : phase === 'explode'
            ? 'transform 960ms cubic-bezier(0,0.61416,0,1), gap 960ms ease'
            : phase === 'inflate'
            ? 'transform 1230ms cubic-bezier(0.34,1.56,0.64,1), gap 800ms ease'
            : 'none',
        }}
      >
        {LETTERS.map((letter, i) => (
          <InflateLetter key={i} letter={letter} phase={phase} delay={i * 80} />
        ))}
      </div>

      <button
        onClick={() => {
          setVisible(false)
          sessionStorage.setItem('splashShown', 'true')
        }}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 32,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        SKIP
      </button>
    </div>
  )
}

function InflateLetter({
  letter,
  phase,
  delay,
}: {
  letter: string
  phase: string
  delay: number
}) {
  const [localPhase, setLocalPhase] = useState<'hidden' | 'normal' | 'inflate' | 'explode'>('hidden')

  useEffect(() => {
    if (phase === 'idle') return
    const timers: ReturnType<typeof setTimeout>[] = []
    if (phase === 'inflate') {
      timers.push(setTimeout(() => setLocalPhase('normal'), delay))
      timers.push(setTimeout(() => setLocalPhase('inflate'), delay + 200))
    }
    if (phase === 'explode') {
      timers.push(setTimeout(() => setLocalPhase('explode'), delay))
    }
    return () => timers.forEach(clearTimeout)
  }, [phase, delay])

  const scale =
    localPhase === 'explode' ? 1.15
    : localPhase === 'inflate' ? 1.08
    : localPhase === 'normal' ? 1
    : 0.6

  const borderRadius =
    localPhase === 'explode' ? '30%'
    : localPhase === 'inflate' ? '20%'
    : '4px'

  const width =
    letter === 'I' ? 28
    : letter === 'W' || letter === 'M' ? 58
    : 44

  return (
    <div
      style={{
        width,
        height: 64,
        background: '#FBFE40',
        borderRadius,
        transform: `scale(${scale})`,
        opacity: localPhase === 'hidden' ? 0 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: '2px solid #292929',
        outlineOffset: '-1px',
        transition:
          localPhase === 'explode'
            ? 'transform 840ms cubic-bezier(0,0.61416,0,1), border-radius 840ms ease, opacity 200ms'
            : localPhase === 'inflate'
            ? 'transform 900ms cubic-bezier(0.34,1.56,0.64,1), border-radius 900ms ease'
            : localPhase === 'normal'
            ? 'transform 200ms ease, opacity 200ms ease'
            : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 36,
          fontWeight: 600,
          color: '#292929',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {letter}
      </span>
    </div>
  )
}
