'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

const features = [
  '14-day free trial included',
  'No credit card required',
  'Unlimited AI voice agents',
  '24/7 automated call handling',
]

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle, isLoading } = useAuthStore()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(formRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      gsap.fromTo(heroRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: 'power3.out' })
      gsap.fromTo('.feature-item', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, delay: 0.4, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const result = await signUp(email, password, fullName)
    
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      setSuccess(true)
      toast.success('Account created! Check your email to verify.')
    }
  }

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle()
    if (result.error) {
      toast.error(result.error)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#10B981]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-[#1E3A5F] mb-3">Check your email</h1>
          <p className="text-[#5A6B7D] mb-6">
            We sent a verification link to <span className="font-semibold text-[#3366FF]">{email}</span>. Click the link to activate your account.
          </p>
          <Link href="/auth/login" className="inline-block px-6 py-3 bg-[#3366FF] text-white font-semibold rounded-xl hover:bg-[#2952CC] transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex">
      {/* Left - Hero */}
      <div ref={heroRef} className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden bg-[#1E3A5F]">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#3366FF]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#10B981]/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
            </svg>
            Start Free Today
          </span>

          <h2 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
            Build your AI agent in
            <span className="block text-[#3366FF]">under 10 minutes</span>
          </h2>

          <p className="text-lg text-white/60 mb-10 leading-relaxed">
            Join thousands of businesses using OPCalls to handle calls, book appointments, and never miss an opportunity.
          </p>

          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="feature-item flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3366FF]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-[#3366FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-white/80">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right - Form */}
      <div ref={formRef} className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-[#3366FF] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-[#1E3A5F]">OPCalls</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-[#1E3A5F] mb-2">Create your account</h1>
            <p className="text-[#5A6B7D]">Start your 14-day free trial today</p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white border border-[#E8E5DF] rounded-xl text-[#1E3A5F] font-medium hover:border-[#1E3A5F]/20 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E5DF]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#F5F3EF] text-[#5A6B7D]">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-[#E8E5DF] rounded-xl text-[#1E3A5F] placeholder:text-[#5A6B7D]/50 focus:outline-none focus:ring-2 focus:ring-[#3366FF]/20 focus:border-[#3366FF] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-[#E8E5DF] rounded-xl text-[#1E3A5F] placeholder:text-[#5A6B7D]/50 focus:outline-none focus:ring-2 focus:ring-[#3366FF]/20 focus:border-[#3366FF] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white border border-[#E8E5DF] rounded-xl text-[#1E3A5F] placeholder:text-[#5A6B7D]/50 focus:outline-none focus:ring-2 focus:ring-[#3366FF]/20 focus:border-[#3366FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6B7D] hover:text-[#1E3A5F] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm">
                {error}
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="w-4 h-4 mt-0.5 rounded border-[#E8E5DF] bg-white text-[#3366FF] focus:ring-[#3366FF]/50"
              />
              <span className="text-sm text-[#5A6B7D]">
                I agree to the{' '}
                <Link href="/terms" className="text-[#3366FF] hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#3366FF] hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !agreed}
              className="w-full py-3.5 bg-[#3366FF] text-white font-semibold rounded-xl hover:bg-[#2952CC] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <>
                  Create Account
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[#5A6B7D]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#3366FF] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
