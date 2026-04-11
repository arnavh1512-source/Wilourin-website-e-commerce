'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToastStore } from '@/lib/store'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
        },
      })
      if (error) { addToast(error.message, 'error'); return }
      addToast('Account created! Welcome to Wilourin.', 'success')
      // Hard redirect so middleware picks up the new session cookie cleanly
      window.location.href = '/account'
    } catch (err: any) {
      addToast(err?.message ?? 'An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/account` },
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm">Join Wilourin and earn rewards on every order</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Full Name</label>
            <input {...register('fullName')} type="text"
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors"
              placeholder="Your full name" />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Email</label>
            <input {...register('email')} type="email"
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors"
              placeholder="your@email.com" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Password</label>
            <div className="relative">
              <input {...register('password')} type={showPw ? 'text' : 'password'}
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors pr-10"
                placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Confirm Password</label>
            <div className="relative">
              <input {...register('confirmPassword')} type={showCPw ? 'text' : 'password'}
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors pr-10"
                placeholder="Repeat your password" />
              <button type="button" onClick={() => setShowCPw(!showCPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <p className="text-xs text-gray-400">
            By signing up you agree to our{' '}
            <Link href="/about#returns" className="underline">Terms</Link> and{' '}
            <Link href="/about#contact" className="underline">Privacy Policy</Link>.
          </p>

          <button type="submit" disabled={loading}
            className="w-full bg-[#0A0A0A] text-white py-3.5 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <button onClick={handleGoogle}
          className="w-full border border-gray-200 py-3 text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0A0A0A] underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
