'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, X } from 'lucide-react'
import gsap from 'gsap'
import AgentPresetsCarousel from './AgentPresetsCarousel'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const announcementRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtextRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const presetsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(announcementRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo(badgeRef.current, { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, '-=0.3')
        .fromTo(headlineRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.4')
        .fromTo(subtextRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.5')
        .fromTo(ctaRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(presetsRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.5')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-32 pb-20">
      {/* Announcement Bar */}
      <div ref={announcementRef} className="flex items-center justify-center gap-3 py-2 px-4 bg-blue-50 border-b border-gray-200 mb-12">
        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">New</span>
        <p className="text-sm text-gray-700">{"$20M Series A led by Atlas Peak Ventures"}</p>
        <button className="text-gray-400 hover:text-gray-600 transition-colors ml-auto" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div ref={badgeRef} className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">New</span>
            <span className="text-sm font-medium text-gray-900">Get all leads in one place</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Headline */}
        <h1 ref={headlineRef} className="font-serif text-5xl sm:text-6xl lg:text-7xl text-center text-gray-900 max-w-4xl mx-auto leading-tight tracking-tight mb-6">
          The next-gen Agent designed for efficiency.
        </h1>

        {/* Subtext */}
        <p ref={subtextRef} className="text-center text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed mb-12">
          The OPCalls Customer Service Suite combines the #1 AI Agent for customer support with a next-gen Helpdesk built on a single platform.
        </p>

        {/* CTA Button */}
        <div ref={ctaRef} className="flex justify-center mb-20">
          <Link href="/auth/signup" className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md hover:shadow-lg transition-all border border-gray-200 group">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <Play className="w-5 h-5 text-gray-900 fill-current" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Get started</p>
              <p className="text-xs text-gray-500">Build your first agent</p>
            </div>
          </Link>
        </div>

        {/* Agent Presets Section */}
        <div ref={presetsRef} className="space-y-6">
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Popular presets</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Start with a template</h2>
          </div>
          <AgentPresetsCarousel />
        </div>
      </div>
    </section>
  )
}
