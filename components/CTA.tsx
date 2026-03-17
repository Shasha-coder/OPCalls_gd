'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, Clock, Zap } from 'lucide-react'

export default function CTA() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-olive/10 to-dark overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-lime-200/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-olive/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`glass-card p-8 lg:p-12 text-center transition-all duration-700 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-lime-200/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-olive/30 rounded-full blur-2xl" />

          {/* Content */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-6">
              <Clock className="w-4 h-4 text-lime-200" />
              <span className="text-lime-200 text-sm font-medium">Get started in minutes</span>
            </div>

            <h2 className="section-title text-white mb-4">
              Build your first specialized agent<br />
              in under <span className="text-lime-200">10 minutes</span>
            </h2>

            <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
              <span className="text-lime-200 font-semibold">14 Days Free. Full Access.</span> No credit card required. 
              Cancel anytime. Experience the power of AI voice agents today.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn-primary group text-lg px-10 py-5 flex items-center gap-3">
                <Zap className="w-5 h-5" />
                Activate Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trust Elements */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-200" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-200" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-200" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>

          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-lime-200/0 via-lime-200/20 to-lime-200/0 animate-[shine_3s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </section>
  )
}
