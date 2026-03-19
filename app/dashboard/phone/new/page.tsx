'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { 
  PhoneIcon, SearchIcon, CheckIcon, ArrowLeftIcon, 
  ArrowRightIcon, AgentIcon, LockIcon, ExternalLinkIcon
} from '@/components/ui/Icons'
import { PHONE_PRODUCTS, formatPrice, type PhoneProduct } from '@/lib/products'

const generateMockNumbers = (areaCode: string, country: string, type: 'local' | 'toll-free') => {
  const numbers = []
  const count = type === 'toll-free' ? 4 : 6
  
  for (let i = 0; i < count; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const mid = Math.floor(100 + Math.random() * 900)
    numbers.push({
      id: `num-${i}-${Date.now()}`,
      number: country === 'US' || country === 'CA' 
        ? `+1 (${areaCode}) ${mid}-${suffix}`
        : country === 'UK'
        ? `+44 ${areaCode} ${mid} ${suffix}`
        : `+61 ${areaCode} ${mid} ${suffix}`,
      type,
      capabilities: ['voice', 'sms'],
    })
  }
  return numbers
}

const countries = [
  { code: 'US', name: 'United States', prefix: '+1' },
  { code: 'CA', name: 'Canada', prefix: '+1' },
  { code: 'UK', name: 'United Kingdom', prefix: '+44' },
]

type Step = 'search' | 'select' | 'assign' | 'checkout' | 'success'

