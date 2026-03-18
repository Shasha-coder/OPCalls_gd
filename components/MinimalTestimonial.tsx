'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function MinimalTestimonial() {
  const sectionRef = useRef<HTMLElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)
  const authorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      
      tl.fromTo(quoteRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
        .fromTo(authorRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Large Quote */}
        <div ref={quoteRef} className="mb-8">
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-silver-800 leading-tight tracking-tight">
            OPCalls streamlines communication and boosts efficiency—essential for scaling businesses!
          </p>
        </div>

        {/* Author Attribution */}
        <div ref={authorRef} className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full icon-badge flex items-center justify-center">
            <span className="text-white font-semibold">MT</span>
          </div>
          <div>
            <p className="font-semibold text-silver-800">Michael T.</p>
            <p className="text-silver-600">CEO of NexsCorp</p>
          </div>
        </div>
      </div>
    </section>
  )
}
