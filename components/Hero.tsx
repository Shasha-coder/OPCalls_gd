'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtextRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const testimonialRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(headlineRef.current, 
        { y: 60, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1 }
      )
      .fromTo(subtextRef.current, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8 }, 
        '-=0.6'
      )
      .fromTo(ctaRef.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7 }, 
        '-=0.5'
      )
      .fromTo(blobRef.current, 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, 
        '-=0.8'
      )
      .fromTo(card1Ref.current, 
        { x: -50, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.8 }, 
        '-=0.6'
      )
      .fromTo(card2Ref.current, 
        { x: 50, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.8 }, 
        '-=0.6'
      )
      .fromTo(testimonialRef.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7 }, 
        '-=0.4'
      )

      // Floating animations
      gsap.to(card1Ref.current, {
        y: -12,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      
      gsap.to(card2Ref.current, {
        y: -8,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-screen dark-bg overflow-hidden">
      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
      }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-20">
        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 
            ref={headlineRef}
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white leading-[1.05] tracking-tight mb-6"
          >
            Elevate Your
            <br />
            <span className="text-white/80">Business Calls</span>
          </h1>
          
          <p 
            ref={subtextRef}
            className="text-white/40 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed mb-10"
          >
            Unlock your business potential with AI-powered voice agents, handling calls 24/7 professionally.
          </p>

          <div ref={ctaRef}>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 btn-light rounded-full text-base font-medium"
            >
              Sign Up & Start
            </Link>
          </div>
        </div>

        {/* Hero Visual - Golden Blob with Floating Cards */}
        <div className="relative mt-8 lg:mt-12 h-[350px] sm:h-[450px] lg:h-[500px]">
          {/* Golden Blob */}
          <div ref={blobRef} className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[480px] lg:h-[480px]">
              <Image
                src="/images/hero-blob.jpg"
                alt="AI Voice Technology"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Left Floating Card - Light glass */}
          <div 
            ref={card1Ref}
            className="absolute left-4 sm:left-12 lg:left-20 top-1/3 -translate-y-1/2"
          >
            <div className="glass-card-light rounded-2xl p-5 w-[170px] sm:w-[190px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Call Success</span>
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-900 font-semibold text-[15px] leading-tight">Unparalleled</p>
              <p className="text-gray-900 font-semibold text-[15px] leading-tight">Market Access</p>
              <p className="text-gray-400 text-sm mt-3">46%</p>
            </div>
          </div>

          {/* Right Floating Card - Dark glass */}
          <div 
            ref={card2Ref}
            className="absolute right-4 sm:right-12 lg:right-20 top-1/2"
          >
            <div className="glass-card rounded-2xl p-5 w-[150px] sm:w-[170px]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Conversion</span>
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </div>
              </div>
              <p className="text-white text-4xl font-semibold tracking-tight">96%</p>
              <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[96%] bg-white rounded-full" />
              </div>
            </div>
          </div>

          {/* Navigation Arrow */}
          <button className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors hidden lg:flex">
            <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Testimonial Quote - Right side */}
        <div ref={testimonialRef} className="absolute top-36 right-8 lg:right-16 xl:right-24 max-w-[280px] hidden lg:block">
          <div className="relative">
            <span className="text-7xl text-white/5 font-serif absolute -top-6 -left-4">"</span>
            <p className="text-white/60 text-[15px] leading-relaxed pl-6">
              OPCalls streamlines communication and boosts efficiency—essential for scaling businesses!
            </p>
            <p className="text-white/30 text-sm mt-4 pl-6">
              <span className="text-white/50">Michael T.</span> — CEO of NexsCorp
            </p>
            <span className="text-7xl text-white/5 font-serif absolute -bottom-10 right-0">"</span>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0D0D0F] to-transparent pointer-events-none" />
    </section>
  )
}