export default function BuyPhoneNumberPage() {
  const router = useRouter()
  const { profile, agents, refreshAgents } = useAuthStore()
  
  const [step, setStep] = useState<Step>('search')
  const [country, setCountry] = useState('US')
  const [numberType, setNumberType] = useState<'local' | 'toll-free'>('local')
  const [areaCode, setAreaCode] = useState('')
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([])
  const [selectedNumber, setSelectedNumber] = useState<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    refreshAgents()
  }, [])

  const getProduct = (): PhoneProduct | undefined => {
    return PHONE_PRODUCTS.find(p => p.country === country && p.type === numberType)
  }

  const handleSearch = () => {
    if (!areaCode) {
      toast.error('Please enter an area code')
      return
    }
    
    const numbers = generateMockNumbers(areaCode, country, numberType)
    setAvailableNumbers(numbers)
    setSelectedNumber(null)
    setStep('select')
  }

  const handleSelectNumber = (number: any) => {
    setSelectedNumber(number)
    setStep('assign')
  }

  const handleProceedToCheckout = () => {
    const product = getProduct()
    if (!product?.stripeLink) {
      toast.error('Payment link not available')
      return
    }

    // Add metadata to Stripe link
    const metadataParams = new URLSearchParams({
      prefilled_email: profile?.email || '',
      client_reference_id: profile?.id || '',
      success_url: `${window.location.origin}/dashboard/phone?purchased=true`,
    })

    // Redirect to Stripe payment link
    window.location.href = `${product.stripeLink}?${metadataParams.toString()}`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-[#474b37] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#262720] rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Get a Phone Number</h1>
              <p className="text-sm text-white/50">Step {step === 'search' ? '1' : step === 'select' ? '2' : step === 'assign' ? '3' : '4'} of 4</p>
            </div>
          </div>
          <LockIcon className="w-5 h-5 text-[#e7f69e]" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step: Search */}
        {step === 'search' && (
          <div className="space-y-8">
            <div className="bg-[#262720] border border-[#474b37] rounded-2xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-3">Country</label>
                <div className="grid grid-cols-3 gap-3">
                  {countries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => setCountry(c.code)}
                      className={`p-4 rounded-xl border transition-all ${
                        country === c.code
                          ? 'bg-[#1a1b18] border-[#e7f69e]'
                          : 'bg-[#1a1b18] border-[#3a3d32] hover:border-[#474b37]'
                      }`}
                    >
                      <div className="text-sm font-medium text-white">{c.name}</div>
                      <div className="text-xs text-white/50">{c.prefix}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">Number Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['local', 'toll-free'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNumberType(type)}
                      className={`p-4 rounded-xl border transition-all ${
                        numberType === type
                          ? 'bg-[#1a1b18] border-[#e7f69e]'
                          : 'bg-[#1a1b18] border-[#3a3d32] hover:border-[#474b37]'
                      }`}
                    >
                      <div className="text-sm font-medium text-white capitalize">{type} Number</div>
                      <div className="text-xs text-white/50 mt-1">
                        {type === 'local' ? 'Your area code' : 'No area code needed'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">Area Code</label>
                <input
                  type="text"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="e.g., 212, 415, 917"
                  className="w-full px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white placeholder-white/30 focus:border-[#e7f69e] focus:outline-none transition-colors"
                />
              </div>

              <Button
                onClick={handleSearch}
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                className="w-full"
              >
                Search Numbers
              </Button>
            </div>

            {/* Pricing info */}
            <div className="bg-[#262720] border border-[#474b37] rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-[#e7f69e] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-white mb-2">Pricing</h3>
                  <p className="text-sm text-white/60">
                    {`${numberType === 'local' ? 'Local' : 'Toll-free'} ${country} numbers: ${formatPrice((getProduct()?.priceInCents || 0))} per month`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Select Number */}
        {step === 'select' && selectedNumber === null && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('search')}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to search
            </button>

            <div className="space-y-3">
              {availableNumbers.map(number => (
                <button
                  key={number.id}
                  onClick={() => handleSelectNumber(number)}
                  className="w-full p-6 bg-[#262720] border border-[#3a3d32] rounded-xl hover:border-[#e7f69e] hover:bg-[#1a1b18] transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-5 h-5 text-[#e7f69e] group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-lg font-medium text-white">{number.number}</div>
                        <div className="text-xs text-white/50">Available now</div>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-white/30 group-hover:text-[#e7f69e] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Assign Agent */}
        {step === 'assign' && selectedNumber && (
          <div className="space-y-8">
            <div className="bg-[#262720] border border-[#474b37] rounded-2xl p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-2">Selected Number</h2>
                <div className="flex items-center gap-3 p-4 bg-[#1a1b18] border border-[#3a3d32] rounded-xl">
                  <PhoneIcon className="w-5 h-5 text-[#e7f69e]" />
                  <div className="text-lg font-medium text-white">{selectedNumber.number}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">Assign to Agent (Optional)</label>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${
                      selectedAgent === null
                        ? 'bg-[#1a1b18] border-[#e7f69e]'
                        : 'bg-[#1a1b18] border-[#3a3d32] hover:border-[#474b37]'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">Assign Later</div>
                    <div className="text-xs text-white/50 mt-1">Configure after purchase</div>
                  </button>

                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        selectedAgent === agent.id
                          ? 'bg-[#1a1b18] border-[#e7f69e]'
                          : 'bg-[#1a1b18] border-[#3a3d32] hover:border-[#474b37]'
                      }`}
                    >
                      <div className="text-sm font-medium text-white">{agent.name}</div>
                      <div className="text-xs text-white/50 mt-1">{agent.industry}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep('checkout')}
              variant="secondary"
              size="lg"
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              className="w-full"
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step: Checkout */}
        {step === 'checkout' && selectedNumber && (
          <div className="space-y-6">
            <div className="bg-[#262720] border border-[#474b37] rounded-2xl p-8 space-y-6">
              <h2 className="text-xl font-bold text-white">Order Summary</h2>

              <div className="space-y-4 pb-6 border-b border-[#3a3d32]">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{selectedNumber.number}</div>
                    <div className="text-sm text-white/50 mt-1">{country} {numberType} number</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{formatPrice((getProduct()?.priceInCents || 0) * 12)}</div>
                    <div className="text-xs text-white/50 mt-1">per year</div>
                  </div>
                </div>

                {selectedAgent && agents.find(a => a.id === selectedAgent) && (
                  <div className="flex justify-between items-start pt-4">
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <AgentIcon className="w-4 h-4 text-[#e7f69e]" />
                        {agents.find(a => a.id === selectedAgent)?.name}
                      </div>
                      <div className="text-sm text-white/50 mt-1">Assigned agent</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#1a1b18] rounded-xl p-4 flex items-start gap-3">
                <LockIcon className="w-5 h-5 text-[#e7f69e] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70">
                  You'll be securely redirected to Stripe to complete your payment. Your credit card information is never shared with us.
                </div>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                variant="secondary"
                size="lg"
                rightIcon={<ExternalLinkIcon className="w-4 h-4" />}
                className="w-full"
              >
                Complete Payment on Stripe
              </Button>

              <button
                onClick={() => setStep('assign')}
                className="w-full py-3 text-white/60 hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-[#262720] border border-[#474b37] rounded-full flex items-center justify-center mx-auto">
              <CheckIcon className="w-8 h-8 text-[#e7f69e]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Received!</h2>
            <p className="text-white/60">Your phone number has been activated. Check your email for receipt and next steps.</p>
            <Button
              onClick={() => router.push('/dashboard/phone')}
              variant="secondary"
              size="lg"
              className="mx-auto"
            >
              Back to Phone Numbers
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
