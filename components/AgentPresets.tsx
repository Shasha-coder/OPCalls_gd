'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'

const AGENT_PRESETS = [
  {
    id: 'followup',
    name: 'Follow-Up Agent',
    category: 'Sales',
    color: '#3B82F6',
    description: 'Automatically calls leads after initial contact. Schedules callbacks, sends reminders, and nurtures prospects through the sales funnel with personalized voice conversations.',
    sampleCall: 'Hi, this is Alex from OPCalls. I wanted to follow up on our conversation yesterday about improving your customer service. Do you have a moment to discuss how our AI agents could help?',
  },
  {
    id: 'appointment',
    name: 'Appointment Setter',
    category: 'Scheduling',
    color: '#10B981',
    description: 'Books appointments via phone calls by checking availability, confirming times, and sending calendar invites. Perfect for service businesses needing 24/7 scheduling.',
    sampleCall: 'Great news! I have availability this Thursday at 2 PM or Friday at 10 AM. Which works better for you? I will send you a calendar invite right away.',
  },
  {
    id: 'noshow',
    name: 'No-Show Recovery',
    category: 'Retention',
    color: '#F59E0B',
    description: 'Calls customers who missed appointments to reschedule. Offers incentives and helps reduce revenue loss from no-shows with friendly follow-up calls.',
    sampleCall: 'Hi, we noticed you missed your appointment today. No worries! Would you like to reschedule? I can offer you a 10% discount for your next visit.',
  },
  {
    id: 'hvac',
    name: 'HVAC Support',
    category: 'Home Services',
    color: '#8B5CF6',
    description: 'Handles inbound HVAC service calls, troubleshoots common issues over the phone, schedules maintenance visits, and routes emergency calls appropriately.',
    sampleCall: 'I understand your AC is not cooling properly. Let me help troubleshoot. First, have you checked if the thermostat is set correctly? If the issue persists, I can schedule a technician visit.',
  },
  {
    id: 'realestate',
    name: 'Real Estate Agent',
    category: 'Real Estate',
    color: '#EC4899',
    description: 'Qualifies buyer and seller leads via phone, schedules property viewings, answers listing questions, and captures contact information professionally.',
    sampleCall: 'Thank you for your interest in the property on Oak Street. It is a beautiful 3-bedroom home with a recently renovated kitchen. Would you like to schedule a viewing this weekend?',
  },
  {
    id: 'closer',
    name: 'Closer Agent',
    category: 'Sales',
    color: '#EF4444',
    description: 'Specialized in closing deals over the phone. Handles objections, negotiates terms, and guides prospects to make purchasing decisions with persuasive conversations.',
    sampleCall: 'I hear your concerns about the pricing. Let me share how other businesses in your industry have seen a 3x ROI within the first month. What if we started with a pilot program?',
  },
]

const CATEGORIES = ['All', 'Sales', 'Scheduling', 'Retention', 'Home Services', 'Real Estate']

