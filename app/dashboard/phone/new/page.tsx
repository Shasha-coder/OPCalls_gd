'use client'

import { useRouter } from 'next/navigation'
import { PLANS, formatPrice } from '@/lib/products'
import { CheckIcon, ArrowRightIcon, ArrowLeftIcon, LockIcon, ExternalLinkIcon } from '@/components/ui/Icons'

export default function GetNumberPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-[#474b37] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#262720] rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Get a Phone Number</h1>
            <p className="text-sm text-white/50">Your dedicated number is included in every plan</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Explanation banner */}
        <div className="bg-[#262720] border border-[#474b37] rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1a1b18] border border-[#474b37] flex items-center justify-center flex-shrink-0">
            <span className="text-[#e7f69e] text-lg font-bold">#</span>
          </div>
          <div>
            <h2 className="text-white font-semibold mb-1">No separate number purchase needed</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Each plan includes one or more dedicated professional phone numbers. 
              Pick a plan below — your number is provisioned automatically after payment.
              Optionally, add our team's setup service to have everything configured for you.
            </p>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border transition-all ${
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

              <div className="p-6 flex flex-col flex-1 space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{formatPrice(plan.monthlyPriceCents)}</span>
                    <span className="text-white/50 text-sm">/mo</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {plan.numbers} number{plan.numbers > 1 ? 's' : ''} · {plan.minutes.toLocaleString()} min · {plan.sms.toLocaleString()} SMS
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-[#e7f69e] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-white/60 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Optional setup fee */}
                <div className="rounded-xl border border-[#3a3d32] bg-[#1a1b18] p-3">
                  <p className="text-xs text-white/50 mb-2">
                    Need setup by our team?{' '}
                    <a
                      href={plan.setupFeeStripeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#e7f69e] hover:underline"
                    >
                      Add setup — {formatPrice(plan.setupFeeCents)} one-time
                    </a>
                  </p>
                  <p className="text-xs text-white/30">{plan.setupFeeDescription}</p>
                </div>

                {/* CTA */}
                <a
                  href={plan.monthlyStripeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-full font-medium text-sm border-2 transition-all ${
                    plan.badge
                      ? 'bg-[#e7f69e] border-[#e7f69e] text-[#1a1b18] hover:bg-[#d4e38c]'
                      : 'bg-transparent border-[#474b37] text-[#e7f69e] hover:border-[#e7f69e]'
                  }`}
                >
                  Subscribe & Get Number
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
          <LockIcon className="w-4 h-4" />
          <span>Payments secured by Stripe. Cancel anytime.</span>
        </div>
      </div>
    </div>
  )
}
