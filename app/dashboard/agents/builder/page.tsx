'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Phone, Mic, Globe, MessageSquare, Zap, Check, Sparkles, 
  ArrowRight, ArrowLeft, Volume2, Play, Settings, Palette,
  Building, Clock, Calendar, Users
} from 'lucide-react'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const industries = [
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', examples: ['Dental', 'Medical Clinic', 'Veterinary'] },
  { id: 'realestate', name: 'Real Estate', icon: '🏠', examples: ['Agents', 'Property Management', 'Mortgage'] },
  { id: 'automotive', name: 'Automotive', icon: '🚗', examples: ['Auto Repair', 'Car Sales', 'Detailing'] },
  { id: 'beauty', name: 'Beauty & Spa', icon: '💅', examples: ['Salon', 'Med Spa', 'Barbershop'] },
  { id: 'legal', name: 'Legal', icon: '⚖️', examples: ['Law Firm', 'Notary', 'Immigration'] },
  { id: 'homeservices', name: 'Home Services', icon: '🔧', examples: ['Plumbing', 'HVAC', 'Electrical'] },
  { id: 'hospitality', name: 'Hospitality', icon: '🏨', examples: ['Restaurant', 'Hotel', 'Events'] },
  { id: 'fitness', name: 'Fitness', icon: '💪', examples: ['Gym', 'Personal Training', 'Yoga Studio'] },
]

const voicePersonalities = [
  { id: 'professional', name: 'Professional Sarah', description: 'Clear, business-focused', preview: '👩‍💼', gender: 'female' },
  { id: 'friendly', name: 'Friendly Mike', description: 'Warm and welcoming', preview: '👨‍🦱', gender: 'male' },
  { id: 'energetic', name: 'Energetic Emma', description: 'Upbeat and positive', preview: '👩‍🦰', gender: 'female' },
  { id: 'calm', name: 'Calm David', description: 'Soothing and patient', preview: '🧔', gender: 'male' },
]

const languages = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
]

const callActions = [
  { id: 'book_appointment', name: 'Book Appointments', icon: Calendar, description: 'Schedule meetings and appointments' },
  { id: 'answer_questions', name: 'Answer Questions', icon: MessageSquare, description: 'Handle FAQs about your business' },
  { id: 'qualify_leads', name: 'Qualify Leads', icon: Users, description: 'Gather info from potential customers' },
  { id: 'take_messages', name: 'Take Messages', icon: Phone, description: 'Record messages for follow-up' },
]

