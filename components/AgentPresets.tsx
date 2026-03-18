'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import Link from 'next/link'

const AGENT_PRESETS = [
  {
    id: 'followup',
    name: 'Follow-Up Agent',
    category: 'Sales',
    color: '#3B82F6',
    description: 'Automatically follow up with leads after initial contact. Schedules callbacks, sends reminders, and nurtures prospects through the sales funnel.',
    sampleText: 'Hi, this is Alex from OPCalls. I wanted to follow up on our conversation yesterday about improving your customer service. Do you have a moment to discuss how our AI agents could help?',
  },
  {
    id: 'appointment',
    name: 'Appointment Setter',
    category: 'Scheduling',
    color: '#10B981',
    description: 'Books appointments seamlessly by checking availability, confirming times, and sending calendar invites. Perfect for service businesses.',
    sampleText: 'Great news! I have availability this Thursday at 2 PM or Friday at 10 AM. Which works better for you? I will send you a calendar invite right away.',
  },
  {
    id: 'noshow',
    name: 'No-Show Recovery',
    category: 'Retention',
    color: '#F59E0B',
    description: 'Reaches out to customers who missed appointments. Reschedules, offers incentives, and helps reduce revenue loss from no-shows.',
    sampleText: 'Hi, we noticed you missed your appointment today. No worries! Would you like to reschedule? I can offer you a 10% discount for your next visit.',
  },
  {
    id: 'hvac',
    name: 'HVAC Support',
    category: 'Home Services',
    color: '#8B5CF6',
    description: 'Handles HVAC service calls, troubleshoots common issues, schedules maintenance visits, and provides emergency support routing.',
    sampleText: 'I understand your AC is not cooling properly. Let me help troubleshoot. First, have you checked if the thermostat is set correctly? If the issue persists, I can schedule a technician visit.',
  },
  {
    id: 'realestate',
    name: 'Real Estate Agent',
    category: 'Real Estate',
    color: '#EC4899',
    description: 'Qualifies buyer and seller leads, schedules property viewings, answers listing questions, and captures contact information.',
    sampleText: 'Thank you for your interest in the property on Oak Street. It is a beautiful 3-bedroom home with a recently renovated kitchen. Would you like to schedule a viewing this weekend?',
  },
  {
    id: 'closer',
    name: 'Closer Agent',
    category: 'Sales',
    color: '#EF4444',
    description: 'Specialized in closing deals. Handles objections, negotiates terms, and guides prospects to make purchasing decisions.',
    sampleText: 'I hear your concerns about the pricing. Let me share how other businesses in your industry have seen a 3x ROI within the first month. What if we started with a pilot program?',
  },
]

const CATEGORIES = ['All', 'Sales', 'Scheduling', 'Retention', 'Home Services', 'Real Estate']

export default function AgentPresets() {
  const [selectedAgent, setSelectedAgent] = useState(AGENT_PRESETS[0])
  const [activeCategory, setActiveCategory] = useState('All')
  const [isPlaying, setIsPlaying] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const filteredAgents = activeCategory === 'All' 
    ? AGENT_PRESETS 
    : AGENT_PRESETS.filter(a => a.category === activeCategory)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      )
    }
  }, [selectedAgent])

  const handlePlay = () => {
    setIsPlaying(true)
    // Simulate audio playing
    setTimeout(() => setIsPlaying(false), 3000)
  }

  return (
    <section ref={sectionRef} className="py-20 dark-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <span className="text-sm text-white/40 uppercase tracking-wider mb-2 block">AI Voice Agents</span>
            <h2 className="text-3xl sm:text-4xl font-display text-white">Choose your agent preset</h2>
          </div>
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-white text-gray-900'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Two columns */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="grid lg:grid-cols-2 min-h-[500px]">
            {/* Left - Agent List */}
            <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="flex items-center justify-between mb-6">
                <span className="text-white/40 text-sm">
                  {filteredAgents.length} agents available
                </span>
                <button className="text-sm text-white/60 hover:text-white flex items-center gap-1 transition-colors">
                  <span>Explore all</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                      selectedAgent.id === agent.id
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${agent.color}20` }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ background: agent.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{agent.name}</p>
                    </div>
                    <span className="text-white/40 text-sm">{agent.category}</span>
                    {selectedAgent.id === agent.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        {isPlaying ? (
                          <div className="w-3 h-3 bg-gray-900 rounded-sm" />
                        ) : (
                          <svg className="w-3 h-3 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right - Agent Preview */}
            <div ref={cardRef} className="p-6 lg:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-white/40">Agent Preview</span>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ background: selectedAgent.color }}
                />
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-display text-white mb-3">{selectedAgent.name}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">{selectedAgent.description}</p>

                {/* Sample Text Card */}
                <div className="bg-white/5 rounded-2xl p-5 mb-6">
                  <p className="text-sm text-white/40 mb-3">Sample conversation:</p>
                  <p className="text-white/80 text-sm leading-relaxed italic">
                    "{selectedAgent.sampleText}"
                  </p>
                </div>

                {/* Waveform Visualization */}
                <div className="flex items-center gap-3 mb-8">
                  <button 
                    onClick={handlePlay}
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
                  >
                    {isPlaying ? (
                      <div className="w-4 h-4 bg-gray-900 rounded-sm" />
                    ) : (
                      <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 flex items-center gap-0.5 h-10">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                        style={{
                          background: selectedAgent.color,
                          height: isPlaying 
                            ? `${Math.random() * 100}%` 
                            : `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 10}%`,
                          opacity: isPlaying ? 1 : 0.4,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={handlePlay}
                  className="flex-1 py-3.5 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Test Agent
                </button>
                <Link 
                  href="/auth/signup"
                  className="flex-1 py-3.5 rounded-xl bg-white text-gray-900 font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                >
                  Get Started
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
