import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Learn about Wilourin — a premium Indian streetwear brand from Ahmedabad built for the bold and fearless.',
}

const VALUES = [
  { title: 'Quality First', body: 'Every piece is crafted from premium fabrics — 280gsm cotton, Japanese denim, and technical materials that last.' },
  { title: 'Made in India', body: 'Proudly designed and produced in India. We work with local artisans and manufacturers who share our standards.' },
  { title: 'Community Driven', body: 'Our community shapes what we make. From lookbook submissions to feedback on fit — you are part of the brand.' },
  { title: 'Sustainability', body: 'We produce in limited quantities to reduce waste. No fast fashion — only pieces you\'ll wear for years.' },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1503341338985-95ad33e8e0b4?w=1600&q=85"
          alt="Wilourin brand story"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-xs uppercase tracking-[0.4em] mb-5 opacity-70">Est. 2024 · Ahmedabad, India</p>
          <h1 className="font-serif text-6xl sm:text-7xl font-light leading-none">Our Story</h1>
        </div>
      </section>

      {/* Brand story */}
      <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-6">The Beginning</p>
        <p className="font-serif text-2xl sm:text-3xl font-light leading-relaxed text-gray-800 mb-8">
          &ldquo;We built Wilourin for the streets of India — where culture is raw, style is bold, and authenticity is everything.&rdquo;
        </p>
        <p className="text-gray-600 text-sm leading-relaxed mb-5">
          Wilourin was born in Ahmedabad with a single conviction: Indian streetwear deserved better. Not mass-produced fast fashion, not watered-down Western knockoffs — but premium, intentional clothing built for the next generation of bold, fearless individuals who dress for themselves.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Every piece in our collection starts with a question: would we wear this every day? If the answer is yes, we make it. If not, we go back to the drawing board. The result is a tight, curated range of clothing that actually earns a permanent place in your wardrobe.
        </p>
      </section>

      {/* Values grid */}
      <section className="py-16 bg-[#F5F5F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-3">What We Stand For</p>
            <h2 className="font-serif text-4xl">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white p-8 border border-gray-100">
                <h3 className="font-serif text-xl mb-3">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image strip */}
      <section className="grid grid-cols-3 h-64 sm:h-80">
        {[
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600',
        ].map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            <Image src={src} alt="Wilourin style" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="33vw" />
          </div>
        ))}
      </section>

      {/* Sustainability */}
      <section id="returns" className="py-20 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-4">Sustainability</p>
        <h2 className="font-serif text-4xl mb-6">Less, But Better</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-5">
          We believe in making fewer, better things. Each collection is produced in limited runs — when it&apos;s gone, it&apos;s gone. This keeps our waste near zero and makes every piece feel special.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          We&apos;re actively working towards using more recycled materials and partnering with ethical manufacturers across Gujarat and Maharashtra. This is a journey, not a destination — and we&apos;re transparent about where we are.
        </p>
      </section>

      {/* Returns policy */}
      <section className="py-16 bg-[#0A0A0A] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-4xl mb-6">Returns & Exchanges</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-8">
            Not happy with your order? We accept returns within <strong className="text-white">7 days</strong> of delivery for unused items in original packaging. Exchanges for different sizes are always welcome. Just WhatsApp us with your order number — we&apos;ll sort it out fast.
          </p>
          <a
            href="https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20want%20to%20return%2Fexchange%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm px-8 py-3 rounded font-medium hover:bg-[#1ebe5c] transition-colors"
          >
            <MessageCircle size={16} />
            Start a Return on WhatsApp
          </a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-serif text-4xl mb-4">Get in Touch</h2>
        <p className="text-gray-500 text-sm mb-8">We&apos;re a small team and we reply fast. Reach us any way you prefer.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700 mb-10">
          <div className="border border-gray-100 p-5 rounded">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Email</p>
            <p>hello@wilourin.com</p>
          </div>
          <div className="border border-gray-100 p-5 rounded">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Phone</p>
            <p>+91 81400 81461</p>
          </div>
          <div className="border border-gray-100 p-5 rounded">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Location</p>
            <p>Ahmedabad, Gujarat</p>
          </div>
        </div>
        <Link href="/lookbook" className="inline-block border border-[#0A0A0A] text-sm uppercase tracking-widest px-10 py-3 hover:bg-[#0A0A0A] hover:text-white transition-colors">
          Join the Community
        </Link>
      </section>
    </div>
  )
}
