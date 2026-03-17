'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'Core',
    emoji: '⚙️',
    description: 'Perfect for small businesses getting started',
    price: 97,
    showPrice: true,
    features: [
      { text: '1 AI Agent + 1 Number', included: true },
      { text: '250 Call Minutes/mo', included: true },
      { text: 'Basic CRM Integration', included: true },
      { text: 'Email Support', included: true },
      { text: 'Multi-agent', included: false },
      { text: 'Custom Training', included: false },
    ],
    cta: 'Start Trial',
    ctaLink: '/auth/signup?plan=core',
    popular: false,
  },
  {
    name: 'Scale',
    emoji: '🏢',
    description: 'For growing teams that need more power',
    price: 597,
    showPrice: true,
    features: [
      { text: 'Multi-Agent Support', included: true },
      { text: '3,000 Call Minutes/mo', included: true },
      { text: 'Advanced CRM + API', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Custom Voice Training', included: true },
      { text: 'Dedicated Manager', included: false },
    ],
    cta: 'Start Free',
    ctaLink: '/auth/signup?plan=scale',
    popular: true,
  },
  {
    name: 'Global Enterprise',
    emoji: '🌍',
    description: 'Unlimited scale with enterprise features',
    price: 0,
    showPrice: false,
    features: [
      { text: 'Unlimited Agents', included: true },
      { text: 'Unlimited Minutes', included: true },
      { text: 'White-label + API', included: true },
      { text: 'Automations', included: true },
      { text: 'Dedicated Manager', included: true },
      { text: '99.99% SLA', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    popular: false,
  },
]

const comparisonFeatures = [
  { name: 'AI Agents', core: 'Up to 2', scale: 'Up to 10', enterprise: 'Unlimited' },
  { name: 'Call Minutes', core: '250/mo', scale: '3,000/mo', enterprise: 'Unlimited' },
  { name: 'CRM Integration', core: true, scale: true, enterprise: true },
  { name: 'Custom Campaigns', core: true, scale: true, enterprise: true },
  { name: 'Multi-language', core: false, scale: true, enterprise: true },
  { name: 'Multilingual', core: false, scale: false, enterprise: true },
]

export default function Pricing() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeSlider, setActiveSlider] = useState({
    minutes: 1000,
    agents: 2,
    conversations: 500,
  })
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

  const calculatePrice = () => {
    const minutesCost = activeSlider.minutes * 0.05
    const agentsCost = activeSlider.agents * 25
    const convCost = activeSlider.conversations * 0.1
    return Math.round(minutesCost + agentsCost + convCost)
  }

  return (
    <section ref={sectionRef} id="pricing" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark-50 to-dark overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-olive/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-lime-200/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-lime-200/10 border border-lime-200/20 text-lime-200 text-sm font-medium mb-4">
            Simple Pricing
          </span>
          <h2 className="section-title text-white mb-4">
            Choose your plan
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative transition-all duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#e8fb76] to-[#d4e86a] rounded-full text-[#1a1a1a] text-sm font-semibold shadow-[0_0_20px_rgba(232,251,118,0.3)]">
                      ⭐ Most Popular
                    </div>
                  </div>
                )}

                <div className={`bg-[#141414] rounded-3xl border h-full p-6 lg:p-8 transition-all duration-500 ${
                  plan.popular 
                    ? 'border-[#e8fb76]/30 shadow-[0_0_30px_rgba(232,251,118,0.1)]' 
                    : 'border-white/5 hover:border-white/20'
                }`}>
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${plan.popular ? 'bg-gradient-to-br from-[#e8fb76] to-[#6c743f]' : 'bg-white/10'} flex items-center justify-center text-2xl`}>
                      {plan.emoji}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-semibold text-white">{plan.name}</h3>
                    </div>
                  </div>

                  <p className="text-white/50 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.showPrice ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl lg:text-5xl font-display font-bold text-white">${plan.price}</span>
                        <span className="text-white/50">/mo</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl lg:text-4xl font-display font-bold text-[#e8fb76]">Let's Talk</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {feature.included ? (
                          <div className="w-5 h-5 rounded-full bg-[#e8fb76]/20 flex items-center justify-center text-xs">
                            ✓
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/30">
                            ✕
                          </div>
                        )}
                        <span className={feature.included ? 'text-white/80' : 'text-white/40'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link 
                    href={plan.ctaLink || '/auth/signup'}
                    className={`block w-full py-4 rounded-full font-semibold text-center transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#e8fb76] to-[#d4e86a] text-[#1a1a1a] hover:shadow-[0_0_30px_rgba(232,251,118,0.3)]'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
          ))}
        </div>

        {/* Comparison Table + Calculator */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Comparison Table */}
          <div className={`bg-[#141414] rounded-3xl border border-white/5 p-6 lg:p-8 transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-xl font-display font-semibold text-white mb-6">Compare Plans</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-white/50 font-medium text-sm"></th>
                    <th className="text-center py-3 text-[#e8fb76] font-medium text-sm">Core</th>
                    <th className="text-center py-3 text-[#e8fb76] font-medium text-sm">Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.slice(0, 6).map((feature, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 text-white/70 text-sm">{feature.name}</td>
                      <td className="py-3 text-center">
                        {typeof feature.core === 'boolean' ? (
                          feature.core ? (
                            <span className="text-[#e8fb76]">✓</span>
                          ) : (
                            <span className="text-white/30">✕</span>
                          )
                        ) : (
                          <span className="text-white/70 text-sm">{feature.core}</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {typeof feature.scale === 'boolean' ? (
                          feature.scale ? (
                            <span className="text-[#e8fb76]">✓</span>
                          ) : (
                            <span className="text-white/30">✕</span>
                          )
                        ) : (
                          <span className="text-white/70 text-sm">{feature.scale}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Calculator */}
          <div className={`bg-[#141414] rounded-3xl border border-white/5 p-6 lg:p-8 transition-all duration-700 ease-out delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-xl font-display font-semibold text-white mb-6">Custom Price Calculator</h3>
            
            <div className="space-y-6">
              {/* Call Minutes */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/70 text-sm">Call Minutes</span>
                  <span className="text-[#e8fb76] font-medium">{activeSlider.minutes.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={activeSlider.minutes}
                  onChange={(e) => setActiveSlider({ ...activeSlider, minutes: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e8fb76] [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              {/* AI Agents */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/70 text-sm">AI Agents</span>
                  <span className="text-[#e8fb76] font-medium">{activeSlider.agents}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={activeSlider.agents}
                  onChange={(e) => setActiveSlider({ ...activeSlider, agents: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e8fb76] [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              {/* Conversations */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/70 text-sm">Conversations/mo</span>
                  <span className="text-[#e8fb76] font-medium">{activeSlider.conversations.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={activeSlider.conversations}
                  onChange={(e) => setActiveSlider({ ...activeSlider, conversations: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e8fb76] [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              {/* Estimated Price */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/70">Estimated Price</span>
                  <div className="text-right">
                    <span className="text-2xl font-display font-bold text-[#e8fb76]">${calculatePrice()}</span>
                    <span className="text-white/50 text-sm">/month</span>
                  </div>
                </div>
                <Link href="/contact" className="block w-full py-4 bg-gradient-to-r from-[#e8fb76] to-[#d4e86a] text-[#1a1a1a] font-semibold rounded-full text-center hover:shadow-[0_0_30px_rgba(232,251,118,0.3)] transition-all">
                  Get Custom Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
