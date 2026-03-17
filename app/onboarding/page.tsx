'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Phone, Building, Users, MessageSquare, Mic, ArrowRight, ArrowLeft, 
  Check, Sparkles, Zap, Clock, Globe 
} from 'lucide-react'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const steps = [
  { id: 'business', title: 'Your Business', icon: Building },
  { id: 'calls', title: 'Call Volume', icon: Phone },
  { id: 'pain', title: 'Challenges', icon: MessageSquare },
  { id: 'voice', title: 'Voice Style', icon: Mic },
]

const callVolumes = [
  { value: 'less-10', label: 'Less than 10', icon: '📞' },
  { value: '10-30', label: '10 - 30', icon: '📱' },
  { value: '30-50', label: '30 - 50', icon: '☎️' },
  { value: '50-plus', label: '50+', icon: '🔥' },
]

const painPoints = [
  { value: 'missed-calls', label: 'Missing calls with no jobs', icon: '😰' },
  { value: 'after-hours', label: 'No after hours coverage', icon: '🌙' },
  { value: 'language', label: 'Language barrier with clients', icon: '🌍' },
  { value: 'reception-cost', label: 'Paying too much for receptionist', icon: '💸' },
  { value: 'all', label: 'All of the above', icon: '🤯' },
]

const voiceStyles = [
  { value: 'professional', label: 'Professional', description: 'Clear, business-like tone', icon: '👔' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable', icon: '😊' },
  { value: 'energetic', label: 'Energetic', description: 'Upbeat and enthusiastic', icon: '⚡' },
  { value: 'calm', label: 'Calm', description: 'Soothing and reassuring', icon: '🧘' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    callVolume: '',
    painPoint: '',
    voiceStyle: '',
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate step transition
    if (stepRef.current) {
      gsap.fromTo(
        stepRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [currentStep])

  useEffect(() => {
    // Initial animation
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
      )

      gsap.fromTo(
        '.progress-dot',
        { scale: 0 },
        { scale: 1, duration: 0.4, stagger: 0.1, delay: 0.3, ease: 'back.out(2)' }
      )
    })

    return () => ctx.revert()
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      gsap.to(stepRef.current, {
        opacity: 0,
        x: -30,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => setCurrentStep(currentStep + 1),
      })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      gsap.to(stepRef.current, {
        opacity: 0,
        x: 30,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => setCurrentStep(currentStep - 1),
      })
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Update profile with onboarding data
        await supabase
          .from('profiles')
          .update({
            onboarding_complete: true,
          })
          .eq('id', user.id)

        // Create or get organization
        let orgId = null
        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', user.id)
          .single()

        if (!profile?.org_id) {
          // Create new organization
          const { data: newOrg } = await supabase
            .from('organizations')
            .insert({
              name: formData.businessName || 'My Organization',
              subscription_tier: 'free',
            })
            .select()
            .single()

          if (newOrg) {
            orgId = newOrg.id
            await supabase
              .from('profiles')
              .update({ org_id: orgId })
              .eq('id', user.id)
          }
        } else {
          orgId = profile.org_id
        }

        // Create first AI agent
        if (orgId) {
          await supabase
            .from('agents')
            .insert({
              org_id: orgId,
              name: `${formData.businessName || 'My'} AI Assistant`,
              type: 'inbound',
              industry: formData.businessType || 'general',
              is_active: false,
              primary_language: 'en-US',
              languages: ['en-US'],
            })
        }

        toast.success('Welcome to OPCalls! 🎉')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.businessName.length > 0
      case 1: return formData.callVolume !== ''
      case 2: return formData.painPoint !== ''
      case 3: return formData.voiceStyle !== ''
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-lime-200/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-olive/15 rounded-full blur-[100px]" />

      <div ref={containerRef} className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`progress-dot w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-lime-200 text-dark'
                    : index === currentStep
                    ? 'bg-gradient-to-br from-lime-200 to-olive text-dark'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                  index < currentStep ? 'bg-lime-200' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div
          ref={stepRef}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12"
        >
          {/* Step 1: Business Info */}
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                  <Sparkles className="w-4 h-4 text-lime-200" />
                  <span className="text-sm text-lime-200 font-medium">Step 1 of 4</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  Tell us about your business
                </h2>
                <p className="text-white/60">
                  We'll customize your AI agent based on your industry
                </p>
              </div>

              <div className="space-y-6">
                <Input
                  label="Business Name"
                  placeholder="e.g., Sunshine Dental Group"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  leftIcon={<Building className="w-5 h-5" />}
                />

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Industry / Business Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Healthcare', 'Real Estate', 'Legal', 'Home Services', 'Automotive', 'Other'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, businessType: type.toLowerCase() })}
                        className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                          formData.businessType === type.toLowerCase()
                            ? 'bg-lime-200/10 border-lime-200/40 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Call Volume */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                  <Phone className="w-4 h-4 text-lime-200" />
                  <span className="text-sm text-lime-200 font-medium">Step 2 of 4</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  How many calls per day?
                </h2>
                <p className="text-white/60">
                  This helps us recommend the right plan for you
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {callVolumes.map((volume) => (
                  <button
                    key={volume.value}
                    onClick={() => setFormData({ ...formData, callVolume: volume.value })}
                    className={`p-6 rounded-2xl border text-center transition-all duration-300 group ${
                      formData.callVolume === volume.value
                        ? 'bg-lime-200/10 border-lime-200/40 scale-105'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-102'
                    }`}
                  >
                    <span className="text-3xl mb-3 block">{volume.icon}</span>
                    <span className={`font-medium ${
                      formData.callVolume === volume.value ? 'text-lime-200' : 'text-white'
                    }`}>
                      {volume.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Pain Points */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                  <MessageSquare className="w-4 h-4 text-lime-200" />
                  <span className="text-sm text-lime-200 font-medium">Step 3 of 4</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  What's your biggest challenge?
                </h2>
                <p className="text-white/60">
                  Select the issue that affects your business the most
                </p>
              </div>

              <div className="space-y-3">
                {painPoints.map((pain) => (
                  <button
                    key={pain.value}
                    onClick={() => setFormData({ ...formData, painPoint: pain.value })}
                    className={`w-full p-5 rounded-xl border text-left transition-all duration-300 flex items-center gap-4 ${
                      formData.painPoint === pain.value
                        ? 'bg-lime-200/10 border-lime-200/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{pain.icon}</span>
                    <span className={`font-medium ${
                      formData.painPoint === pain.value ? 'text-lime-200' : 'text-white'
                    }`}>
                      {pain.label}
                    </span>
                    {formData.painPoint === pain.value && (
                      <Check className="w-5 h-5 text-lime-200 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Voice Style */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-200/10 border border-lime-200/20 mb-4">
                  <Mic className="w-4 h-4 text-lime-200" />
                  <span className="text-sm text-lime-200 font-medium">Final Step</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  Choose your agent's voice
                </h2>
                <p className="text-white/60">
                  Pick a tone that matches your brand
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {voiceStyles.map((voice) => (
                  <button
                    key={voice.value}
                    onClick={() => setFormData({ ...formData, voiceStyle: voice.value })}
                    className={`p-6 rounded-2xl border text-center transition-all duration-300 ${
                      formData.voiceStyle === voice.value
                        ? 'bg-lime-200/10 border-lime-200/40 scale-105'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-3xl mb-3 block">{voice.icon}</span>
                    <span className={`font-medium block mb-1 ${
                      formData.voiceStyle === voice.value ? 'text-lime-200' : 'text-white'
                    }`}>
                      {voice.label}
                    </span>
                    <span className="text-xs text-white/50">{voice.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed()}
                isLoading={isLoading}
                rightIcon={<Zap className="w-4 h-4" />}
              >
                Launch My Agent
              </Button>
            )}
          </div>
        </div>

        {/* Skip option */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  )
}
