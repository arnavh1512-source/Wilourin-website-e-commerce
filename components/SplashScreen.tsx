'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('splashShown')) return
    setVisible(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setStarted(true)))
    const t = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('splashShown', 'true')
    }, 3800)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#292929',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <svg
        viewBox="0 0 820 200"
        style={{ width: '90vw', maxWidth: 820, overflow: 'visible' }}
      >
        <style>{`
          .ltr {
            fill: #FBFE40;
            stroke: #292929;
            stroke-width: 3;
            opacity: ${started ? 1 : 0};
          }
          @keyframes morphInflate {
            0%   { transform: scale(1);    opacity: 1; }
            40%  { transform: scale(1.18); opacity: 1; }
            55%  { transform: scale(1.12); opacity: 1; }
            75%  { transform: scale(2.4);  opacity: 1; }
            88%  { transform: scale(2.35); opacity: 1; }
            100% { transform: scale(2.5);  opacity: 0; }
          }
          ${started ? `
          .ltr { animation: morphInflate 2.6s cubic-bezier(0.34,1.4,0.64,1) forwards; }
          .l0 { animation-delay: 0.05s; transform-origin: 40px 100px; }
          .l1 { animation-delay: 0.18s; transform-origin: 137px 100px; }
          .l2 { animation-delay: 0.31s; transform-origin: 188px 100px; }
          .l3 { animation-delay: 0.44s; transform-origin: 316px 100px; }
          .l4 { animation-delay: 0.57s; transform-origin: 418px 100px; }
          .l5 { animation-delay: 0.70s; transform-origin: 503px 100px; }
          .l6 { animation-delay: 0.83s; transform-origin: 567px 100px; }
          .l7 { animation-delay: 0.96s; transform-origin: 637px 100px; }
          ` : ''}
        `}</style>

        {/* W */}
        <path className="ltr l0" d="M35 57 L52 137 L70 92 L88 137 L105 57 L115 57 L92 145 L70 100 L48 145 L25 57 Z" />

        {/* I */}
        <path className="ltr l1" d="M130 57 L144 57 L144 142 L130 142 Z" />

        {/* L */}
        <path className="ltr l2" d="M158 57 L172 57 L172 129 L218 129 L218 142 L158 142 Z" />

        {/* O */}
        <path className="ltr l3" fillRule="evenodd" d="M274 57 C297 57 316 76 316 99 C316 122 297 141 274 141 C251 141 232 122 232 99 C232 76 251 57 274 57 Z M274 71 C259 71 246 84 246 99 C246 114 259 127 274 127 C289 127 302 114 302 99 C302 84 289 71 274 71 Z" />

        {/* U */}
        <path className="ltr l4" d="M340 57 L354 57 L354 109 C354 123 364 133 378 133 C392 133 402 123 402 109 L402 57 L416 57 L416 109 C416 131 399 147 378 147 C357 147 340 131 340 109 Z" />

        {/* R */}
        <path className="ltr l5" fillRule="evenodd" d="M436 57 L450 57 L450 142 L436 142 Z M436 57 L472 57 C488 57 500 69 500 85 C500 99 490 109 476 111 L502 142 L484 142 L460 112 L450 112 L450 142 L436 142 Z M450 71 L450 99 L472 99 C480 99 486 93 486 85 C486 77 480 71 472 71 Z" />

        {/* I */}
        <path className="ltr l6" d="M520 57 L534 57 L534 142 L520 142 Z" />

        {/* N */}
        <path className="ltr l7" d="M548 57 L562 57 L612 119 L612 57 L626 57 L626 142 L612 142 L562 80 L562 142 L548 142 Z" />
      </svg>

      <button
        onClick={() => {
          setVisible(false)
          sessionStorage.setItem('splashShown', 'true')
        }}
        style={{
          position: 'absolute', bottom: 32, right: 32,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: 11,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        SKIP
      </button>
    </div>
  )
}
