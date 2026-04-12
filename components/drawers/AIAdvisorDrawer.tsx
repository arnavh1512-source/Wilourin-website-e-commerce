'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Sparkles } from 'lucide-react'
import { useUIStore } from '@/lib/store'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_PROMPTS = [
  "What's trending in streetwear right now?",
  'Help me find a gift for a streetwear lover',
  'What fits should I layer for monsoon season?',
  'Which products are low on stock?',
]

export function AIAdvisorDrawer() {
  const { isAdvisorOpen, toggleAdvisor } = useUIStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm Wil, your personal style advisor. Ask me anything about our collection, sizing, styling tips, or what's trending. 🖤",
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isAdvisorOpen) toggleAdvisor() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isAdvisorOpen, toggleAdvisor])

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Append empty assistant bubble
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      // Anthropic requires the first message to be from 'user'.
      // Index 0 is always the UI-only greeting bubble — skip it.
      const apiMessages = newMessages.slice(1)

      const res = await fetch('/api/advisor/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: accumulated }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again!' }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (!isAdvisorOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={toggleAdvisor} />

      {/* Drawer — bottom-right panel */}
      <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[380px] sm:bottom-6 sm:right-6 flex flex-col bg-white sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        style={{ height: 'min(560px, 90vh)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-[#0A0A0A]">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Bot size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Wil — Style Advisor</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-white/50 text-[10px]">Online</p>
            </div>
          </div>
          <button onClick={toggleAdvisor} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={11} className="text-white" />
                </div>
              )}
              <div className={`max-w-[82%] text-sm px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[#0A0A0A] text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.content}
                {streaming && i === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
                  <span className="flex gap-1 py-0.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={11} className="text-gray-500" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Starter prompts — only show when no user message yet */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)} disabled={streaming}
                className="text-[11px] border border-gray-200 px-2.5 py-1 rounded-full text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 text-left">
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about styles, sizing, stock…"
            rows={1}
            disabled={streaming}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-gray-400 resize-none max-h-24 overflow-y-auto disabled:opacity-50 leading-relaxed"
            style={{ height: '42px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = '42px'
              el.style.height = `${Math.min(el.scrollHeight, 96)}px`
            }}
          />
          <button onClick={() => send()} disabled={!input.trim() || streaming}
            className="w-10 h-10 bg-[#0A0A0A] rounded-xl flex items-center justify-center text-white hover:bg-gray-800 transition-colors disabled:opacity-40 shrink-0">
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-300 pb-2">Powered by Claude · Responses may not be 100% accurate</p>
      </div>
    </>
  )
}
