'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import Checkout from '@/components/checkout'
import toast from 'react-hot-toast'
import { 
  PhoneIcon, SearchIcon, CheckIcon, ArrowLeftIcon, 
  ArrowRightIcon, AgentIcon, LockIcon
} from '@/components/ui/Icons'
import { getProductByCountryAndType, formatPrice, type PhoneProduct } from '@/lib/products'

// Mock available numbers - in production this would come from Twilio/Vonage API
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
  { code: 'US', name: 'United States', flag: 'US', prefix: '+1' },
  { code: 'CA', name: 'Canada', flag: 'CA', prefix: '+1' },
  { code: 'UK', name: 'United Kingdom', flag: 'UK', prefix: '+44' },
]

type Step = 'search' | 'select' | 'assign' | 'payment' | 'success'

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
  const [isSearching, setIsSearching] = useState(false)
  const [product, setProduct] = useState<PhoneProduct | null>(null)

  // Get the product based on country and type
  useEffect(() => {
    const p = getProductByCountryAndType(country, numberType)
    setProduct(p || null)
  }, [country, numberType])

  // Refresh agents on mount
  useEffect(() => {
    refreshAgents()
  }, [])

  const searchNumbers = async () => {
    if (!areaCode || areaCode.length < 3) {
      toast.error('Please enter a valid area code')
      return
    }
    
    setIsSearching(true)
    // Simulate API delay - in production this calls Twilio/Vonage API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const numbers = generateMockNumbers(areaCode, country, numberType)
    setAvailableNumbers(numbers)
    setIsSearching(false)
    setStep('select')
  }

  const handleSelectNumber = (num: any) => {
    setSelectedNumber(num)
    setStep('assign')
  }

  const handleAssignAgent = (agentId: string | null) => {
    setSelectedAgent(agentId)
    setStep('payment')
  }

  const handlePaymentComplete = async () => {
    // After successful payment, save the phone number to database
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Session expired. Please sign in again.')
        router.push('/auth/login')
        return
      }

      let orgId = profile?.org_id
      
      // Create organization if needed
      if (!orgId) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            owner_id: user.id,
            name: 'My Organization',
            email: user.email || '',
            industry: 'other',
          })
          .select()
          .single()

        if (orgError || !newOrg) {
          toast.error('Failed to setup organization')
          return
        }

        await supabase
          .from('profiles')
          .update({ org_id: newOrg.id })
          .eq('id', user.id)

        orgId = newOrg.id
      }

      // Insert phone number record
      const { error } = await supabase
        .from('phone_numbers')
        .insert({
          org_id: orgId,
          retell_phone_number: selectedNumber.number.replace(/\D/g, ''),
          pretty_number: selectedNumber.number,
          area_code: parseInt(areaCode) || null,
          country: country,
          agent_id: selectedAgent,
          is_active: true,
        })

      if (error) {
        toast.error('Failed to save phone number')
        return
      }

      setStep('success')
      toast.success('Phone number purchased successfully!')
      
    } catch (err) {
      toast.error('An error occurred')
    }
  }

  const goBack = () => {
    if (step === 'select') setStep('search')
    else if (step === 'assign') setStep('select')
    else if (step === 'payment') setStep('assign')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => step === 'search' || step === 'success' ? router.push('/dashboard/phone') : goBack()}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {step === 'success' ? 'Back to Phone Numbers' : 'Back'}
        </button>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          {step === 'success' ? 'Purchase Complete!' : 'Get a Phone Number'}
        </h1>
        <p className="text-white/50 mt-1">
          {step === 'search' && 'Search for available phone numbers in your area'}
          {step === 'select' && 'Choose a number from the available options'}
          {step === 'assign' && 'Assign this number to an AI agent (optional)'}
          {step === 'payment' && 'Complete your purchase securely with Stripe'}
          {step === 'success' && 'Your new phone number is ready to use'}
        </p>
      </div>

      {/* Progress Steps */}
      {step !== 'success' && (
        <div className="flex items-center gap-2 mb-8">
          {['Search', 'Select', 'Assign', 'Payment'].map((s, i) => {
            const stepMap: Record<string, number> = { search: 0, select: 1, assign: 2, payment: 3 }
            const currentIndex = stepMap[step]
            const isActive = i <= currentIndex
            const isCurrent = i === currentIndex
            
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#e7f69e] text-[#1a1b18]' 
                    : 'bg-[#262720] text-white/40 border border-[#474b37]'
                }`}>
                  {i < currentIndex ? <CheckIcon className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${isCurrent ? 'text-white' : 'text-white/40'}`}>
                  {s}
                </span>
                {i < 3 && <div className={`flex-1 h-px ${isActive ? 'bg-[#e7f69e]/30' : 'bg-[#474b37]'}`} />}
              </div>
            )
          })}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-[#262720] border border-[#474b37] rounded-2xl p-6 lg:p-8">
        
        {/* SEARCH STEP */}
        {step === 'search' && (
          <div className="space-y-6">
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Country</label>
              <div className="grid grid-cols-3 gap-3">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCountry(c.code)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      country === c.code
                        ? 'bg-[#1a1b18] border-[#e7f69e] text-white'
                        : 'bg-[#1a1b18] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
                    }`}
                  >
                    <span className="text-lg font-bold mb-1 block">{c.flag}</span>
                    <span className="text-sm font-medium block">{c.name}</span>
                    <span className="text-xs text-white/40">{c.prefix}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number Type */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Number Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNumberType('local')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    numberType === 'local'
                      ? 'bg-[#1a1b18] border-[#e7f69e] text-white'
                      : 'bg-[#1a1b18] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
                  }`}
                >
                  <span className="font-medium block mb-1">Local Number</span>
                  <span className="text-xs text-white/40">
                    {formatPrice(getProductByCountryAndType(country, 'local')?.priceInCents || 500)}/month
                  </span>
                </button>
                <button
                  onClick={() => setNumberType('toll-free')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    numberType === 'toll-free'
                      ? 'bg-[#1a1b18] border-[#e7f69e] text-white'
                      : 'bg-[#1a1b18] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
                  }`}
                >
                  <span className="font-medium block mb-1">Toll-Free Number</span>
                  <span className="text-xs text-white/40">
                    {formatPrice(getProductByCountryAndType(country, 'toll-free')?.priceInCents || 1500)}/month
                  </span>
                </button>
              </div>
            </div>

            {/* Area Code */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Area Code</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={numberType === 'toll-free' ? '800, 888, 877...' : 'Enter area code'}
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  className="flex-1 px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#e7f69e]"
                />
                <Button
                  onClick={searchNumbers}
                  isLoading={isSearching}
                  leftIcon={<SearchIcon className="w-4 h-4" />}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SELECT STEP */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">{availableNumbers.length} numbers available</span>
              <button 
                onClick={() => setStep('search')}
                className="text-sm text-[#e7f69e] hover:underline"
              >
                Change search
              </button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {availableNumbers.map((num) => (
                <button
                  key={num.id}
                  onClick={() => handleSelectNumber(num)}
                  className="w-full p-4 rounded-xl bg-[#1a1b18] border border-[#3a3d32] hover:border-[#e7f69e] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#262720] border border-[#474b37] flex items-center justify-center group-hover:border-[#e7f69e] transition-colors">
                      <PhoneIcon className="w-5 h-5 text-[#e7f69e]" />
                    </div>
                    <div className="text-left">
                      <span className="text-white font-mono text-lg block">{num.number}</span>
                      <span className="text-white/40 text-sm capitalize">{num.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[#e7f69e] font-medium block">
                      {product ? formatPrice(product.priceInCents) : '$5.00'}/mo
                    </span>
                    <span className="text-white/40 text-xs">Voice + SMS</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ASSIGN STEP */}
        {step === 'assign' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#1a1b18] border border-[#3a3d32]">
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-[#e7f69e]" />
                <span className="text-white font-mono">{selectedNumber?.number}</span>
                <span className="ml-auto text-[#e7f69e] font-medium">
                  {product ? formatPrice(product.priceInCents) : '$5.00'}/mo
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Assign to Agent (Optional)
              </label>
              <p className="text-sm text-white/40 mb-4">
                You can assign this number to an AI agent now, or do it later.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleAssignAgent(null)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedAgent === null
                      ? 'bg-[#1a1b18] border-[#e7f69e] text-white'
                      : 'bg-[#1a1b18] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
                  }`}
                >
                  <span className="font-medium">Assign Later</span>
                  <span className="text-sm text-white/40 block mt-1">
                    You can assign an agent from the phone numbers page
                  </span>
                </button>
                
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAssignAgent(agent.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                        selectedAgent === agent.id
                          ? 'bg-[#1a1b18] border-[#e7f69e] text-white'
                          : 'bg-[#1a1b18] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#262720] border border-[#474b37] flex items-center justify-center">
                        <AgentIcon className="w-5 h-5 text-[#e7f69e]/70" />
                      </div>
                      <div>
                        <span className="font-medium block">{agent.name}</span>
                        <span className="text-sm text-white/40 capitalize">{agent.industry}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-[#1a1b18] border border-[#3a3d32] text-center">
                    <p className="text-white/50 text-sm">No agents created yet</p>
                    <p className="text-white/30 text-xs mt-1">Create an agent first, or assign one later</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT STEP - Real Stripe Checkout */}
        {step === 'payment' && product && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="p-4 rounded-xl bg-[#1a1b18] border border-[#3a3d32] space-y-3 mb-6">
              <h3 className="text-white font-medium mb-4">Order Summary</h3>
              <div className="flex justify-between">
                <span className="text-white/50">Phone Number</span>
                <span className="text-white font-mono">{selectedNumber?.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Type</span>
                <span className="text-white capitalize">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Assigned Agent</span>
                <span className="text-white">
                  {selectedAgent 
                    ? agents.find(a => a.id === selectedAgent)?.name 
                    : 'To be assigned later'}
                </span>
              </div>
              <div className="border-t border-[#3a3d32] my-3" />
              <div className="flex justify-between">
                <span className="text-white font-medium">Monthly Subscription</span>
                <span className="text-[#e7f69e] font-semibold">{formatPrice(product.priceInCents)}/month</span>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-white/40 text-sm mb-4">
              <LockIcon className="w-4 h-4" />
              <span>Secured by Stripe</span>
            </div>

            {/* Stripe Embedded Checkout */}
            <Checkout 
              productId={product.id}
              metadata={{
                phone_number: selectedNumber?.number || '',
                country: country,
                number_type: numberType,
                agent_id: selectedAgent || '',
              }}
              onComplete={handlePaymentComplete}
            />
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-[#e7f69e]/10 border border-[#e7f69e]/30 flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="w-10 h-10 text-[#e7f69e]" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              Number Purchased!
            </h2>
            <p className="text-white/50 mb-6">
              Your new phone number is now active and ready to receive calls.
            </p>

            <div className="p-4 rounded-xl bg-[#1a1b18] border border-[#3a3d32] mb-6">
              <PhoneIcon className="w-6 h-6 text-[#e7f69e] mx-auto mb-2" />
              <span className="text-white font-mono text-xl block">{selectedNumber?.number}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#e7f69e]/10 border border-[#e7f69e]/20 text-left mb-8">
              <p className="text-[#e7f69e] text-sm">
                A confirmation email and receipt has been sent to your email address.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/phone')}
                className="flex-1"
              >
                View All Numbers
              </Button>
              <Button
                onClick={() => router.push('/dashboard/agents')}
                className="flex-1"
              >
                Manage Agents
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
