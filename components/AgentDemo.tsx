'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// Demo agents with emoji icons - matching your design reference
const demoAgents = [
  {
    id: 'sarah',
    name: 'Sarah',
    industry: 'Dental Office',
    emoji: '👩‍⚕️',
    bgColor: 'from-sky-400 to-sky-500',
    greeting: '"Hi, thank you for calling Sunshine Dental! This is Sarah, how can I help you today?"',
    capabilities: 'Books appointments, answers insurance questions, handles rescheduling',
    agentId: process.env.NEXT_PUBLIC_DEMO_AGENT_DENTAL || '',
  },
  {
    id: 'michael',
    name: 'Michael',
    industry: 'Real Estate',
    emoji: '🏠',
    bgColor: 'from-orange-400 to-orange-500',
    greeting: '"Hello! Thanks for calling Premier Realty. This is Michael, how may I assist you with your property search?"',
    capabilities: 'Schedules viewings, qualifies leads, provides property details',
    agentId: process.env.NEXT_PUBLIC_DEMO_AGENT_REALTY || '',
  },
  {
    id: 'alex',
    name: 'Alex',
    industry: 'Auto Service',
    emoji: '🚗',
    bgColor: 'from-green-400 to-green-500',
    greeting: '"Hi there! You\'ve reached Premier Auto Service. This is Alex, how can I help with your vehicle today?"',
    capabilities: 'Books service appointments, provides estimates, handles recalls',
    agentId: process.env.NEXT_PUBLIC_DEMO_AGENT_AUTO || '',
  },
  {
    id: 'emma',
    name: 'Emma',
    industry: 'Med Spa',
    emoji: '✨',
    bgColor: 'from-purple-400 to-purple-500',
    greeting: '"Welcome to Radiance Med Spa! This is Emma speaking, how may I help you feel your best today?"',
    capabilities: 'Books treatments, answers pricing questions, recommends services',
    agentId: process.env.NEXT_PUBLIC_DEMO_AGENT_MEDSPA || '',
  },
]

export default function AgentDemo() {
  const [selectedAgent, setSelectedAgent] = useState(demoAgents[0])
  const [isVisible, setIsVisible] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isCallLoading, setIsCallLoading] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'success' | 'error'>('idle')
  const [consentGiven, setConsentGiven] = useState(false)
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

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const handleDemoCall = async () => {
    if (!consentGiven) {
      alert('Please consent to receive the demo call')
      return
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '')
    if (cleanNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    setIsCallLoading(true)
    setCallStatus('calling')

    try {
      const response = await fetch('/api/demo-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: `+1${cleanNumber}`,
          agentType: selectedAgent.id,
          agentId: selectedAgent.agentId,
          consent: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCallStatus('success')
      } else {
        setCallStatus('error')
      }
    } catch (error) {
      console.error('Demo call error:', error)
      setCallStatus('error')
    } finally {
      setIsCallLoading(false)
    }
  }

  return (
    <section ref={sectionRef} id="demo" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-dark overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#e8fb76]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#e8fb76]/10 border border-[#e8fb76]/20 text-[#e8fb76] text-sm font-medium mb-4">
            Try It Now
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Meet Our AI Agents
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Experience how our AI handles real calls. Select an agent and try a live demo.
          </p>
        </div>

        {/* Agent Selection Cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 transition-all duration-700 ease-out delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {demoAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-6 rounded-2xl border transition-all duration-300 text-left ${
                selectedAgent.id === agent.id
                  ? 'bg-[#1a1a1a] border-[#e8fb76]/30 shadow-[0_0_30px_rgba(232,251,118,0.1)]'
                  : 'bg-[#141414] border-white/5 hover:border-white/10'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.bgColor} flex items-center justify-center text-2xl mb-4`}>
                {agent.emoji}
              </div>
              <div className={`font-semibold ${selectedAgent.id === agent.id ? 'text-[#e8fb76]' : 'text-white'}`}>
                {agent.name}
              </div>
              <div className="text-white/50 text-sm">{agent.industry}</div>
            </button>
          ))}
        </div>

        {/* Selected Agent Details */}
        <div className={`max-w-3xl mx-auto transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-[#141414] rounded-3xl border border-white/10 p-8">
            {/* Agent Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedAgent.bgColor} flex items-center justify-center text-3xl`}>
                {selectedAgent.emoji}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedAgent.name}</h3>
                <p className="text-white/50">{selectedAgent.industry} Agent</p>
              </div>
            </div>

            {/* Greeting */}
            <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/5">
              <p className="text-white/80 italic text-lg leading-relaxed">
                {selectedAgent.greeting}
              </p>
            </div>

            {/* Capabilities */}
            <div className="mb-8">
              <span className="text-[#e8fb76] font-medium">Capabilities: </span>
              <span className="text-white/60">{selectedAgent.capabilities}</span>
            </div>

            {/* Demo Call Form */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/30 focus:outline-none focus:border-[#e8fb76]/50 transition-colors"
                />
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[#e8fb76] focus:ring-[#e8fb76]/50"
                />
                <span className="text-white/50 text-sm">
                  I consent to receive a demo call from OPCalls AI. Standard message and data rates may apply.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDemoCall}
                  disabled={isCallLoading || !consentGiven || phoneNumber.length < 14}
                  className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold transition-all duration-300 ${
                    isCallLoading || !consentGiven || phoneNumber.length < 14
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-[#e8fb76] text-[#1a1a1a] hover:shadow-[0_0_30px_rgba(232,251,118,0.3)]'
                  }`}
                >
                  {isCallLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Calling...
                    </>
                  ) : callStatus === 'success' ? (
                    <>
                      <span>✓</span>
                      Call Initiated!
                    </>
                  ) : (
                    <>
                      <span>📞</span>
                      Try Live Demo Call
                    </>
                  )}
                </button>

                <Link
                  href="/auth/signup"
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  Get Your Own Agent
                  <span>→</span>
                </Link>
              </div>

              {callStatus === 'success' && (
                <p className="text-center text-[#e8fb76] text-sm">
                  🎉 Your phone will ring shortly! Pick up to chat with {selectedAgent.name}.
                </p>
              )}

              {callStatus === 'error' && (
                <p className="text-center text-red-400 text-sm">
                  Something went wrong. Please try again or contact support.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
