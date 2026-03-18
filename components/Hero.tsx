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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-[70vh] dark-bg overflow-hidden pt-32 pb-16">
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 
            ref={headlineRef}
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-6"
          >
            Elevate Your
            <br />
            <span className="text-white/70">Business Calls</span>
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full text-base font-medium hover:bg-white/90 transition-all"
            >
              Sign Up & Start
            </Link>
          </div>
        </div>

        {/* Golden Blob - positioned behind/below */}
        <div ref={blobRef} className="relative mt-8 flex justify-center">
          <div className="relative w-[300px] h-[200px] sm:w-[400px] sm:h-[280px]">
            <Image
              src="/images/hero-blob.jpg"
              alt="AI Voice Technology"
              fill
              className="object-contain opacity-80"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
