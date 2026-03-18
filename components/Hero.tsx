'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { PhoneScreen } from './PhoneScreen'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const leftCardsRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } })

      // Stagger left feature cards
      tl.fromTo(
        leftCardsRef.current?.querySelectorAll('.feature-card'),
        { x: -80, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.15 }
      )

      // Center phone and text
      tl.fromTo(
        centerRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1 },
        '-=0.6'
      )

      // Right side content
      tl.fromTo(
        rightRef.current?.querySelectorAll('.animate-right'),
        { x: 80, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.12 },
        '-=0.5'
      )

      // Floating animations
      gsap.to('.float-slow', {
        y: -12,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.float-medium', {
        y: -8,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-[#F5F3EF]">
      {/* Large background watermark text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[20vw] font-display font-bold text-[#E8E4DD]/60 whitespace-nowrap tracking-tight">
          OPCalls
        </span>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-12">
        <div className="grid lg:grid-cols-[300px_1fr_300px] gap-8 lg:gap-6 items-center min-h-[85vh]">
          
          {/* LEFT COLUMN - Feature Cards */}
          <div ref={leftCardsRef} className="hidden lg:flex flex-col gap-4 pt-8">
            {FEATURES.map((feature, i) => (
              <div key={i} className="feature-card flex items-start gap-4 p-5 max-w-[300px]">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 ${feature.bgColor}`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-[#1E3A5F] leading-snug mb-1">{feature.title}</h3>
                  <p className="text-[13px] text-[#5A6B7D] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CENTER COLUMN - Phone with Hand */}
          <div ref={centerRef} className="flex flex-col items-center">
            {/* Phone + Hand Container */}
            <div className="relative w-full max-w-[420px] mx-auto">
              {/* Hand holding phone image */}
              <div className="relative">
                <Image
                  src="/images/hand-phone.jpg"
                  alt="OPCalls on mobile"
                  width={420}
                  height={700}
                  className="w-full h-auto object-contain"
                  priority
                />
                {/* Phone Screen Overlay - positioned over the phone screen area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[52%] h-[58%] mt-[-2%]">
                    <PhoneScreen />
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Logos */}
            <div className="mt-8 text-center">
              <p className="text-xs text-[#5A6B7D] mb-4 uppercase tracking-wider font-medium">Backed by 200+ Growing Businesses</p>
              <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
                {['Stripe', 'pipedrive', 'IBM', 'Uber', 'Meta'].map((name) => (
                  <span key={name} className="font-display font-bold text-sm text-[#1E3A5F] hover:opacity-100 transition-opacity cursor-default">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Testimonial + Stats */}
          <div ref={rightRef} className="hidden lg:flex flex-col gap-5 pt-8">
            {/* Testimonial */}
            <div className="animate-right max-w-[280px]">
              <div className="text-5xl font-serif text-[#3366FF] opacity-25 leading-none">"</div>
              <p className="text-[15px] text-[#1E3A5F] font-medium leading-relaxed -mt-4 mb-3">
                OPCalls streamlines communication and boosts efficiency—essential for scaling businesses!
              </p>
              <p className="text-sm text-[#5A6B7D]">
                <span className="font-semibold text-[#1E3A5F]">Michael T.</span> — CEO of NexsCorp
              </p>
            </div>

            {/* Stats Preview Cards */}
            <div className="animate-right float-medium">
              <div className="glass rounded-2xl p-5 shadow-lg max-w-[260px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#1E3A5F]">Call Statistics</span>
                  <span className="text-[10px] text-[#3366FF] font-semibold">Reports</span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-2xl font-bold text-[#1E3A5F]">124</div>
                    <div className="text-[10px] text-[#5A6B7D]">Calls</div>
                  </div>
                  <div className="flex-1 flex items-end gap-1 h-12">
                    {[35, 50, 40, 65, 45, 75, 55].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#3366FF] rounded-sm" style={{ height: `${h}%`, opacity: 0.6 + i * 0.05 }} />
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#10B981]">55.7%</div>
                    <div className="text-[10px] text-[#5A6B7D]">Success</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-right float-slow ml-8">
              <div className="glass rounded-2xl p-4 shadow-lg max-w-[220px]">
                <div className="text-xs font-bold text-[#1E3A5F] mb-3">Routes</div>
                <div className="space-y-2">
                  {[
                    { label: 'Converted', value: '45.1%', color: '#10B981' },
                    { label: 'Inbound', value: '32.3%', color: '#3366FF' },
                    { label: 'Missed', value: '12.1%', color: '#EF4444' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#5A6B7D]">{item.label}</span>
                      </div>
                      <span className="font-semibold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Features */}
      <div className="lg:hidden px-4 pb-12">
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.slice(0, 4).map((feature, i) => (
            <div key={i} className="feature-card flex items-start gap-3 p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${feature.bgColor}`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#1E3A5F] leading-tight mb-1">{feature.title}</h3>
                <p className="text-xs text-[#5A6B7D] leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: <PhoneIcon />,
    title: 'Erase Personal Numbers For Business',
    desc: 'Instant Local, Toll-Free, Or International Numbers—No IT Needed.',
    bgColor: 'bg-[#3366FF]',
  },
  {
    icon: <MessageIcon />,
    title: 'Effortless Communication in All Channels',
    desc: 'Effortlessly Handle Calls and Messages, Keeping Teams Connected.',
    bgColor: 'bg-[#3366FF]',
  },
  {
    icon: <AudioIcon />,
    title: 'Unmatched Clarity in Every Conversation',
    desc: 'Crystal-Clear Audio for Professional Conversations - Always.',
    bgColor: 'bg-[#3366FF]',
  },
  {
    icon: <TapIcon />,
    title: 'Manage Everything With A Single Tap',
    desc: 'Manage Calls, Teams, and Business Lines With Key Features.',
    bgColor: 'bg-[#3366FF]',
  },
]

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AudioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="2"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function TapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