export default function AgentPresets() {
  const [selectedAgent, setSelectedAgent] = useState(AGENT_PRESETS[0])
  const [activeCategory, setActiveCategory] = useState('All')
  const [showTestModal, setShowTestModal] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const filteredAgents = activeCategory === 'All' 
    ? AGENT_PRESETS 
    : AGENT_PRESETS.filter(a => a.category === activeCategory)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, x: 20 }, 
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      )
    }
  }, [selectedAgent])

  return (
    <>
      <section ref={sectionRef} className="py-20 dark-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 text-xs font-medium text-white/50 border border-white/10 rounded-full mb-4">
              AI VOICE AGENTS
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-white mb-3">Choose Your Call Agent</h2>
            <p className="text-white/40 max-w-md mx-auto">Pre-built voice agents for every business. Test with a real phone call.</p>
          </div>
          
          {/* Category Tabs */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  activeCategory === cat
                    ? 'bg-white text-gray-900'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[480px]">
              {/* Left - Agent List */}
              <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="space-y-2 max-h-[420px] overflow-y-auto hide-scrollbar">
                  {filteredAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                        selectedAgent.id === agent.id ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: `${agent.color}20` }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ background: agent.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{agent.name}</p>
                        <p className="text-white/40 text-sm">{agent.category}</p>
                      </div>
                      {selectedAgent.id === agent.id && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right - Agent Preview */}
              <div ref={cardRef} className="p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${selectedAgent.color}20` }}
                    >
                      <svg className="w-5 h-5" style={{ color: selectedAgent.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-display text-white">{selectedAgent.name}</h3>
                      <span className="text-white/40 text-sm">{selectedAgent.category}</span>
                    </div>
                  </div>

                  <p className="text-white/60 text-sm leading-relaxed mb-6">{selectedAgent.description}</p>

                  {/* Sample Call Script */}
                  <div className="bg-white/5 rounded-2xl p-5 mb-6">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Sample Call Script</p>
                    <p className="text-white/70 text-sm leading-relaxed italic">"{selectedAgent.sampleCall}"</p>
                  </div>

                  {/* Waveform */}
                  <div className="flex items-center gap-0.5 h-10 mb-6">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full"
                        style={{
                          background: selectedAgent.color,
                          height: `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 10}%`,
                          opacity: 0.4,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTestModal(true)}
                    className="flex-1 py-3.5 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    Test Call
                  </button>
                  <button className="flex-1 py-3.5 rounded-xl bg-white text-gray-900 font-medium hover:bg-white/90 transition-all">
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showTestModal && (
        <TestCallModal agent={selectedAgent} onClose={() => setShowTestModal(false)} />
      )}
    </>
  )
}

function TestCallModal({ agent, onClose }: { agent: typeof AGENT_PRESETS[0], onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [callType, setCallType] = useState<'receive' | 'give'>('receive')
  const [phone, setPhone] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const demoNumber = '+1 (555) 012-3456'

  useEffect(() => {
    gsap.fromTo(modalRef.current, 
      { opacity: 0, scale: 0.95 }, 
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
    )
  }, [])

  const handleClose = () => {
    gsap.to(modalRef.current, { opacity: 0, scale: 0.95, duration: 0.2, onComplete: onClose })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!privacyAccepted) return
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div ref={modalRef} className="relative w-full max-w-md glass-card rounded-3xl p-8">
        <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${agent.color}20` }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={agent.color} strokeWidth="2">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </div>
          <h2 className="text-xl font-display text-white">Test {agent.name}</h2>
          <p className="text-white/40 text-sm mt-1">Experience this AI voice agent with a real call</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Call Type */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCallType('receive')}
              className={`p-4 rounded-xl border text-center transition-all ${
                callType === 'receive' ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 3l-6 6m0-6l6 6M3 8l4-4m0 0l4 4M7 4v4m7 4v9l-3-3m3 3l3-3"/>
              </svg>
              <span className="text-sm font-medium">Receive a Call</span>
            </button>
            <button
              type="button"
              onClick={() => setCallType('give')}
              className={`p-4 rounded-xl border text-center transition-all ${
                callType === 'give' ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span className="text-sm font-medium">Make a Call</span>
            </button>
          </div>

          {callType === 'receive' ? (
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Your Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="+1 234 567 8900"
              />
              <p className="text-white/30 text-xs mt-2">We will call you within 30 seconds</p>
            </div>
          ) : (
            <div className="p-5 bg-white/5 rounded-xl text-center">
              <p className="text-white/40 text-sm mb-2">Call this number to test</p>
              <p className="text-white text-2xl font-mono font-semibold">{demoNumber}</p>
            </div>
          )}

          {/* Privacy Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 accent-white"
            />
            <span className="text-white/40 text-sm leading-relaxed">
              I consent to receive AI-generated phone calls for testing purposes and agree to the privacy policy.
            </span>
          </label>

          <button
            type="submit"
            disabled={!privacyAccepted || (callType === 'receive' && !phone)}
            className="w-full py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {callType === 'receive' ? 'Request Test Call' : 'I am Ready to Call'}
          </button>
        </form>
      </div>
    </div>
  )
}
