'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AnnouncementBarProps {
  text: string | null
  loading?: boolean
}

const textKey = (text: string) => `announcement-dismissed::${text}`

export function AnnouncementBar({ text, loading }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!text) { setChecked(true); return }
    try {
      if (!sessionStorage.getItem(textKey(text))) setVisible(true)
    } catch {
      setVisible(true)
    }
    setChecked(true)
  }, [text])

  // M1: reserve height while data is still loading to prevent CLS
  if (loading) return <div className="bg-w-dark h-[37px]" aria-hidden="true" />
  if (!checked && text) return <div className="bg-w-dark h-[37px]" aria-hidden="true" />
  if (!visible || !text) return null

  return (
    <div className="bg-w-dark text-white text-xs text-center py-2.5 px-10 relative tracking-widest uppercase font-sans">
      <span>{text}</span>
      <button
        onClick={() => {
          setVisible(false)
          try { sessionStorage.setItem(textKey(text), '1') } catch {}
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  )
}
