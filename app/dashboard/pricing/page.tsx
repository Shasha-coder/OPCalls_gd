'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AGENT_PRODUCTS, formatPrice } from '@/lib/products'
import { CheckIcon, ArrowRightIcon, LockIcon, ExternalLinkIcon } from '@/components/ui/Icons'

export default function PricingPage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#474b37] px-6 py-12">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Agent Plans</h1>
          <p className="text-lg text-white/60">Choose the perfect plan for your AI agent</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {AGENT_PRODUCTS.map((product) => (
            <div
              key={product.id}
              onMouseEnter={() => setHoveredPlan(product.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative group rounded-2xl border transition-all duration-300 ${
                hoveredPlan === product.id
                  ? 'bg-[#262720] border-[#e7f69e] shadow-xl'
                  : 'bg-[#262720] border-[#474b37]'
              }`}
            >
              {/* Background glow effect */}
              {hoveredPlan === product.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#e7f69e]/10 to-transparent rounded-2xl pointer-events-none" />
              )}

              <div className="relative p-8 space-y-8">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
                  <p className="text-white/60 text-sm">{product.description}</p>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{formatPrice(product.priceInCents)}</span>
                    {product.recurring && <span className="text-white/60">/month</span>}
                  </div>
                  <p className="text-xs text-white/50">Billed monthly</p>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-[#e7f69e] flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-4 space-y-3">
                  <a
                    href={product.stripeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all border-2 ${
                      hoveredPlan === product.id
                        ? 'bg-[#e7f69e] border-[#e7f69e] text-[#1a1b18] hover:bg-[#d4e38c]'
                        : 'bg-[#1a1b18] border-[#474b37] text-[#e7f69e] hover:border-[#e7f69e]'
                    }`}
                  >
                    Get Started
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>

                  <div className="bg-[#1a1b18] rounded-xl p-4 flex items-start gap-3">
                    <LockIcon className="w-5 h-5 text-[#e7f69e] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/70">
                      Secure payment via Stripe. No setup fees. Cancel anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-[#262720] border border-[#474b37] rounded-2xl p-12">
          <h3 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-medium mb-2">Can I upgrade or downgrade anytime?</h4>
              <p className="text-white/60 text-sm">Yes, you can change your plan at any time. Changes take effect on your next billing cycle.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">What's included in each plan?</h4>
              <p className="text-white/60 text-sm">Each plan includes a dedicated Twilio phone number, AI-powered call handling, SMS support, and access to our dashboard. Pro includes more minutes, premium voices, and priority support.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Do you offer a free trial?</h4>
              <p className="text-white/60 text-sm">Contact our sales team for information about trial periods and custom enterprise plans.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
