'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, Globe, Phone, Zap, Check, Sparkles } from 'lucide-react'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import Link from 'next/link'

const voiceOptions = [
  { id: 'professional', name: 'Professional', description: 'Clear, business-like tone', icon: '👔' },
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable', icon: '😊' },
  { id: 'energetic', name: 'Energetic', description: 'Upbeat and enthusiastic', icon: '⚡' },
  { id: 'calm', name: 'Calm', description: 'Soothing and reassuring', icon: '🧘' },
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
    type: 'inbound' as 'inbound' | 'outbound',
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
      toast.error('Organization not found')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('agents')
      .insert({
        org_id: profile.org_id,
        name: formData.name,
        type: formData.type,
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
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Link>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              s <= step ? 'bg-lime-200' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div ref={containerRef}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                <Sparkles className="w-4 h-4 text-lime-200" />
                <span className="text-sm text-lime-200 font-medium">Step 1 of 4</span>
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
              leftIcon={<Phone className="w-5 h-5" />}
            />

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Agent Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['inbound', 'outbound'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, type: type as any })}
                    className={`p-5 rounded-xl border text-left transition-all ${
                      formData.type === type
                        ? 'bg-lime-200/10 border-lime-200/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`text-lg font-medium capitalize ${
                      formData.type === type ? 'text-lime-200' : 'text-white'
                    }`}>
                      {type}
                    </div>
                    <div className="text-sm text-white/50 mt-1">
                      {type === 'inbound' ? 'Answer incoming calls' : 'Make outbound calls'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Industry */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                <Zap className="w-4 h-4 text-lime-200" />
                <span className="text-sm text-lime-200 font-medium">Step 2 of 4</span>
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
                      ? 'bg-lime-200/10 border-lime-200/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className={formData.industry === industry ? 'text-lime-200' : 'text-white'}>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                <Mic className="w-4 h-4 text-lime-200" />
                <span className="text-sm text-lime-200 font-medium">Step 3 of 4</span>
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
                      ? 'bg-lime-200/10 border-lime-200/40 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl mb-3 block">{voice.icon}</span>
                  <span className={`font-medium block mb-1 ${
                    formData.voice === voice.id ? 'text-lime-200' : 'text-white'
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                <Globe className="w-4 h-4 text-lime-200" />
                <span className="text-sm text-lime-200 font-medium">Final Step</span>
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
                      ? 'bg-lime-200/10 border-lime-200/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className={formData.languages.includes(lang.code) ? 'text-lime-200' : 'text-white'}>
                    {lang.name}
                  </span>
                  {formData.languages.includes(lang.code) && (
                    <Check className="w-5 h-5 text-lime-200" />
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
