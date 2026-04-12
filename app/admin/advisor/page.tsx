'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, TrendingUp, Package, AlertTriangle, RefreshCw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Revenue summary', prompt: 'Give me a revenue summary and growth analysis for this month.' },
  { icon: Package, label: 'Low stock alert', prompt: 'Which products are running low on stock? What should I reorder first?' },
  { icon: AlertTriangle, label: 'Pending refunds', prompt: 'How many refund requests are pending? What should I do?' },
  { icon: RefreshCw, label: 'Growth tips', prompt: 'Based on current data, what are your top 3 recommendations to grow sales this month?' },
]

export default function AdminAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hey! I\'m Wil, your AI business advisor. I have real-time access to your store data — revenue, orders, inventory, and more. What would you like to know?' }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Add empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error ?? `Server error ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
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
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: `Error: ${msg}` }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-[#0A0A0A] rounded-full flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-xl">Wil — AI Business Advisor</h1>
          <p className="text-xs text-gray-400">Real-time store insights powered by Claude</p>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
          <button key={label} onClick={() => send(prompt)} disabled={streaming}
            className="flex items-center gap-2 border border-gray-100 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-colors text-left disabled:opacity-50">
            <Icon size={13} className="shrink-0 text-gray-400" />
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-white border border-gray-100 p-5 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-[#0A0A0A] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] text-sm rounded-none px-4 py-3 leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#0A0A0A] text-white'
                : 'bg-gray-50 text-gray-800'
            }`}>
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-gray-500" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about revenue, inventory, orders, growth strategies…"
          rows={2}
          disabled={streaming}
          className="flex-1 border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 resize-none disabled:opacity-50"
        />
        <button onClick={() => send()} disabled={!input.trim() || streaming}
          className="bg-[#0A0A0A] text-white px-4 flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
