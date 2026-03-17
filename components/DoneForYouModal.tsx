'use client'

import { useState, useEffect } from 'react'
import { X, Check, Loader2, ArrowRight, Building2, Phone, Globe, Clock } from 'lucide-react'

interface DoneForYouModalProps {
  isOpen: boolean
  onClose: () => void
}

const AGENT_TYPES = [
  { id: 'receptionist', label: 'AI Receptionist', desc: 'Answer calls, take messages' },
  { id: 'booking', label: 'Appointment Booking', desc: 'Schedule & manage bookings' },
  { id: 'support', label: 'Customer Support', desc: 'Handle inquiries & FAQs' },
  { id: 'sales', label: 'Lead Qualification', desc: 'Qualify & route leads' },
]

const INDUSTRIES = [
  'Dental / Medical', 'Legal', 'Real Estate', 'Home Services', 
  'Salon / Spa', 'Restaurant', 'Auto Service', 'Other'
]

export default function DoneForYouModal({ isOpen, onClose }: DoneForYouModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    industry: '',
    agentType: 'receptionist',
    country: 'United States',
    timezone: 'America/New_York',
    workingHours: '9 AM - 6 PM',
    language: 'English',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      // Reset after close animation
      setTimeout(() => {
        setStep(1)
        setSuccess(false)
        setError('')
      }, 300)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/done-for-you', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone,
          business_name: formData.businessName,
          agent_type: formData.agentType,
          country: formData.country,
          working_hours: formData.workingHours,
          language: formData.language,
          notes: `Industry: ${formData.industry}. ${formData.notes}`,
        }),
      })
      
      if (res.ok) {
        setSuccess(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return formData.name && formData.email && formData.businessName
    if (step === 2) return formData.industry && formData.agentType
    return true
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#141414] to-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-80 h-80 bg-lime-200/20 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8 sm:p-10">
          {success ? (
            /* Success State */
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-lime-200/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-lime-200" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">
                You're All Set!
              </h3>
              <p className="text-white/60 mb-8 max-w-sm mx-auto">
                Our team will review your request and contact you within 24 hours to start building your AI agent.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-lime-200 text-dark font-semibold rounded-xl hover:bg-lime-300 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                  <span className="w-2 h-2 rounded-full bg-lime-200 animate-pulse" />
                  <span className="text-xs text-lime-200 font-medium">Done-For-You Service</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
                  Get Your AI Agent Built
                </h2>
                <p className="text-white/50">
                  Tell us about your business • We build it in 48 hours
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      s <= step ? 'bg-lime-200' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>

              {/* Step 1: Contact Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Your Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-lime-200/50 focus:outline-none focus:ring-2 focus:ring-lime-200/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@company.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-lime-200/50 focus:outline-none focus:ring-2 focus:ring-lime-200/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Business Name *</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          placeholder="Acme Dental"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-lime-200/50 focus:outline-none focus:ring-2 focus:ring-lime-200/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-lime-200/50 focus:outline-none focus:ring-2 focus:ring-lime-200/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-3">Industry *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INDUSTRIES.map((ind) => (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => setFormData({ ...formData, industry: ind })}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            formData.industry === ind
                              ? 'bg-lime-200 text-dark'
                              : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-3">Agent Type *</label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {AGENT_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, agentType: type.id })}
                          className={`p-4 rounded-xl text-left transition-all ${
                            formData.agentType === type.id
                              ? 'bg-lime-200/10 border-2 border-lime-200'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className={`font-medium ${formData.agentType === type.id ? 'text-lime-200' : 'text-white'}`}>
                            {type.label}
                          </div>
                          <div className="text-xs text-white/50 mt-1">{type.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Preferences */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Country</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <select
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-lime-200/50 focus:outline-none appearance-none"
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Business Hours</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={formData.workingHours}
                          onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                          placeholder="Mon-Fri 9AM-6PM"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-lime-200/50 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-lime-200/50 focus:outline-none appearance-none"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Portuguese">Portuguese</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Anything else we should know?</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special requirements, integrations needed, etc."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-lime-200/50 focus:outline-none resize-none transition-all"
                    />
                  </div>
                  
                  {/* Pricing note */}
                  <div className="p-4 rounded-xl bg-lime-200/5 border border-lime-200/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-lime-200/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">💎</span>
                      </div>
                      <div>
                        <div className="font-medium text-white">Done-For-You Setup — $299</div>
                        <div className="text-sm text-white/50 mt-1">
                          We handle everything: custom AI training, number setup, integrations, and go-live support.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 text-white/70 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-lime-200 text-dark font-semibold rounded-xl hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-lime-200 text-dark font-semibold rounded-xl hover:bg-lime-300 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
