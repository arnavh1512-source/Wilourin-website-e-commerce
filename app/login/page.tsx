'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const sp = useSearchParams()
  const redirect = sp.get('redirect') ?? '/account'
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        setErrorMsg(error.message)
        return
      }
      // Hard redirect so the browser picks up the new session cookie cleanly
      window.location.href = redirect
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    })
  }

  const handleForgot = async () => {
    if (!forgotEmail) { setErrorMsg('Enter your email first.'); return }
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/account`,
    })
    if (error) setErrorMsg(error.message)
    else setForgotSent(true)
    setForgotMode(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your Wilourin account</p>
        </div>

        {forgotSent && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded mb-5">
            Password reset link sent! Check your inbox.
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {forgotMode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter your email and we&apos;ll send a reset link.</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
              placeholder="your@email.com"
            />
            <button onClick={handleForgot} className="w-full bg-[#0A0A0A] text-white py-3 text-xs uppercase tracking-widest">
              Send Reset Link
            </button>
            <button onClick={() => setForgotMode(false)} className="w-full text-sm text-gray-500 underline">
              ← Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-gray-400 underline float-right -mt-2">
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0A0A] text-white py-3.5 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 clear-both"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {!forgotMode && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <button
              onClick={handleGoogle}
              className="w-full border border-gray-200 py-3 text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#0A0A0A] underline font-medium">Sign up</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
