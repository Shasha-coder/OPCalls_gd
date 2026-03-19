'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { 
  PhoneIcon, SearchIcon, CheckIcon, ArrowLeftIcon, 
  ArrowRightIcon, AgentIcon 
} from '@/components/ui/Icons'

// Mock available numbers - in production this would come from Twilio/Vonage API
const generateMockNumbers = (areaCode: string, country: string) => {
  const numbers = []
  for (let i = 0; i < 8; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const mid = Math.floor(100 + Math.random() * 900)
    numbers.push({
      id: `num-${i}-${Date.now()}`,
      number: country === 'US' || country === 'CA' 
        ? `+1 (${areaCode}) ${mid}-${suffix}`
        : country === 'UK'
        ? `+44 ${areaCode} ${mid} ${suffix}`
        : `+61 ${areaCode} ${mid} ${suffix}`,
      type: i % 3 === 0 ? 'toll-free' : 'local',
      monthlyRate: i % 3 === 0 ? 15.00 : 5.00,
      capabilities: ['voice', 'sms'],
    })
  }
  return numbers
}

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸', prefix: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', prefix: '+1' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', prefix: '+44' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', prefix: '+61' },
]

type Step = 'search' | 'select' | 'assign' | 'confirm' | 'success'

export default function BuyPhoneNumberPage() {
  const router = useRouter()
  const { profile, agents } = useAuthStore()
  
  const [step, setStep] = useState<Step>('search')
  const [country, setCountry] = useState('US')
  const [numberType, setNumberType] = useState<'local' | 'toll-free'>('local')
  const [areaCode, setAreaCode] = useState('')
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([])
  const [selectedNumber, setSelectedNumber] = useState<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchasedNumber, setPurchasedNumber] = useState<any>(null)

  const searchNumbers = async () => {
    if (!areaCode || areaCode.length < 3) {
      toast.error('Please enter a valid area code')
      return
    }
    
    setIsSearching(true)
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const numbers = generateMockNumbers(areaCode, country)
    setAvailableNumbers(numbers.filter(n => 
      numberType === 'toll-free' ? n.type === 'toll-free' : n.type === 'local'
    ))
    setIsSearching(false)
    setStep('select')
  }

  const handleSelectNumber = (num: any) => {
    setSelectedNumber(num)
    setStep('assign')
  }

  const handleAssignAgent = (agentId: string | null) => {
    setSelectedAgent(agentId)
    setStep('confirm')
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)
    const supabase = createClient()

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in first')
        router.push('/auth/login')
        setIsPurchasing(false)
        return
      }

      // Get or create organization
      let orgId = profile?.org_id
      
      if (!orgId) {
        // Create organization with all required fields
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
          console.error('[v0] Org creation error:', orgError)
          toast.error('Failed to setup organization: ' + (orgError?.message || 'Unknown error'))
          setIsPurchasing(false)
          return
        }

        // Link to profile
        await supabase
          .from('profiles')
          .update({ org_id: newOrg.id })
          .eq('id', user.id)

        orgId = newOrg.id
      }

      // Insert phone number with proper schema fields
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert({
          org_id: orgId,
          retell_phone_number: selectedNumber.number.replace(/\D/g, ''), // E.164 format
          pretty_number: selectedNumber.number,
          area_code: parseInt(areaCode) || null,
          country: country,
          agent_id: selectedAgent,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Phone insert error:', error)
        toast.error('Failed to purchase number: ' + error.message)
        setIsPurchasing(false)
        return
      }

      // Success!
      setPurchasedNumber(data)
      setStep('success')
      toast.success('Phone number purchased successfully!')
      
    } catch (err: any) {
      console.error('[v0] Unexpected error:', err)
      toast.error('An error occurred: ' + (err?.message || 'Please try again'))
    }
    
    setIsPurchasing(false)
  }

  const goBack = () => {
    if (step === 'select') setStep('search')
    else if (step === 'assign') setStep('select')
    else if (step === 'confirm') setStep('assign')
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
          {step === 'confirm' && 'Review and confirm your purchase'}
          {step === 'success' && 'Your new phone number is ready to use'}
        </p>
      </div>

      {/* Progress Steps */}
      {step !== 'success' && (
        <div className="flex items-center gap-2 mb-8">
          {['Search', 'Select', 'Assign', 'Confirm'].map((s, i) => {
            const stepMap: Record<string, number> = { search: 0, select: 1, assign: 2, confirm: 3 }
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCountry(c.code)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      country === c.code
                        ? 'bg-[#1a1b18] border-[#e7f69e] text-white'
                        : 'bg-[#1a1b18] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{c.flag}</span>
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
                  <span className="text-xs text-white/40">$5/month - Best for local presence</span>
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
                  <span className="text-xs text-white/40">$15/month - Free calls for customers</span>
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
                    <span className="text-[#e7f69e] font-medium block">${num.monthlyRate}/mo</span>
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Assign to Agent (Optional)
              </label>
              <p className="text-sm text-white/40 mb-4">
                You can assign this number to an AI agent now, or do it later from the phone numbers page.
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

            <Button
              onClick={() => handleAssignAgent(selectedAgent)}
              className="w-full"
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
              Continue to Review
            </Button>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-white">Order Summary</h3>
              
              <div className="p-4 rounded-xl bg-[#1a1b18] border border-[#3a3d32] space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/50">Phone Number</span>
                  <span className="text-white font-mono">{selectedNumber?.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Type</span>
                  <span className="text-white capitalize">{selectedNumber?.type}</span>
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
                  <span className="text-white/50">Monthly Cost</span>
                  <span className="text-[#e7f69e] font-semibold">${selectedNumber?.monthlyRate}/month</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#e7f69e]/10 border border-[#e7f69e]/20">
                <p className="text-[#e7f69e] text-sm">
                  A confirmation email with your receipt will be sent to your registered email address.
                </p>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              isLoading={isPurchasing}
              className="w-full"
              variant="secondary"
            >
              Confirm Purchase
            </Button>
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
                variant="outline"
                onClick={() => router.push('/dashboard/phone')}
                className="flex-1"
              >
                View All Numbers
              </Button>
              {!selectedAgent && (
                <Button
                  onClick={() => router.push('/dashboard/agents')}
                  className="flex-1"
                >
                  Assign an Agent
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
