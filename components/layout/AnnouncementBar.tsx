'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AnnouncementBarProps {
  text: string | null
}

// M2: key includes a hash of the text so new announcements always show
function textKey(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `announcement-dismissed-${Math.abs(h)}`
}

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!text) return
    try {
      if (!sessionStorage.getItem(textKey(text))) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [text])

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
