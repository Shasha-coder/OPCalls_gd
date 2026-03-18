'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { PhoneMockup } from './PhoneMockup'
import { FeatureCards } from './FeatureCards'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const testimonialRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        headlineRef.current?.querySelectorAll('.animate-in'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 }
      )

      tl.fromTo(
        phoneRef.current,
        { y: 80, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power2.out' },
        '-=0.5'
      )

      tl.fromTo(
        featuresRef.current?.querySelectorAll('.feature-item'),
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.12 },
        '-=0.8'
      )

      tl.fromTo(
        testimonialRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.6'
      )

      gsap.to('.float-slow', {
        y: -15,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.float-medium', {
        y: -10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-[#F5F3EF] pt-20 lg:pt-28 pb-16">
      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[18vw] font-display font-bold text-[#E8E5DF] whitespace-nowrap tracking-tight">
          OPCalls
        </span>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6 lg:gap-8 items-start">
          
          {/* Left - Features */}
          <div ref={featuresRef} className="hidden lg:block pt-16">
            <FeatureCards />
          </div>

          {/* Center - Phone + Headline */}
          <div className="flex flex-col items-center">
            <div ref={headlineRef} className="text-center mb-8 max-w-lg">
              <h1 className="animate-in font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#1E3A5F] leading-[1.1] mb-5">
                One Platform
                <br />
                <span className="text-[#3366FF]">Behind Business</span>
                <br />
                Communication
              </h1>
              <p className="animate-in text-[#5A6B7D] text-base lg:text-lg leading-relaxed mb-6">
                Powering seamless business communication from one unified platform. 
                Stay connected, collaborate smarter, and drive success.
              </p>
              <div className="animate-in flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/signup" className="btn-primary text-center text-sm">
                  Get Started Now
                </Link>
                <button className="btn-secondary text-sm">
                  Try Tutorial Now
                </button>
              </div>
            </div>

            <div ref={phoneRef} className="relative w-full max-w-[320px]">
              <PhoneMockup />
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-[#5A6B7D] mb-3 uppercase tracking-wide">Backed by 200+ Growing Businesses</p>
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {['stripe', 'pipedrive', 'IBM', 'Uber'].map((name) => (
                  <span key={name} className="font-display font-bold text-base text-[#1E3A5F] opacity-40 hover:opacity-70 transition-opacity">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Testimonial + Preview */}
          <div ref={testimonialRef} className="hidden lg:block pt-16">
            <div className="space-y-6">
              <div className="max-w-[260px]">
                <div className="text-6xl font-serif text-[#3366FF] opacity-30 leading-none mb-2">"</div>
                <p className="text-base text-[#1E3A5F] font-medium leading-relaxed -mt-6 mb-3">
                  OPCalls streamlines communication and boosts efficiency—essential for scaling businesses!
                </p>
                <p className="text-sm text-[#5A6B7D]">
                  <span className="font-semibold text-[#1E3A5F]">Michael T.</span> — CEO of NexsCorp
                </p>
              </div>

              <div className="float-medium">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Features */}
      <div className="lg:hidden px-4 mt-12">
        <FeatureCards />
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-4 shadow-lg max-w-[240px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#1E3A5F]">Call Statistics</span>
          <span className="text-[10px] text-[#3366FF] font-medium">Reports</span>
        </div>
        <div className="flex gap-3 items-end">
          <div>
            <div className="text-xl font-bold text-[#1E3A5F]">124</div>
            <div className="text-[10px] text-[#5A6B7D]">Total</div>
          </div>
          <div className="flex-1 flex items-end gap-0.5 h-10">
            {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
              <div key={i} className="flex-1 bg-[#3366FF] rounded-t" style={{ height: `${h}%`, opacity: 0.7 + i * 0.04 }} />
            ))}
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[#10B981]">55.7%</div>
            <div className="text-[10px] text-[#5A6B7D]">Success</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4 shadow-lg max-w-[220px] ml-6">
        <div className="text-xs font-semibold text-[#1E3A5F] mb-2">Routes</div>
        <div className="space-y-1.5">
          {[
            { label: 'Converted', value: '45.1%', color: 'text-[#10B981]' },
            { label: 'Inbound', value: '32.3%', color: 'text-[#3366FF]' },
            { label: 'Missed', value: '12.1%', color: 'text-[#EF4444]' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-[11px]">
              <span className="text-[#5A6B7D]">{item.label}</span>
              <span className={`font-semibold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
