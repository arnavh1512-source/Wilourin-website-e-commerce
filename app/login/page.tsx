'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client' // used for Google OAuth and forgot password

export default function LoginPage() {
  const sp = useSearchParams()
  const redirect = sp.get('redirect') ?? '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error ?? 'Sign in failed')
        setLoading(false)
        return
      }

      window.location.href = redirect
    } catch {
      setErrorMsg('Failed to connect. Please try again.')
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-brand-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-w-dark text-4xl mb-2">Welcome Back</h1>
          <p className="font-sans text-w-graphite text-sm">Sign in to your Wilourin account</p>
        </div>

        {forgotSent && (
          <div className="bg-w-surface border border-w-ghost text-w-dark font-sans text-sm px-4 py-3 mb-5">
            Password reset link sent! Check your inbox.
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 border border-red-300 bg-red-50 text-red-700 font-sans text-sm px-4 py-3 mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {forgotMode ? (
          <div className="space-y-4">
            <p className="font-sans text-sm text-w-graphite">Enter your email and we&apos;ll send a reset link.</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full bg-w-surface border border-w-ghost px-4 py-3 font-sans text-sm text-w-dark outline-none focus:border-w-dark focus:ring-1 focus:ring-w-dark rounded-none"
              placeholder="your@email.com"
            />
            <button onClick={handleForgot} className="w-full bg-w-forest text-white font-sans py-3 text-xs uppercase tracking-widest hover:bg-w-emerald transition-colors rounded-none">
              Send Reset Link
            </button>
            <button onClick={() => setForgotMode(false)} className="w-full font-sans text-sm text-w-graphite underline">
              ← Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="font-sans text-xs uppercase tracking-widest text-w-graphite block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-w-surface border border-w-ghost px-4 py-3 font-sans text-sm text-w-dark outline-none focus:border-w-dark focus:ring-1 focus:ring-w-dark transition-colors rounded-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="font-sans text-xs uppercase tracking-widest text-w-graphite block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-w-surface border border-w-ghost px-4 py-3 font-sans text-sm text-w-dark outline-none focus:border-w-dark focus:ring-1 focus:ring-w-dark transition-colors pr-10 rounded-none"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-w-graphite">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="button" onClick={() => setForgotMode(true)} className="font-sans text-xs text-w-graphite underline float-right -mt-2">
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-w-forest text-white font-sans py-3.5 text-xs uppercase tracking-widest hover:bg-w-emerald transition-colors disabled:opacity-50 clear-both rounded-none"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {!forgotMode && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-w-ghost" />
              <span className="font-sans text-xs text-w-graphite">or</span>
              <div className="flex-1 border-t border-w-ghost" />
            </div>
            <button
              onClick={handleGoogle}
              className="w-full border border-w-ghost bg-w-surface py-3 font-sans text-sm flex items-center justify-center gap-3 hover:border-w-dark transition-colors rounded-none"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <p className="text-center font-sans text-sm text-w-graphite mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-w-forest underline font-medium">Sign up</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
