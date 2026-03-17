'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play, X } from 'lucide-react'
import gsap from 'gsap'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const announcementRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtextRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create a timeline for entrance animations
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Announcement bar
      tl.fromTo(
        announcementRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      )

      // Badge pill
      tl.fromTo(
        badgeRef.current,
        { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        '-=0.3'
      )

      // Headline with split text effect
      tl.fromTo(
        headlineRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.4'
      )

      // Subtext
      tl.fromTo(
        subtextRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.5'
      )

      // CTA buttons
      tl.fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      )

      // Dashboard mockup with floating effect
      tl.fromTo(
        mockupRef.current,
        { y: 80, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1 },
        '-=0.6'
      )

      // Continuous floating animation for mockup
      gsap.to(mockupRef.current, {
        y: -10,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden winter-bg">
      {/* Winter landscape background image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:%23E8F4FF"/><stop offset="100%" style="stop-color:%23F8FBFF"/></linearGradient></defs><rect fill="url(%23sky)" width="1440" height="900"/></svg>')`,
          }}
        />
        {/* Subtle cloud shapes */}
        <div className="absolute top-20 right-20 w-64 h-32 bg-white/40 rounded-full blur-3xl" />
        <div className="absolute top-40 right-60 w-48 h-24 bg-white/30 rounded-full blur-2xl" />
        <div className="absolute top-10 left-20 w-80 h-40 bg-white/30 rounded-full blur-3xl" />
        <div className="absolute top-32 left-60 w-40 h-20 bg-white/40 rounded-full blur-2xl" />
      </div>

      {/* Announcement Bar */}
      <div 
        ref={announcementRef}
        className="relative z-10 flex items-center justify-center gap-3 py-3 px-4 bg-[#F0F7FF] border-b border-[#E2E8F0]"
      >
        <span className="bg-[#3366FF] text-white text-xs font-semibold px-3 py-1 rounded-full">
          New
        </span>
        <p className="text-sm text-[#1A2B4B]/80">
          {"We're thrilled to announce our $20M Series A, led by Atlas Peak Ventures, Helios Capital, and NorthPoint Partners."}
        </p>
        <button className="text-[#1A2B4B]/60 hover:text-[#1A2B4B] transition-colors ml-2" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-32 lg:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge Pill */}
          <div ref={badgeRef} className="flex justify-center mb-8">
            <div className="announcement-pill">
              <span className="announcement-badge">New</span>
              <span className="text-[#1A2B4B] text-sm font-medium pr-4">
                Get all your leads in one place.
              </span>
              <span className="text-[#1A2B4B]/60 pr-4">|</span>
              <ArrowRight className="w-4 h-4 text-[#1A2B4B] mr-4" />
            </div>
          </div>

          {/* Headline */}
          <h1 
            ref={headlineRef}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-center text-[#1A2B4B] max-w-4xl mx-auto leading-[1.15] tracking-tight"
          >
            <span className="italic">The next-gen</span> Agent
            <br />
            designed for efficiency.
          </h1>

          {/* Subtext */}
          <p 
            ref={subtextRef}
            className="mt-6 text-center text-[#5C6B8A] text-lg max-w-2xl mx-auto leading-relaxed"
          >
            The OPCalls Customer Service Suite combines the #1 AI Agent for customer 
            support with a next-gen Helpdesk built on a single platform.
          </p>

          {/* CTA */}
          <div ref={ctaRef} className="mt-10 flex justify-center">
            <Link
              href="/auth/signup"
              className="play-button flex items-center gap-4 bg-white rounded-2xl pl-4 pr-6 py-3 shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="w-12 h-12 bg-[#F8FBFF] rounded-xl flex items-center justify-center group-hover:bg-[#EDF4FF] transition-colors">
                <Play className="w-5 h-5 text-[#1A2B4B] fill-current" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#1A2B4B]">Get started</p>
                <p className="text-sm text-[#5C6B8A]">How to build your own agent</p>
              </div>
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div ref={mockupRef} className="mt-16 relative max-w-5xl mx-auto">
            <div className="dashboard-mockup float-shadow">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F8FBFF] border-b border-[#E2E8F0]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#27CA40]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-lg border border-[#E2E8F0] text-sm text-[#5C6B8A]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    app.opcalls.ai
                  </div>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="flex min-h-[400px]">
                {/* Sidebar */}
                <div className="w-56 border-r border-[#E2E8F0] bg-[#FAFBFC] p-4 hidden sm:block">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-[#3366FF] rounded-lg flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="font-semibold text-[#1A2B4B]">OPCalls</span>
                    <span className="text-xs bg-[#3366FF] text-white px-2 py-0.5 rounded ml-auto">Pro</span>
                  </div>
                  
                  <nav className="space-y-1">
                    {['Dashboard', 'Analytics', 'Products', 'Chats', 'Orders'].map((item, i) => (
                      <div 
                        key={item}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          i === 3 ? 'bg-[#3366FF]/10 text-[#3366FF] font-medium' : 'text-[#5C6B8A] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {item}
                        {item === 'Chats' && (
                          <span className="ml-auto bg-[#EF4444] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 p-6 bg-white">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold text-[#1A2B4B]">Chats</h2>
                      <span className="text-[#5C6B8A] text-sm">+</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-[#1A2B4B]">Sofia Costa</p>
                        <p className="text-xs text-[#10B981] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
                          Online
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFC0CB]" />
                    </div>
                  </div>
                  
                  {/* Chat List */}
                  <div className="space-y-2">
                    {[
                      { name: 'Sofia Costa', msg: 'Hi, I would like to see more...', active: true },
                      { name: 'Ana Rosa', msg: 'Sure! Let me check that...', active: false },
                      { name: 'Ilya Petrov', msg: 'Any discount for startups?', active: false },
                      { name: 'Mira Park', msg: "Hi, I'd like to see more options...", active: false },
                    ].map((chat, i) => (
                      <div 
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                          chat.active ? 'bg-[#3366FF]/10' : 'hover:bg-[#F8FBFF]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          ['bg-[#FF6B6B]', 'bg-[#4ECDC4]', 'bg-[#45B7D1]', 'bg-[#96CEB4]'][i]
                        }`}>
                          {chat.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1A2B4B] text-sm">{chat.name}</p>
                          <p className="text-xs text-[#5C6B8A] truncate">{chat.msg}</p>
                        </div>
                        {i === 0 && (
                          <span className="w-2 h-2 bg-[#3366FF] rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Right Panel */}
                <div className="w-72 border-l border-[#E2E8F0] p-6 bg-[#FAFBFC] hidden lg:block">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFC0CB] mx-auto mb-3" />
                    <p className="font-semibold text-[#1A2B4B]">Sofia Costa</p>
                    <p className="text-sm text-[#5C6B8A]">sofia@company.com</p>
                    <p className="text-xs text-[#5C6B8A] mt-1">Antalya, Turkey - 10:27 pm local time</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-[#5C6B8A] uppercase mb-2">Additional Info</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#5C6B8A]">IP Address</span>
                          <span className="text-[#1A2B4B]">192.222.333.444</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#5C6B8A]">Device</span>
                          <span className="text-[#1A2B4B]">Mac OS 10.15.71</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
