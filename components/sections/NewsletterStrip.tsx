export function NewsletterStrip() {
  return (
    <section className="py-24 bg-brand-dark">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="font-raleway text-[9px] uppercase tracking-[0.45em] text-white/30 mb-8">Our Philosophy</p>
        <h2 className="font-prata text-brand-background leading-tight mb-8" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
          Clothes that<br />don&apos;t shout.
        </h2>
        <p className="font-raleway text-white/40 text-xs tracking-widest uppercase">
          Crafted in India &mdash; Worn with intention
        </p>
      </div>
    </section>
  )
}
