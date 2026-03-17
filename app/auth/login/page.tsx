'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import gsap from 'gsap'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  const { signIn, signInWithGoogle, isLoading } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const formRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Form animation
      gsap.fromTo(
        formRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
      )

      // Hero animation
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      )

      // Floating animation for phone
      gsap.to('.float-element', {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      })
    })

    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await signIn(email, password)
    
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success('Welcome back!')
      router.push(redirect)
    }
  }

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle()
    if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Left side - Form */}
      <div ref={formRef} className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-12">
            <Image
              src="/logo.svg"
              alt="OPCalls"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="font-display font-bold text-xl">
              <span className="text-white">OP</span>
              <span className="text-lime-200">CALLS</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-white/60">
              Sign in to your account to continue
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark text-white/40">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-lime-200 focus:ring-lime-200/50"
                />
                <span className="text-sm text-white/60">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-lime-200 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Sign up link */}
          <p className="mt-8 text-center text-white/60">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-lime-200 hover:underline font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Hero */}
      <div ref={heroRef} className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-olive/20 to-dark" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-lime-200/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-olive/20 rounded-full blur-[80px]" />

        <div className="relative text-center max-w-lg">
          {/* Floating badge */}
          <div className="float-element inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-8">
            <Sparkles className="w-4 h-4 text-lime-200" />
            <span className="text-sm text-lime-200 font-medium">AI Voice Agents</span>
          </div>

          <h2 className="text-4xl font-display font-bold text-white mb-4">
            Never Miss Another
            <span className="block text-lime-200">Business Call</span>
          </h2>

          <p className="text-lg text-white/60 mb-8">
            Your AI agents handle calls 24/7, book appointments, and convert leads while you focus on growing your business.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-display font-bold text-lime-200">500K+</div>
              <div className="text-sm text-white/50">Calls Handled</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-display font-bold text-lime-200">98%</div>
              <div className="text-sm text-white/50">Satisfaction</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-display font-bold text-lime-200">24/7</div>
              <div className="text-sm text-white/50">Availability</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback for Suspense
function LoginFormFallback() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-lime-200/20 rounded-xl" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>
    </div>
  )
}

// Main export wrapped in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}
