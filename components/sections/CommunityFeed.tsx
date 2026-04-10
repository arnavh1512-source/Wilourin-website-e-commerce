import Image from 'next/image'
import Link from 'next/link'
import type { LookbookSubmission } from '@/lib/types'

interface CommunityFeedProps {
  submissions: LookbookSubmission[]
}

export function CommunityFeed({ submissions }: CommunityFeedProps) {
  if (!submissions.length) return null

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-3">UGC</p>
            <h2 className="font-serif text-4xl sm:text-5xl">Styled by the Streets</h2>
          </div>
          <Link href="/lookbook" className="hidden sm:block text-xs uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity">
            View Lookbook
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {submissions.slice(0, 8).map((sub) => (
            <div key={sub.id} className="group relative aspect-square overflow-hidden bg-gray-100">
              <Image
                src={sub.photo_url}
                alt={sub.submitter_name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {sub.instagram_handle ? `@${sub.instagram_handle}` : sub.submitter_name}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/lookbook" className="inline-block border border-[#0A0A0A] text-sm uppercase tracking-widest px-10 py-3 hover:bg-[#0A0A0A] hover:text-white transition-colors">
            Submit Your Look
          </Link>
        </div>
      </div>
    </section>
  )
}
