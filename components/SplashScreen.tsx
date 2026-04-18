'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Letter definitions ──────────────────────────────────────────── */
// viewBox: 0 0 900 200, letters y=40–160
const LETTERS = [
  {
    id: 'W',
    d: 'M 60,40 L 80,150 L 100,88 L 120,150 L 140,40',
    pts: [{ x: 60, y: 40, dx: -20, dy: -15 }, { x: 140, y: 40, dx: 20, dy: -15 },
          { x: 100, y: 88, dx: 0, dy: -25 }, { x: 80, y: 150, dx: -15, dy: 20 },
          { x: 120, y: 150, dx: 15, dy: 20 }],
  },
  {
    id: 'I1',
    d: 'M 200,40 L 200,160',
    pts: [{ x: 200, y: 40, dx: 0, dy: -25 }, { x: 200, y: 160, dx: 0, dy: 25 }],
  },
  {
    id: 'L',
    d: 'M 260,40 L 260,160 L 340,160',
    pts: [{ x: 260, y: 40, dx: -20, dy: -15 }, { x: 260, y: 160, dx: -20, dy: 15 },
          { x: 340, y: 160, dx: 20, dy: 15 }],
  },
  {
    id: 'O',
    d: 'M 400,40 A 40,60 0 0,1 440,100 A 40,60 0 0,1 400,160 A 40,60 0 0,1 360,100 A 40,60 0 0,1 400,40',
    pts: [{ x: 400, y: 40, dx: 0, dy: -25 }, { x: 440, y: 100, dx: 25, dy: 0 },
          { x: 400, y: 160, dx: 0, dy: 25 }, { x: 360, y: 100, dx: -25, dy: 0 }],
  },
  {
    id: 'U',
    d: 'M 472,40 L 472,126 C 472,175 528,175 528,126 L 528,40',
    pts: [{ x: 472, y: 40, dx: -20, dy: -15 }, { x: 528, y: 40, dx: 20, dy: -15 },
          { x: 500, y: 158, dx: 0, dy: 25 }],
  },
  {
    id: 'R',
    d: 'M 568,160 L 568,40 L 604,40 Q 636,40 636,74 Q 636,108 604,108 L 568,108 L 636,160',
    pts: [{ x: 568, y: 40, dx: -20, dy: -15 }, { x: 608, y: 40, dx: 10, dy: -20 },
          { x: 636, y: 74, dx: 25, dy: 0 }, { x: 636, y: 160, dx: 20, dy: 20 }],
  },
  {
    id: 'I2',
    d: 'M 700,40 L 700,160',
    pts: [{ x: 700, y: 40, dx: 0, dy: -25 }, { x: 700, y: 160, dx: 0, dy: 25 }],
  },
  {
    id: 'N',
    d: 'M 768,160 L 768,40 L 832,160 L 832,40',
    pts: [{ x: 768, y: 40, dx: -20, dy: -15 }, { x: 832, y: 40, dx: 20, dy: -15 },
          { x: 768, y: 160, dx: -15, dy: 20 }, { x: 832, y: 160, dx: 20, dy: 20 }],
  },
]

const BG_LINE_Y = [50, 78, 100, 122, 150]

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'drawing' | 'hold' | 'exit' | 'done'>('drawing')
  const [linesIn, setLinesIn] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const didAnimate = useRef(false)

  useEffect(() => {
    try { if (sessionStorage.getItem('splashShown')) return } catch {}
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible || didAnimate.current) return
    didAnimate.current = true

    // Lines sweep in immediately
    setTimeout(() => setLinesIn(true), 50)

    // Letter stroke animations
    setTimeout(() => {
      const svg = svgRef.current
      if (!svg) return

      LETTERS.forEach((letter, i) => {
        const path = svg.querySelector<SVGPathElement>(`[data-letter="${letter.id}"]`)
        if (!path) return

        const len = path.getTotalLength()
        path.style.strokeDasharray = `${len}`
        path.style.strokeDashoffset = `${len}`

        setTimeout(() => {
          // Force layout so transition picks up the starting value
          void path.getBoundingClientRect()
          path.style.transition = 'stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.35, 1)'
          path.style.strokeDashoffset = '0'

          // Burst particles when letter finishes
          setTimeout(() => {
            svg.querySelectorAll<SVGCircleElement>(`[data-group="${letter.id}"]`).forEach((dot) => {
              const dx = parseFloat(dot.dataset.dx ?? '0')
              const dy = parseFloat(dot.dataset.dy ?? '0')
              dot.animate(
                [
                  { opacity: 1, transform: 'translate(0px,0px) scale(0)' },
                  { opacity: 1, transform: `translate(${dx}px,${dy}px) scale(1)`, offset: 0.55 },
                  { opacity: 0, transform: `translate(${dx}px,${dy}px) scale(0.4)` },
                ],
                { duration: 420, easing: 'ease-out', fill: 'forwards' }
              )
            })
          }, 620)
        }, i * 200)
      })
    }, 100)

    // Phase timers
    const t1 = setTimeout(() => setPhase('hold'), 2900)
    const t2 = setTimeout(() => setPhase('exit'), 3700)
    const t3 = setTimeout(() => {
      setPhase('done')
      setVisible(false)
      try { sessionStorage.setItem('splashShown', 'true') } catch {}
    }, 4600)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [visible])

  const skip = () => {
    setPhase('exit')
    setTimeout(() => {
      setVisible(false)
      try { sessionStorage.setItem('splashShown', 'true') } catch {}
    }, 600)
  }

  if (!visible || phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#292929',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 600ms ease' : 'none',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 900 200"
        style={{ width: '90vw', maxWidth: 820, height: 'auto',
          transform: phase === 'exit' ? 'scale(1.08)' : 'scale(1)',
          transition: phase === 'exit' ? 'transform 600ms cubic-bezier(0.16,1,0.3,1)' : 'none',
        }}
        overflow="visible"
      >
        {/* Background lines */}
        {BG_LINE_Y.map((y, i) => (
          <line key={i} x1={-100} y1={y} x2={1000} y2={y}
            stroke="#fff" strokeWidth={0.7}
            style={{ opacity: linesIn ? 0.18 : 0,
              transition: `opacity 800ms ease ${i * 100}ms` }}
          />
        ))}

        {/* Letter strokes + particles */}
        {LETTERS.map((letter) => (
          <g key={letter.id}>
            <path
              data-letter={letter.id}
              d={letter.d}
              fill="none"
              stroke="#FBFE40"
              strokeWidth={1.5}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            {letter.pts.map((p, j) => (
              <circle
                key={j}
                data-group={letter.id}
                data-dx={p.dx}
                data-dy={p.dy}
                cx={p.x} cy={p.y} r={3}
                fill="#FBFE40"
                style={{ opacity: 0, transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            ))}
          </g>
        ))}
      </svg>

      <button
        onClick={skip}
        style={{
          position: 'absolute', bottom: 32, right: 32,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.38)', fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          fontFamily: 'system-ui,sans-serif',
        }}
      >
        SKIP
      </button>
    </div>
  )
}
