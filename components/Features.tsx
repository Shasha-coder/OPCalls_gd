'use client'

import { useEffect, useRef, useState } from 'react'

// Features with emojis - clean, meaningful icons
const features = [
  {
    emoji: '📞',
    title: '24/7 Call Handling',
    description: 'Never miss a call again. Your AI agent answers every call instantly, day or night, holidays included.',
  },
  {
    emoji: '📅',
    title: 'Smart Scheduling',
    description: 'Automatically book appointments directly into your calendar. Syncs with Google Calendar, Calendly, and more.',
  },
  {
    emoji: '🌍',
    title: 'Multilingual Support',
    description: 'Speak your customers\' language. Support for English, Spanish, French, and 20+ languages.',
  },
  {
    emoji: '🔗',
    title: 'CRM Integration',
    description: 'Seamlessly connect with Salesforce, HubSpot, Zoho, and your existing tools. Zero data silos.',
  },
  {
    emoji: '📊',
    title: 'Real-time Analytics',
    description: 'Track call volume, booking rates, and customer sentiment. Make data-driven decisions.',
  },
  {
    emoji: '🔒',
    title: 'Enterprise Security',
    description: 'SOC 2 compliant. HIPAA ready. Your data is encrypted and protected at all times.',
  },
]

export default function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="features" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-[#0a0a0a] to-dark overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-[#e8fb76]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-0 w-[300px] h-[300px] bg-[#6c743f]/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#e8fb76]/10 border border-[#e8fb76]/20 text-[#e8fb76] text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Built for businesses that can't afford to miss calls. Powerful features, simple setup.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-8 bg-[#141414] rounded-2xl border border-white/5 hover:border-[#e8fb76]/20 transition-all duration-500 ease-out hover:bg-[#1a1a1a] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              {/* Emoji */}
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.emoji}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#e8fb76] transition-colors">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-white/50 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
