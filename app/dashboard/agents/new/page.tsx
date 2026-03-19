'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, MicIcon, GlobeIcon, PhoneIcon, PhoneInboundIcon, PhoneOutboundIcon, SmsIcon, SparklesIcon, BuildingIcon, CheckIcon, VoiceProfessionalIcon, VoiceFriendlyIcon, VoiceEnergeticIcon, VoiceCalmIcon } from '@/components/ui/Icons'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import Link from 'next/link'

const voiceOptions = [
  { id: 'professional', name: 'Professional', description: 'Clear, business-like tone', Icon: VoiceProfessionalIcon },
  { id: 'friendly',     name: 'Friendly',     description: 'Warm and approachable',    Icon: VoiceFriendlyIcon },
  { id: 'energetic',    name: 'Energetic',    description: 'Upbeat and enthusiastic',  Icon: VoiceEnergeticIcon },
  { id: 'calm',         name: 'Calm',         description: 'Soothing and reassuring',  Icon: VoiceCalmIcon },
]

const industryOptions = [
  'Healthcare', 'Real Estate', 'Legal', 'Home Services', 
  'Automotive', 'Hospitality', 'Retail', 'Other'
]

const languageOptions = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'pt-BR', name: 'Portuguese' },
]

export default function NewAgentPage() {
  const router = useRouter()
  const { profile, refreshAgents } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  
  const [formData, setFormData] = useState({
    name: '',
    agentType: 'receptionist' as 'receptionist' | 'booking' | 'followup' | 'support' | 'afterhours' | 'missed_call',
    industry: '',
    voice: 'professional',
    primaryLanguage: 'en-US',
    languages: ['en-US'],
    greeting: '',
  })

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
  }, [step])

  const handleCreate = async () => {
    if (!profile?.org_id) {
      toast.error('Please complete onboarding first')
      router.push('/onboarding')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('agents')
      .insert({
        org_id: profile.org_id,
        name: formData.name,
        type: formData.agentType,
        // Unified agent: supports all channels (inbound, outbound, sms)
        capabilities: ['inbound', 'outbound', 'sms'],
        industry: formData.industry.toLowerCase(),
        primary_language: formData.primaryLanguage,
        languages: formData.languages,
        is_active: false,
      })

    if (error) {
      toast.error('Failed to create agent')
      console.error(error)
    } else {
      toast.success('Agent created successfully! 🎉')
      await refreshAgents()
      router.push('/dashboard/agents')
    }

    setIsLoading(false)
  }

  const canProceed = () => {
    switch (step) {
      case 0: return formData.name.length > 0
      case 1: return formData.industry !== ''
      case 2: return formData.voice !== ''
      default: return true
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard/agents"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeftIcon />
        Back to Agents
      </Link>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              s <= step ? 'bg-[#e7f69e]' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div ref={containerRef}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#262720] border border-[#474b37] mb-4">
                <MicIcon className="w-4 h-4 text-[#e7f69e]" />
                <span className="text-sm text-[#e7f69e] font-medium">Step 3 of 4</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Let's name your agent
              </h1>
              <p className="text-white/60">
                Give your AI agent a memorable name
              </p>
            </div>

            <Input
              label="Agent Name"
              placeholder="e.g., Sarah - Customer Support"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              leftIcon={<PhoneIcon className="w-5 h-5" />}
            />

            {/* Capabilities badge - unified agent */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/60 mb-3">Your agent will be able to:</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#262720] border border-[#474b37] text-[#e7f69e] text-xs font-medium">
                  <PhoneInboundIcon className="w-3 h-3" /> Receive Calls
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#262720] border border-[#474b37] text-[#e7f69e] text-xs font-medium">
                  <PhoneOutboundIcon className="w-3 h-3" /> Make Calls
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#262720] border border-[#474b37] text-[#e7f69e] text-xs font-medium">
                  <SmsIcon className="w-3 h-3" /> Handle SMS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Industry */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
                <BuildingIcon />
                <span className="text-sm text-white/60 font-medium">Step 2 of 4</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                What industry are you in?
              </h1>
              <p className="text-white/60">
                We'll optimize your agent for your specific needs
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {industryOptions.map((industry) => (
                <button
                  key={industry}
                  onClick={() => setFormData({ ...formData, industry })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.industry === industry
                      ? 'bg-[#262720] border-[#474b37]'
                      : 'bg-[#262720] border-[#3a3d32] hover:border-[#474b37]'
                  }`}
                >
                  <span className={formData.industry === industry ? 'text-[#e7f69e]' : 'text-white/60'}>
                    {industry}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Voice */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
                <MicIcon />
                <span className="text-sm text-white/60 font-medium">Step 3 of 4</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Choose a voice style
              </h1>
              <p className="text-white/60">
                Pick a tone that matches your brand
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {voiceOptions.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setFormData({ ...formData, voice: voice.id })}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    formData.voice === voice.id
                      ? 'bg-[#262720] border-[#474b37] scale-105'
                      : 'bg-[#262720] border-[#3a3d32] hover:border-[#474b37]'
                  }`}
                >
                  <div className={`flex justify-center mb-3 ${formData.voice === voice.id ? 'text-[#e7f69e]' : 'text-white/40'}`}>
                    <voice.Icon className="w-7 h-7" />
                  </div>
                  <span className={`font-medium block mb-1 ${
                    formData.voice === voice.id ? 'text-white' : 'text-white/60'
                  }`}>
                    {voice.name}
                  </span>
                  <span className="text-xs text-white/50">{voice.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Language */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#262720] border border-[#474b37] mb-4">
                <GlobeIcon className="w-4 h-4 text-[#e7f69e]" />
                <span className="text-sm text-[#e7f69e] font-medium">Final Step</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Select languages
              </h1>
              <p className="text-white/60">
                Your agent can speak multiple languages
              </p>
            </div>

            <div className="space-y-3">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    const langs = formData.languages.includes(lang.code)
                      ? formData.languages.filter(l => l !== lang.code)
                      : [...formData.languages, lang.code]
                    setFormData({ 
                      ...formData, 
                      languages: langs,
                      primaryLanguage: langs[0] || 'en-US'
                    })
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                    formData.languages.includes(lang.code)
                      ? 'bg-[#262720] border-[#474b37]'
                      : 'bg-[#262720] border-[#3a3d32] hover:border-[#474b37]'
                  }`}
                >
                  <span className={formData.languages.includes(lang.code) ? 'text-[#e7f69e]' : 'text-white/60'}>
                    {lang.name}
                  </span>
                  {formData.languages.includes(lang.code) && (
                    <CheckIcon className="w-5 h-5 text-[#e7f69e]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleCreate} isLoading={isLoading}>
              Create Agent
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
