'use client'

import { useState, useEffect } from 'react'

type Phase = 'idle' | 'visible' | 'fading'

export function GlitchIntro() {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    // Skip on admin routes
    if (window.location.pathname.startsWith('/admin')) return
    // Only play once
    if (localStorage.getItem('intro_seen')) return

    setPhase('visible')

    const fadeTimer  = setTimeout(() => setPhase('fading'), 2600)
    const doneTimer  = setTimeout(() => {
      setPhase('idle')
      localStorage.setItem('intro_seen', '1')
    }, 3200)

    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [])

  if (phase === 'idle') return null

  return (
    <>
      <style>{STYLES}</style>
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
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: phase === 'fading' ? 'none' : 'all',
        }}
      >
        {/* Scanlines overlay */}
        <div className="wi-scanlines" />

        {/* Glitch text */}
        <span className="wi-glitch" data-text="WILOURIN">
          WILOURIN
        </span>
      </div>
    </>
  )
}

const STYLES = `
  /* ── Scanlines ─────────────────────────────────────────── */
  .wi-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255,255,255,0.015) 2px,
      rgba(255,255,255,0.015) 4px
    );
    pointer-events: none;
    animation: wi-scan 8s linear infinite;
  }

  @keyframes wi-scan {
    0%   { background-position: 0 0; }
    100% { background-position: 0 100%; }
  }

  /* ── Base text ──────────────────────────────────────────── */
  .wi-glitch {
    position: relative;
    font-size: clamp(28px, 9vw, 90px);
    letter-spacing: 0.35em;
    color: #fff;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 400;
    text-transform: uppercase;
    user-select: none;
    animation: wi-shake 0.25s infinite;
  }

  @keyframes wi-shake {
    0%, 100% { transform: translate(0, 0); }
    20%       { transform: translate(-1px, 1px); }
    40%       { transform: translate(1px, -1px); }
    60%       { transform: translate(-1px, 0); }
    80%       { transform: translate(1px, 1px); }
  }

  /* ── Red ghost (before) ─────────────────────────────────── */
  .wi-glitch::before {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    color: #fff;
    text-shadow: -3px 0 #ff003c;
    animation: wi-slice-1 2.8s steps(1) infinite;
  }

  @keyframes wi-slice-1 {
    0%   { clip-path: polygon(0 2%,  100% 2%,  100% 8%,  0 8%);  transform: translate(-4px, 0); }
    8%   { clip-path: polygon(0 55%, 100% 55%, 100% 62%, 0 62%); transform: translate(4px,  0); }
    16%  { clip-path: polygon(0 18%, 100% 18%, 100% 26%, 0 26%); transform: translate(-4px, 1px); }
    24%  { clip-path: polygon(0 70%, 100% 70%, 100% 78%, 0 78%); transform: translate(3px,  0); }
    32%  { clip-path: polygon(0 36%, 100% 36%, 100% 42%, 0 42%); transform: translate(-3px, 0); }
    40%  { clip-path: polygon(0 5%,  100% 5%,  100% 14%, 0 14%); transform: translate(4px,  -1px); }
    48%  { clip-path: polygon(0 48%, 100% 48%, 100% 56%, 0 56%); transform: translate(-4px, 0); }
    56%  { clip-path: polygon(0 80%, 100% 80%, 100% 88%, 0 88%); transform: translate(4px,  0); }
    64%  { clip-path: polygon(0 28%, 100% 28%, 100% 34%, 0 34%); transform: translate(-2px, 0); }
    72%  { clip-path: polygon(0 60%, 100% 60%, 100% 68%, 0 68%); transform: translate(3px,  0); }
    80%  { clip-path: polygon(0 12%, 100% 12%, 100% 20%, 0 20%); transform: translate(-4px, 0); }
    88%  { clip-path: polygon(0 88%, 100% 88%, 100% 96%, 0 96%); transform: translate(4px,  1px); }
    96%  { clip-path: polygon(0 42%, 100% 42%, 100% 50%, 0 50%); transform: translate(-3px, 0); }
    100% { clip-path: polygon(0 2%,  100% 2%,  100% 8%,  0 8%);  transform: translate(-4px, 0); }
  }

  /* ── Cyan ghost (after) ─────────────────────────────────── */
  .wi-glitch::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    color: #fff;
    text-shadow: 3px 0 #00e5ff;
    animation: wi-slice-2 2.8s steps(1) infinite;
  }

  @keyframes wi-slice-2 {
    0%   { clip-path: polygon(0 65%, 100% 65%, 100% 72%, 0 72%); transform: translate(4px,  0); }
    8%   { clip-path: polygon(0 20%, 100% 20%, 100% 28%, 0 28%); transform: translate(-4px, 0); }
    16%  { clip-path: polygon(0 78%, 100% 78%, 100% 85%, 0 85%); transform: translate(3px,  -1px); }
    24%  { clip-path: polygon(0 38%, 100% 38%, 100% 44%, 0 44%); transform: translate(-4px, 0); }
    32%  { clip-path: polygon(0 52%, 100% 52%, 100% 60%, 0 60%); transform: translate(4px,  0); }
    40%  { clip-path: polygon(0 8%,  100% 8%,  100% 15%, 0 15%); transform: translate(-4px, 1px); }
    48%  { clip-path: polygon(0 72%, 100% 72%, 100% 80%, 0 80%); transform: translate(4px,  0); }
    56%  { clip-path: polygon(0 30%, 100% 30%, 100% 38%, 0 38%); transform: translate(-3px, 0); }
    64%  { clip-path: polygon(0 90%, 100% 90%, 100% 98%, 0 98%); transform: translate(4px,  0); }
    72%  { clip-path: polygon(0 44%, 100% 44%, 100% 52%, 0 52%); transform: translate(-4px, 0); }
    80%  { clip-path: polygon(0 58%, 100% 58%, 100% 66%, 0 66%); transform: translate(3px,  0); }
    88%  { clip-path: polygon(0 15%, 100% 15%, 100% 22%, 0 22%); transform: translate(-4px, -1px); }
    96%  { clip-path: polygon(0 82%, 100% 82%, 100% 90%, 0 90%); transform: translate(4px,  0); }
    100% { clip-path: polygon(0 65%, 100% 65%, 100% 72%, 0 72%); transform: translate(4px,  0); }
  }

  /* ── Occasional full-row flash ──────────────────────────── */
  .wi-glitch::before {
    animation:
      wi-slice-1 2.8s steps(1) infinite,
      wi-flash   1.4s steps(1) infinite;
  }

  @keyframes wi-flash {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
    20%, 24%, 55%                           { opacity: 0; }
  }
`
