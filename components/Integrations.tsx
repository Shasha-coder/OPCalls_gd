'use client'

import { useEffect, useRef, useState } from 'react'

// Integration icons with emojis - matching your design reference
const integrations = [
  { name: 'Salesforce', emoji: '☁️', color: '#00A1E0' },
  { name: 'HubSpot', emoji: '🧡', color: '#FF7A59' },
  { name: 'Google', emoji: '🔍', color: '#4285F4' },
  { name: 'Zendesk', emoji: '💬', color: '#03363D' },
  { name: 'Slack', emoji: '💜', color: '#4A154B' },
  { name: 'Zapier', emoji: '⚡', color: '#FF4A00' },
  { name: 'AWS', emoji: '☁️', color: '#FF9900' },
  { name: 'Twilio', emoji: '📞', color: '#F22F46' },
  { name: 'Calendly', emoji: '📅', color: '#006BFF' },
  { name: 'Stripe', emoji: '💳', color: '#635BFF' },
  { name: 'Shopify', emoji: '🛒', color: '#96BF48' },
  { name: 'Notion', emoji: '📝', color: '#000000' },
]

export default function Integrations() {
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
    <section ref={sectionRef} id="integrations" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-[#0a0a0a] to-dark overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#6c743f]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#e8fb76]/10 border border-[#e8fb76]/20 text-[#e8fb76] text-sm font-medium mb-4">
            Integration Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Connect Everything
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Seamlessly integrate with your existing tools. Our AI agents work with your CRM, calendar, and communication platforms.
          </p>
        </div>

        {/* Integration Grid */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-700 ease-out delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className="group relative bg-[#141414] rounded-2xl p-6 border border-white/5 hover:border-[#e8fb76]/20 transition-all duration-300 hover:bg-[#1a1a1a]"
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              {/* Emoji Icon */}
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {integration.emoji}
              </div>
              
              {/* Name */}
              <div className="text-white/80 font-medium text-sm group-hover:text-white transition-colors">
                {integration.name}
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl bg-[#e8fb76]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className={`mt-12 text-center transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-white/40 text-sm">
            + 50 more integrations coming soon
          </p>
        </div>
      </div>
    </section>
  )
}
