'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'

const InstagramIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useToastStore } from '@/lib/store'
import type { LookbookSubmission } from '@/lib/types'

const schema = z.object({
  submitter_name: z.string().min(2, 'Name is required'),
  instagram_handle: z.string().optional(),
  photo_url: z.string().url('Enter a valid image URL'),
})
type FormData = z.infer<typeof schema>

interface Props { submissions: LookbookSubmission[] }

export function LookbookClient({ submissions }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const addToast = useToastStore((s) => s.addToast)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('lookbook_submissions').insert({
        submitter_name: data.submitter_name,
        instagram_handle: data.instagram_handle || null,
        photo_url: data.photo_url,
        status: 'Pending',
      })
      if (error) {
        addToast('Failed to submit. Please try again.', 'error')
      } else {
        addToast('Look submitted! Pending admin approval.', 'success')
        reset()
        setShowForm(false)
      }
    } catch (err) {
      addToast('Failed to submit. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-3">Community</p>
          <h1 className="font-serif text-5xl">Styled by the Streets</h1>
          <p className="text-gray-500 text-sm mt-3 max-w-md">
            Real people, real style. See how the Wilourin community rocks their pieces.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#0A0A0A] text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-gray-800 transition-colors shrink-0"
        >
          <Camera size={14} />
          Submit Your Look
        </button>
      </div>

      {/* Grid */}
      {submissions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Camera size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-serif text-2xl mb-2">No looks yet</p>
          <p className="text-sm">Be the first to submit your style!</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="group break-inside-avoid relative overflow-hidden bg-gray-100 rounded-sm">
              <div className="relative aspect-[3/4]">
                <Image
                  src={sub.photo_url}
                  alt={sub.submitter_name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="text-white">
                  <p className="text-sm font-medium">{sub.submitter_name}</p>
                  {sub.instagram_handle && (
                    <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                      <InstagramIcon />@{sub.instagram_handle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 drawer-backdrop">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-serif text-2xl">Submit Your Look</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Your Name *</label>
                <input
                  {...register('submitter_name')}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"
                  placeholder="Aryan Mehta"
                />
                {errors.submitter_name && <p className="text-xs text-red-500 mt-1">{errors.submitter_name.message}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Instagram Handle</label>
                <input
                  {...register('instagram_handle')}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"
                  placeholder="@yourhandle"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Photo URL *</label>
                <input
                  {...register('photo_url')}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"
                  placeholder="https://..."
                />
                {errors.photo_url && <p className="text-xs text-red-500 mt-1">{errors.photo_url.message}</p>}
                <p className="text-xs text-gray-400 mt-1">Upload to Instagram/Imgur and paste the image URL here.</p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0A0A0A] text-white py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? 'Submitting…' : 'Submit Look'}
              </button>
              <p className="text-xs text-gray-400 text-center">Submissions are reviewed before publishing.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
