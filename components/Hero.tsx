'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { PhoneScreen } from './PhoneScreen'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Headline entrance
      tl.fromTo(
        headlineRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 }
      )

      // Phone entrance
      tl.fromTo(
        phoneRef.current,
        { y: 80, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2 },
        '-=0.7'
      )

      // Left cards
      tl.fromTo(
        leftRef.current?.querySelectorAll('.feature-card'),
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.15, duration: 0.8 },
        '-=0.8'
      )

      // Right content
      tl.fromTo(
        rightRef.current?.querySelectorAll('.animate-in'),
        { x: 60, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.15, duration: 0.8 },
        '-=0.8'
      )

      // Search bar
      tl.fromTo(
        searchRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.5'
      )

      // Floating animation for phone
      gsap.to(phoneRef.current, {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      // Floating for stat cards
      gsap.to('.float-card', {
        y: -8,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.3,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-screen metal-bg overflow-hidden">
      {/* Large Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
        <span className="text-[25vw] font-display font-bold text-silver-900 whitespace-nowrap tracking-tighter">
          OPCalls
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28">
        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6 lg:gap-8 items-start min-h-[85vh]">
          
          {/* LEFT - Feature Cards */}
          <div ref={leftRef} className="hidden lg:flex flex-col gap-4 pt-20">
            {FEATURES.map((feature, i) => (
              <div key={i} className="feature-card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl icon-badge flex items-center justify-center text-white flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] text-silver-800 leading-snug mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-[13px] text-silver-600 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CENTER - Phone + Headline */}
          <div className="flex flex-col items-center pt-8 lg:pt-0">
            {/* Headline */}
            <h1 
              ref={headlineRef}
              className="text-center mb-8 lg:mb-12"
            >
              <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display text-metallic tracking-tight leading-[0.95]">
                AI - VOICE AGENT
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display text-silver-500 tracking-tight leading-[0.95] mt-2">
                FOR YOUR BUSINESS
              </span>
            </h1>

            {/* Phone with Screen */}
            <div ref={phoneRef} className="relative w-full max-w-[380px] mx-auto">
              {/* Phone Frame */}
              <div className="relative">
                {/* Phone Shell */}
                <div className="relative rounded-[48px] overflow-hidden shadow-2xl" style={{
                  background: 'linear-gradient(145deg, #2A2A2A 0%, #1A1A1A 50%, #0A0A0A 100%)',
                  padding: '12px',
                  boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5), 0 30px 60px -30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}>
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                  
                  {/* Screen Container */}
                  <div className="relative rounded-[40px] overflow-hidden bg-white" style={{ aspectRatio: '9/19' }}>
                    <PhoneScreen />
                  </div>
                </div>

                {/* Floating Stat Card - Left */}
                <div className="float-card absolute -left-16 top-1/4 hidden xl:block">
                  <div className="glass-chrome rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-silver-800">74%</div>
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                    </div>
                    <p className="text-xs text-silver-600 mt-1">Less wasted</p>
                  </div>
                </div>

                {/* Floating Stat Card - Right */}
                <div className="float-card absolute -right-12 bottom-1/3 hidden xl:block" style={{ animationDelay: '0.5s' }}>
                  <div className="glass-chrome rounded-2xl p-3 shadow-xl">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Text */}
              <p className="text-center text-sm text-silver-500 mt-8 font-medium">
                Backed by 200+ Growing Businesses
              </p>
              
              {/* Logo Strip */}
              <div className="flex items-center justify-center gap-6 mt-4 opacity-40">
                {['Uber', 'pipedrive', 'IBM', 'Meta'].map((name) => (
                  <span key={name} className="font-display font-bold text-sm text-silver-700">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT - Testimonial + Stats */}
          <div ref={rightRef} className="hidden lg:flex flex-col gap-6 pt-20">
            {/* Testimonial */}
            <div className="animate-in">
              <div className="text-5xl font-serif text-accent/30 leading-none">"</div>
              <p className="text-[15px] text-silver-700 font-medium leading-relaxed -mt-3 mb-3">
                OPCalls streamlines communication and boosts efficiency—essential for scaling businesses!
              </p>
              <p className="text-sm text-silver-500">
                <span className="font-semibold text-silver-700">Michael T.</span> — CEO of NexsCorp
              </p>
            </div>

            {/* Stats Card */}
            <div className="animate-in float-card">
              <div className="glass-chrome rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-silver-700">Call Statistics</span>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-accent/10 text-accent">Reports</span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-2xl font-bold text-silver-800">124</div>
                    <div className="text-[10px] text-silver-500">Calls</div>
                  </div>
                  <div className="flex-1 flex items-end gap-1 h-12">
                    {[35, 50, 40, 65, 45, 75, 55].map((h, i) => (
                      <div key={i} className="flex-1 bg-accent rounded-sm" style={{ height: `${h}%`, opacity: 0.5 + i * 0.07 }} />
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">55.7%</div>
                    <div className="text-[10px] text-silver-500">Success</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Routes Card */}
            <div className="animate-in float-card ml-6" style={{ animationDelay: '0.3s' }}>
              <div className="glass-chrome rounded-2xl p-4 shadow-lg max-w-[200px]">
                <div className="text-xs font-bold text-silver-700 mb-3">Routes</div>
                <div className="space-y-2">
                  {[
                    { label: 'Converted', value: '45.1%', color: '#10B981' },
                    { label: 'Inbound', value: '32.3%', color: '#3B82F6' },
                    { label: 'Missed', value: '12.1%', color: '#EF4444' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-silver-600">{item.label}</span>
                      </div>
                      <span className="font-semibold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Search Bar + Selector */}
        <div ref={searchRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 pb-12 max-w-4xl mx-auto px-4">
          {/* Search Input */}
          <div className="metal-pill rounded-full flex items-center gap-3 px-6 py-4 flex-1 w-full sm:max-w-md">
            <svg className="w-5 h-5 text-silver-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="SEARCH AGENT PRESETS..."
              className="bg-transparent text-sm font-medium text-silver-700 placeholder-silver-500 outline-none flex-1 tracking-wide"
            />
          </div>

          {/* Selector */}
          <div className="metal-pill rounded-full flex items-center justify-between gap-4 px-6 py-4 w-full sm:w-auto min-w-[240px]">
            <div>
              <div className="text-[10px] text-silver-500 uppercase tracking-wider font-medium">Agent Type:</div>
              <div className="text-sm font-semibold text-silver-800">All Categories</div>
            </div>
            <svg className="w-5 h-5 text-silver-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile Features */}
      <div className="lg:hidden px-4 pb-12">
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.slice(0, 4).map((feature, i) => (
            <div key={i} className="feature-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl icon-badge flex items-center justify-center text-white flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-silver-800 leading-tight mb-1">{feature.title}</h3>
                  <p className="text-xs text-silver-600 leading-relaxed">{feature.desc}</p>
                </div>
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
    title: 'Instant Business Numbers',
    desc: 'Local, Toll-Free, or International—No IT Needed.',
  },
  {
    icon: <MessageIcon />,
    title: 'Omnichannel Communication',
    desc: 'Handle Calls and Messages from One Platform.',
  },
  {
    icon: <AudioIcon />,
    title: 'Crystal-Clear Voice AI',
    desc: 'Professional Audio Quality, Always.',
  },
  {
    icon: <TapIcon />,
    title: 'One-Tap Management',
    desc: 'Control Everything from Your Dashboard.',
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
      <path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a6 6 0 0012 0v-1.5m-6-7.5v-2a1.5 1.5 0 00-3 0v7.5m0 0a1.5 1.5 0 013 0M10 8.5a1.5 1.5 0 013 0v3.5m0 0a1.5 1.5 0 013 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