export default function AgentBuilderPage() {
  const router = useRouter()
  const { profile, refreshAgents } = useAuthStore()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  const [config, setConfig] = useState({
    name: '',
    industry: '',
    voice: 'professional',
    languages: ['en-US'],
    actions: ['book_appointment', 'answer_questions'],
    businessHours: '24/7',
    greeting: '',
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Auto-generate greeting based on selections
  useEffect(() => {
    if (config.name && config.industry) {
      const industry = industries.find(i => i.id === config.industry)
      const voice = voicePersonalities.find(v => v.id === config.voice)
      const greeting = `Hi, thank you for calling ${config.name}! This is your AI assistant. How can I help you today?`
      setConfig(prev => ({ ...prev, greeting }))
    }
  }, [config.name, config.industry, config.voice])

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [step])

  const handleCreate = async () => {
    if (!profile?.org_id) {
      toast.error('Please complete onboarding first')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('agents')
      .insert({
        org_id: profile.org_id,
        name: config.name || 'My AI Agent',
        type: 'inbound',
        industry: config.industry,
        primary_language: config.languages[0],
        languages: config.languages,
        is_active: false,
      })

    if (error) {
      toast.error('Failed to create agent')
    } else {
      toast.success('🎉 Your AI agent is ready!')
      await refreshAgents()
      router.push('/dashboard/agents')
    }

    setIsLoading(false)
  }

  const totalSteps = 5

  return (
    <div className="min-h-screen bg-dark py-8 px-4 lg:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
            <Sparkles className="w-4 h-4 text-lime-200" />
            <span className="text-sm text-lime-200 font-medium">No Code Required</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-2">
            Build Your AI Agent
          </h1>
          <p className="text-white/60">
            Create a custom AI receptionist in under 5 minutes
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Step {step + 1} of {totalSteps}</span>
            <span className="text-sm text-lime-200">{Math.round(((step + 1) / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-lime-200 to-lime-300 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Builder */}
          <div className="lg:col-span-3">
            <div 
              ref={containerRef}
              className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8"
            >
              {/* Step 0: Business Info */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                      What's your business name?
                    </h2>
                    <p className="text-white/60">Your AI will greet callers with this name</p>
                  </div>

                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="e.g., Sunshine Dental Group"
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-lime-200/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">Select your industry</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {industries.map((ind) => (
                        <button
                          key={ind.id}
                          onClick={() => setConfig({ ...config, industry: ind.id })}
                          className={`p-4 rounded-xl border text-center transition-all group ${
                            config.industry === ind.id
                              ? 'bg-lime-200/10 border-lime-200/40 scale-105'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-2xl block mb-2">{ind.icon}</span>
                          <span className={`text-sm font-medium ${config.industry === ind.id ? 'text-lime-200' : 'text-white'}`}>
                            {ind.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Voice Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                      Choose your agent's voice
                    </h2>
                    <p className="text-white/60">Pick a personality that matches your brand</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {voicePersonalities.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setConfig({ ...config, voice: voice.id })}
                        className={`p-6 rounded-2xl border text-left transition-all relative group ${
                          config.voice === voice.id
                            ? 'bg-lime-200/10 border-lime-200/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{voice.preview}</div>
                          <div>
                            <div className={`font-medium ${config.voice === voice.id ? 'text-lime-200' : 'text-white'}`}>
                              {voice.name}
                            </div>
                            <div className="text-sm text-white/50">{voice.description}</div>
                          </div>
                        </div>
                        {/* Play Preview Button */}
                        <button 
                          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setIsPreviewPlaying(true); }}
                        >
                          <Play className="w-4 h-4 text-white" />
                        </button>
                        {config.voice === voice.id && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-lime-200 flex items-center justify-center">
                            <Check className="w-4 h-4 text-dark" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Languages */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                      What languages should your agent speak?
                    </h2>
                    <p className="text-white/60">Select all that apply - your agent will auto-detect the caller's language</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          const langs = config.languages.includes(lang.code)
                            ? config.languages.filter(l => l !== lang.code)
                            : [...config.languages, lang.code]
                          setConfig({ ...config, languages: langs.length ? langs : ['en-US'] })
                        }}
                        className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                          config.languages.includes(lang.code)
                            ? 'bg-lime-200/10 border-lime-200/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className={config.languages.includes(lang.code) ? 'text-lime-200' : 'text-white'}>
                          {lang.name}
                        </span>
                        {config.languages.includes(lang.code) && (
                          <Check className="w-4 h-4 text-lime-200 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Actions */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                      What should your agent do?
                    </h2>
                    <p className="text-white/60">Select the actions your AI will handle</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {callActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          const actions = config.actions.includes(action.id)
                            ? config.actions.filter(a => a !== action.id)
                            : [...config.actions, action.id]
                          setConfig({ ...config, actions })
                        }}
                        className={`p-5 rounded-xl border text-left transition-all ${
                          config.actions.includes(action.id)
                            ? 'bg-lime-200/10 border-lime-200/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            config.actions.includes(action.id) ? 'bg-lime-200/20' : 'bg-white/10'
                          }`}>
                            <action.icon className={`w-5 h-5 ${config.actions.includes(action.id) ? 'text-lime-200' : 'text-white/60'}`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium mb-1 ${config.actions.includes(action.id) ? 'text-lime-200' : 'text-white'}`}>
                              {action.name}
                            </div>
                            <div className="text-sm text-white/50">{action.description}</div>
                          </div>
                          {config.actions.includes(action.id) && (
                            <Check className="w-5 h-5 text-lime-200" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Review & Create */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                      Your agent is ready! 🎉
                    </h2>
                    <p className="text-white/60">Review your configuration and launch your AI</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50 mb-1">Business Name</div>
                      <div className="text-white font-medium">{config.name || 'My Business'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50 mb-1">Industry</div>
                      <div className="text-white font-medium capitalize">{config.industry}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50 mb-1">Voice</div>
                      <div className="text-white font-medium capitalize">{voicePersonalities.find(v => v.id === config.voice)?.name}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50 mb-1">Languages</div>
                      <div className="flex flex-wrap gap-2">
                        {config.languages.map(l => (
                          <span key={l} className="px-2 py-1 rounded-lg bg-lime-200/10 text-lime-200 text-sm">
                            {languages.find(lang => lang.code === l)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sample Greeting */}
                  <div className="p-4 rounded-xl bg-lime-200/10 border border-lime-200/20">
                    <div className="flex items-center gap-2 text-lime-200 text-sm mb-2">
                      <Volume2 className="w-4 h-4" />
                      Sample Greeting
                    </div>
                    <p className="text-white/80 italic">"{config.greeting}"</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                {step > 0 ? (
                  <Button variant="ghost" onClick={() => setStep(step - 1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < totalSteps - 1 ? (
                  <Button 
                    onClick={() => setStep(step + 1)}
                    disabled={step === 0 && (!config.name || !config.industry)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handleCreate} isLoading={isLoading} rightIcon={<Zap className="w-4 h-4" />}>
                    Create My Agent
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <div 
              ref={previewRef}
              className="sticky top-8 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-white/40 ml-2">Live Preview</span>
              </div>

              {/* Phone Preview */}
              <div className="relative bg-dark rounded-[2rem] p-3 border-4 border-white/10 mx-auto max-w-[280px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-dark rounded-b-2xl" />
                
                <div className="bg-gradient-to-b from-dark-50 to-dark rounded-[1.5rem] p-4 min-h-[400px]">
                  {/* Call Screen */}
                  <div className="text-center pt-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-lime-200 to-olive flex items-center justify-center text-3xl mb-4">
                      {industries.find(i => i.id === config.industry)?.icon || '🤖'}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {config.name || 'Your Business'}
                    </h3>
                    <p className="text-sm text-lime-200 mb-6">AI Assistant</p>

                    {/* Waveform */}
                    <div className="flex items-center justify-center gap-1 h-8 mb-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-lime-200/60 rounded-full animate-pulse"
                          style={{ 
                            height: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.15}s`
                          }}
                        />
                      ))}
                    </div>

                    {/* Greeting Bubble */}
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3 text-left mb-4">
                      <p className="text-sm text-white/80">
                        {config.greeting || "Hi, thank you for calling! How can I help you today?"}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {config.actions.slice(0, 2).map(actionId => {
                        const action = callActions.find(a => a.id === actionId)
                        return action ? (
                          <span key={actionId} className="px-3 py-1.5 rounded-full bg-lime-200/10 text-lime-200 text-xs">
                            {action.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-lime-200" />
                  <span className="text-white/70">24/7 Availability</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-lime-200" />
                  <span className="text-white/70">{config.languages.length} Language{config.languages.length > 1 ? 's' : ''} Supported</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-lime-200" />
                  <span className="text-white/70">{config.actions.length} Automated Actions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
