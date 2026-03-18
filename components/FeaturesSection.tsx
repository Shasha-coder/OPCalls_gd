'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    icon: 'bolt',
    title: 'AI-Powered Conversations',
    description: 'Natural language processing that understands context and responds intelligently to any caller.',
  },
  {
    icon: 'calendar',
    title: 'Smart Scheduling',
    description: 'Automatic calendar integration that books appointments without human intervention.',
  },
  {
    icon: 'shield',
    title: 'Enterprise Security',
    description: 'SOC 2 Type II certified with end-to-end encryption for all communications.',
  },
  {
    icon: 'chart',
    title: 'Real-Time Analytics',
    description: 'Comprehensive dashboards with call insights, conversion rates, and performance metrics.',
  },
  {
    icon: 'globe',
    title: 'Multi-Language Support',
    description: 'Support for 50+ languages with native-sounding voices and cultural awareness.',
  },
  {
    icon: 'zap',
    title: 'Instant Deployment',
    description: 'Go live in minutes with pre-built templates and easy customization options.',
  },
]

const ICONS: Record<string, JSX.Element> = {
  bolt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
}

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.feature-box',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="features" className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-[#3366FF]/10 text-[#3366FF] text-xs font-semibold rounded-full mb-4">
            FEATURES
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E3A5F] mb-4">
            Everything you need to scale
          </h2>
          <p className="text-[#5A6B7D] text-lg max-w-2xl mx-auto">
            Powerful features designed to help you handle more calls, convert more leads, and grow your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="feature-box group p-6 rounded-2xl bg-[#F5F3EF] hover:bg-white border border-transparent hover:border-[#E8E5DF] hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#3366FF] flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                {ICONS[feature.icon]}
              </div>
              <h3 className="font-display font-semibold text-lg text-[#1E3A5F] mb-2">
                {feature.title}
              </h3>
              <p className="text-[#5A6B7D] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
