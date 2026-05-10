'use client'

import { useState } from 'react'
import { MessageCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const FAQS = [
  { q: 'How long does delivery take?', a: 'Standard shipping takes 5–7 business days. Express shipping takes 2–3 business days.' },
  { q: 'What is your return policy?', a: 'We accept returns within 7 days of delivery for unused items in original packaging. Contact us via WhatsApp to initiate a return.' },
  { q: 'Are the sizes true to fit?', a: 'Most of our pieces are oversized. We recommend sizing down for a regular fit. Check the size guide on each product page.' },
  { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive an email with tracking details. You can also check your order status in My Account.' },
  { q: 'Do you accept exchanges?', a: 'Yes! We offer size exchanges within 7 days of delivery. WhatsApp us with your order number and desired size.' },
  { q: 'Is COD available?', a: 'Currently we accept payments via Razorpay (UPI, Cards, Wallets, Net Banking, EMI). COD is not available at this time.' },
]

export function HelpDrawer() {
  const { isHelpOpen, toggleHelp } = useUIStore()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* Fixed help button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* WhatsApp + Help button */}
        <button
          onClick={toggleHelp}
          className="flex items-center gap-2 bg-[#25D366] text-white text-xs px-4 py-2.5 rounded-full shadow-lg hover:bg-[#1ebe5c] transition-all hover:scale-105"
          aria-label="Help & FAQ"
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">Help</span>
        </button>
      </div>

      {/* Backdrop */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[55] bg-black/30 drawer-backdrop" onClick={toggleHelp} aria-hidden />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 right-0 h-[85vh] w-full max-w-sm z-[60] bg-white shadow-2xl flex flex-col rounded-tl-2xl transition-transform duration-350',
          isHelpOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="font-serif text-xl">Help Centre</span>
          <button onClick={toggleHelp} aria-label="Close" className="opacity-60 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-sm text-gray-500 mb-5">Frequently asked questions</p>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp size={14} className="shrink-0 text-gray-400" /> : <ChevronDown size={14} className="shrink-0 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="px-6 py-5 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3">Can&apos;t find your answer? Chat with us.</p>
          <a
            href="https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20need%20help%20with%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm py-3 rounded font-medium hover:bg-[#1ebe5c] transition-colors"
          >
            <MessageCircle size={16} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}
