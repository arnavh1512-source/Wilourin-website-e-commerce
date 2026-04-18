'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AnnouncementBarProps {
  text: string | null
}

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('announcement-dismissed')
    if (!dismissed && text) setVisible(true)
  }, [text])

  if (!visible || !text) return null

  return (
    <div className="bg-w-dark text-white text-xs text-center py-2.5 px-10 relative tracking-widest uppercase font-sans">
      <span>{text}</span>
      <button
        onClick={() => {
          setVisible(false)
          sessionStorage.setItem('announcement-dismissed', '1')
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  )
}
