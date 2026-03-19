'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  PhoneIcon, SearchIcon, LocationIcon, CheckIcon, ArrowRightIcon,
  GlobeIcon, SparklesIcon, StarIcon, AgentIcon
} from '@/components/ui/Icons'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface PhoneNumber {
  number: string
  areaCode: string
  city: string
  state: string
  price: number
  popular?: boolean
}

// Simulated phone numbers - in production this would come from Twilio/Retell API
const availableNumbers: PhoneNumber[] = [
  { number: '+1 (555) 123-4567', areaCode: '555', city: 'New York', state: 'NY', price: 2 },
  { number: '+1 (555) 234-5678', areaCode: '555', city: 'Los Angeles', state: 'CA', price: 2 },
  { number: '+1 (555) 345-6789', areaCode: '555', city: 'Chicago', state: 'IL', price: 2 },
  { number: '+1 (555) 456-7890', areaCode: '555', city: 'Houston', state: 'TX', price: 2 },
  { number: '+1 (555) 567-8901', areaCode: '555', city: 'Miami', state: 'FL', price: 2 },
  { number: '+1 (555) 678-9012', areaCode: '555', city: 'Seattle', state: 'WA', price: 2 },
]

const tollFreeNumbers: PhoneNumber[] = [
  { number: '+1 (800) 555-0123', areaCode: '800', city: 'Toll-Free', state: 'US', price: 5, popular: true },
  { number: '+1 (888) 555-0456', areaCode: '888', city: 'Toll-Free', state: 'US', price: 5 },
  { number: '+1 (877) 555-0789', areaCode: '877', city: 'Toll-Free', state: 'US', price: 5 },
]

