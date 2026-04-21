import { MessageCircle } from 'lucide-react'

export function NewsletterStrip() {
  return (
    <section className="py-20 bg-w-surface text-white">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <p className="font-raleway text-xs uppercase tracking-[0.4em] text-white/40 mb-4">Stay Updated</p>
        <h2 className="font-prata text-3xl sm:text-4xl md:text-5xl text-white mb-4">Get Exclusive Updates</h2>
        <p className="font-raleway text-white/50 text-xs sm:text-sm mb-8 leading-relaxed">
          New drops, early access, and exclusive offers — straight to your WhatsApp.
        </p>
        <a
          href="https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20want%20to%20stay%20updated%20on%20new%20drops%20and%20offers!"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#25D366] text-white font-raleway text-xs sm:text-sm uppercase tracking-[0.2em] px-6 sm:px-10 py-3.5 sm:py-4 hover:bg-[#1ebe5c] transition-colors"
        >
          <MessageCircle size={18} />
          Message us on WhatsApp
        </a>
        <p className="font-raleway text-xs text-white/30 mt-6">+91 81400 81461</p>
      </div>
    </section>
  )
}
