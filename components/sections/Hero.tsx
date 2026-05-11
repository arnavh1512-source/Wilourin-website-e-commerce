'use client'

interface HeroProps {
  headline: string | null
  subtext: string | null
  imageUrl: string | null
  videoUrl?: string | null
}

export function Hero({ videoUrl }: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-brand-ink" style={{ height: '100vh' }}>
      {/* Video */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ zIndex: 0 }}
      >
        {videoUrl && <source src={videoUrl} type="video/mp4" />}
        <source src="/hero.mp4" type="video/mp4" />
        <source src="https://videos.pexels.com/video-files/3931949/3931949-uhd_2560_1440_25fps.mp4" type="video/mp4" />
      </video>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-brand-background/50 to-transparent" style={{ zIndex: 1 }} />

      {/* Corner accents */}
      <div className="absolute top-20 left-6 z-[5] pointer-events-none w-10 h-10">
        <div className="absolute top-0 left-0 w-10 h-px bg-brand-background/50" />
        <div className="absolute top-0 left-0 w-px h-10 bg-brand-background/50" />
      </div>
      <div className="absolute top-20 right-6 z-[5] pointer-events-none w-10 h-10">
        <div className="absolute top-0 right-0 w-10 h-px bg-brand-background/50" />
        <div className="absolute top-0 right-0 w-px h-10 bg-brand-background/50" />
      </div>
      <div className="absolute bottom-16 left-6 z-[5] pointer-events-none w-10 h-10">
        <div className="absolute bottom-0 left-0 w-px h-10 bg-brand-background/50" />
        <div className="absolute bottom-0 left-0 w-10 h-px bg-brand-background/50" />
      </div>
      <div className="absolute bottom-16 right-6 z-[5] pointer-events-none w-10 h-10">
        <div className="absolute bottom-0 right-0 w-px h-10 bg-brand-background/50" />
        <div className="absolute bottom-0 right-0 w-10 h-px bg-brand-background/50" />
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[5] flex flex-col items-center gap-1" style={{ animation: 'scrollDown 1.5s ease-in-out infinite' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(244,241,236,0.5)" strokeWidth="1.5">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  )
}
