'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLANS, formatPrice } from '@/lib/products'
import { CheckIcon, ArrowRightIcon, LockIcon, ExternalLinkIcon } from '@/components/ui/Icons'

export default function PricingPage() {
  const [setupFeeSelected, setSetupFeeSelected] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setSetupFeeSelected(s => ({ ...s, [id]: !s[id] }))

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#474b37] px-6 py-12">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <h1 className="text-4xl font-bold text-white font-display">Simple, Transparent Pricing</h1>
          <p className="text-lg text-white/50">Your dedicated AI phone agent — ready in minutes. Cancel anytime.</p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const wantsSetup = setupFeeSelected[plan.id] ?? false

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
                  plan.badge
                    ? 'bg-[#262720] border-[#e7f69e]'
                    : 'bg-[#262720] border-[#474b37] hover:border-[#5c6147]'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#e7f69e] text-[#1a1b18] text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1 space-y-6">
                  {/* Name + Price */}
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">{plan.name}</h2>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">{formatPrice(plan.monthlyPriceCents)}</span>
                      <span className="text-white/50 text-sm">/mo</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      {plan.numbers} number{plan.numbers > 1 ? 's' : ''} · {plan.minutes.toLocaleString()} min · {plan.sms.toLocaleString()} SMS
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckIcon className="w-4 h-4 text-[#e7f69e] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/70 leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Optional Setup Fee */}
                  <div className="rounded-xl border border-[#3a3d32] bg-[#1a1b18] p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={wantsSetup}
                          onChange={() => toggle(plan.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          wantsSetup ? 'bg-[#e7f69e] border-[#e7f69e]' : 'border-[#474b37] bg-transparent'
                        }`}>
                          {wantsSetup && (
                            <svg className="w-3 h-3 text-[#1a1b18]" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          Add Setup by Our Team
                          <span className="ml-2 text-[#e7f69e]">+{formatPrice(plan.setupFeeCents)}</span>
                          <span className="text-white/40 text-xs ml-1">one-time</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed">{plan.setupFeeDescription}</p>
                      </div>
                    </label>

                    {wantsSetup && (
                      <a
                        href={plan.setupFeeStripeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-[#262720] border border-[#474b37] text-[#e7f69e] text-xs font-medium hover:border-[#e7f69e] transition-colors"
                      >
                        Pay Setup Fee — {formatPrice(plan.setupFeeCents)}
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* CTA */}
                  <a
                    href={plan.monthlyStripeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full font-medium text-sm transition-all border-2 ${
                      plan.badge
                        ? 'bg-[#e7f69e] border-[#e7f69e] text-[#1a1b18] hover:bg-[#d4e38c] hover:border-[#d4e38c]'
                        : 'bg-transparent border-[#474b37] text-[#e7f69e] hover:border-[#e7f69e] hover:bg-[#1a1b18]'
                    }`}
                  >
                    Get Started
                    <ArrowRightIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        {/* Security note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/40 text-sm">
          <LockIcon className="w-4 h-4" />
          <span>Payments secured by Stripe. No card stored by OPCalls. Cancel anytime.</span>
        </div>

        {/* FAQ */}
        <div className="mt-16 bg-[#262720] border border-[#474b37] rounded-2xl p-10 space-y-8">
          <h3 className="text-xl font-semibold text-white">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                q: 'Is the setup fee mandatory?',
                a: 'No. The setup fee is completely optional. You can configure your agent yourself using our dashboard. The setup fee is for customers who prefer our team to configure and test everything for them.',
              },
              {
                q: 'Does the monthly plan include the phone number?',
                a: 'Yes. Every plan includes dedicated professional phone number(s). There is no separate number purchase required.',
              },
              {
                q: 'Can I upgrade or cancel anytime?',
                a: 'Yes. You can upgrade, downgrade, or cancel anytime from your billing settings. Changes take effect on your next billing cycle.',
              },
              {
                q: 'What is A2P 10DLC registration?',
                a: 'It is the US carrier compliance registration required to send SMS messages at scale. We handle this for you as part of your plan.',
              },
            ].map((item, i) => (
              <div key={i}>
                <h4 className="text-white font-medium mb-2">{item.q}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
