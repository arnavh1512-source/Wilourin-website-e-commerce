'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('splashShown')) return
    setVisible(true)
    const fadeTimer = setTimeout(() => setFading(true), 2200)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('splashShown', 'true')
    }, 2800)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#1A1A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 600ms ease',
      }}
    >
      <div style={{ width: '60vw', maxWidth: 520, opacity: 1 }}>
        <Image
          src="/logo.jpg"
          alt="Wilourin"
          width={520}
          height={160}
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          priority
        />
      </div>
    </div>
  )
}