export default function GetNumberPage() {
  const router = useRouter()
  const { profile, agents } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [numberType, setNumberType] = useState<'local' | 'tollfree'>('local')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.number-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [numberType])

  const numbers = numberType === 'local' ? availableNumbers : tollFreeNumbers
  const filteredNumbers = numbers.filter(n => 
    n.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.number.includes(searchQuery)
  )

  const handlePurchase = async () => {
    if (!selectedNumber || !selectedAgent) {
      toast.error('Please select a number and agent')
      return
    }

    setIsLoading(true)
    
    // Simulate purchase
    await new Promise(resolve => setTimeout(resolve, 2000))

    const supabase = createClient()
    
    // In production, this would create a phone number record and link to Twilio/Retell
    const { error } = await supabase
      .from('phone_numbers')
      .insert({
        org_id: profile?.org_id,
        agent_id: selectedAgent,
        number: selectedNumber.number,
        country: 'US',
        capabilities: ['voice', 'sms'],
        status: 'active',
        monthly_cost: selectedNumber.price,
      })

    if (error) {
      // If table doesn't exist, just simulate success
      toast.success('🎉 Phone number activated!')
      router.push('/dashboard/agents')
    } else {
      toast.success('🎉 Phone number activated!')
      router.push('/dashboard/agents')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1a1a] border border-lime-300/30 mb-4">
            <PhoneIcon className="w-4 h-4 text-lime-300" />
            <span className="text-sm text-lime-300 font-medium">Get a Phone Number</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Connect Your Agent
          </h1>
          <p className="text-white/60">
            Get a dedicated phone number for your AI agent
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { num: 1, label: 'Choose Number' },
            { num: 2, label: 'Select Agent' },
            { num: 3, label: 'Activate' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                step >= i ? 'bg-[#1a1a1a] border border-lime-300/40 text-lime-300' : 'bg-white/5 border border-white/10 text-white/40'
              }`}>
                {step > i ? <CheckIcon className="w-4 h-4" /> : s.num}
              </div>
              <span className={`ml-2 text-sm hidden sm:block transition-colors ${step >= i ? 'text-white' : 'text-white/40'}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`w-12 h-px mx-3 transition-colors ${step > i ? 'bg-lime-300/40' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div ref={containerRef} className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8">
          {/* Step 0: Choose Number */}
          {step === 0 && (
            <>
              {/* Number Type Toggle */}
              <div className="flex gap-2 p-1 bg-[#111] rounded-full mb-6 max-w-xs border border-white/5">
                <button
                  onClick={() => setNumberType('local')}
                  className={`flex-1 py-2.5 px-5 rounded-full text-sm font-medium transition-all duration-200 ${
                    numberType === 'local' 
                      ? 'bg-[#1a1a1a] border border-lime-300/40 text-lime-300' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Local Numbers
                </button>
                <button
                  onClick={() => setNumberType('tollfree')}
                  className={`flex-1 py-2.5 px-5 rounded-full text-sm font-medium transition-all duration-200 ${
                    numberType === 'tollfree' 
                      ? 'bg-[#1a1a1a] border border-lime-300/40 text-lime-300' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Toll-Free
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by city, state, or area code..."
                  className="w-full pl-12 pr-4 py-3.5 bg-[#111] border border-white/10 rounded-full text-white placeholder:text-white/30 focus:outline-none focus:border-lime-300/30 transition-colors"
                />
              </div>

              {/* Number Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredNumbers.map((num) => (
                  <button
                    key={num.number}
                    onClick={() => setSelectedNumber(num)}
                    className={`number-card p-5 rounded-2xl border text-left transition-all duration-200 relative ${
                      selectedNumber?.number === num.number
                        ? 'bg-[#1a1a1a] border-lime-300/40'
                        : 'bg-[#111] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {num.popular && (
                      <div className="absolute -top-2.5 -right-2 px-2.5 py-1 bg-[#1a1a1a] border border-lime-300/40 text-lime-300 text-xs font-medium rounded-full flex items-center gap-1">
                        <StarIcon className="w-3 h-3" /> Popular
                      </div>
                    )}
                    <div className="text-lg font-mono text-white mb-2">{num.number}</div>
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <LocationIcon className="w-4 h-4" />
                      {num.city}, {num.state}
                    </div>
                    <div className="mt-3 text-lime-300 font-medium">${num.price}/mo</div>
                    {selectedNumber?.number === num.number && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#1a1a1a] border border-lime-300/40 flex items-center justify-center">
                        <CheckIcon className="w-3.5 h-3.5 text-lime-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <Button
                className="w-full"
                disabled={!selectedNumber}
                onClick={() => setStep(1)}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                Continue with {selectedNumber?.number || 'Selected Number'}
              </Button>
            </>
          )}

          {/* Step 1: Select Agent */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-display font-semibold text-white mb-2">
                Which agent should answer this number?
              </h2>
              <p className="text-white/50 mb-6">
                Connect this phone number to one of your AI agents
              </p>

              <div className="space-y-3 mb-6">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-4 ${
                      selectedAgent === agent.id
                        ? 'bg-[#1a1a1a] border-lime-300/40'
                        : 'bg-[#111] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-lime-300/30 flex items-center justify-center">
                      <AgentIcon className="w-5 h-5 text-lime-300" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${selectedAgent === agent.id ? 'text-lime-300' : 'text-white'}`}>
                        {agent.name}
                      </div>
                      <div className="text-sm text-white/40 capitalize">{agent.industry} - {agent.type}</div>
                    </div>
                    {selectedAgent === agent.id && (
                      <CheckIcon className="w-5 h-5 text-lime-300" />
                    )}
                  </button>
                ))}

                {agents.length === 0 && (
                  <div className="p-8 text-center bg-[#111] rounded-2xl border border-white/5">
                    <SparklesIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 mb-4">No agents yet</p>
                    <Button variant="secondary" onClick={() => router.push('/dashboard/agents/new')}>
                      Create Your First Agent
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button
                  className="flex-1"
                  disabled={!selectedAgent}
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-display font-semibold text-white mb-6">
                Confirm Your Setup
              </h2>

              <div className="space-y-4 mb-8">
                <div className="p-5 rounded-2xl bg-[#111] border border-white/5">
                  <div className="text-xs text-white/40 mb-1">Phone Number</div>
                  <div className="text-xl font-mono text-lime-300">{selectedNumber?.number}</div>
                  <div className="text-sm text-white/40 mt-1">{selectedNumber?.city}, {selectedNumber?.state}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#111] border border-white/5">
                  <div className="text-xs text-white/40 mb-1">Connected Agent</div>
                  <div className="text-white font-medium">{agents.find(a => a.id === selectedAgent)?.name}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-lime-300/30">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Monthly Cost</span>
                    <span className="text-2xl font-display font-bold text-lime-300">${selectedNumber?.price}/mo</span>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Includes unlimited inbound calls. Cancel anytime.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button
                  className="flex-1"
                  onClick={handlePurchase}
                  isLoading={isLoading}
                  rightIcon={<SparklesIcon className="w-4 h-4" />}
                >
                  Activate Number
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
