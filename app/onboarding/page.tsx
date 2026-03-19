'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { 
  BuildingIcon, PhoneIcon, MicIcon, SmsIcon, SparklesIcon, 
  CheckIcon, ArrowLeftIcon, ArrowRightIcon, GlobeIcon,
  CallLowIcon, CallMediumIcon, CallHighIcon, CallMaxIcon,
  VoiceProfessionalIcon, VoiceFriendlyIcon, VoiceEnergeticIcon, VoiceCalmIcon
} from '@/components/ui/Icons'

const steps = [
  { id: 'business', title: 'Your Business', Icon: BuildingIcon },
  { id: 'calls', title: 'Call Volume', Icon: PhoneIcon },
  { id: 'pain', title: 'Challenges', Icon: SmsIcon },
  { id: 'voice', title: 'Voice Style', Icon: MicIcon },
]

const callVolumes = [
  { value: 'less-10', label: 'Less than 10', Icon: CallLowIcon },
  { value: '10-30', label: '10 - 30', Icon: CallMediumIcon },
  { value: '30-50', label: '30 - 50', Icon: CallHighIcon },
  { value: '50-plus', label: '50+', Icon: CallMaxIcon },
]

// Pain point icons as inline components for variety
const MissedCallsIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.47 11.47 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.47 11.47 0 0 0 .57 3.6 1 1 0 0 1-.25 1.01l-2.2 2.18z"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const MoonIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
  </svg>
)

const LanguageIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
)

const CostIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const AllIssuesIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const painPoints = [
  { value: 'missed-calls', label: 'Missing calls with no jobs', Icon: MissedCallsIcon },
  { value: 'after-hours', label: 'No after hours coverage', Icon: MoonIcon },
  { value: 'language', label: 'Language barrier with clients', Icon: LanguageIcon },
  { value: 'reception-cost', label: 'Paying too much for receptionist', Icon: CostIcon },
  { value: 'all', label: 'All of the above', Icon: AllIssuesIcon },
]

const voiceStyles = [
  { value: 'professional', label: 'Professional', description: 'Clear, business-like tone', Icon: VoiceProfessionalIcon },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable', Icon: VoiceFriendlyIcon },
  { value: 'energetic', label: 'Energetic', description: 'Upbeat and enthusiastic', Icon: VoiceEnergeticIcon },
  { value: 'calm', label: 'Calm', description: 'Soothing and reassuring', Icon: VoiceCalmIcon },
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
                    ? 'bg-[#e7f69e] text-[#1a1b18]'
                    : index === currentStep
                    ? 'bg-[#262720] border border-[#474b37] text-[#e7f69e]'
                    : 'bg-[#262720] border border-[#3a3d32] text-white/40'
                }`}
              >
                {index < currentStep ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <step.Icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                  index < currentStep ? 'bg-[#e7f69e]' : 'bg-[#3a3d32]'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div
          ref={stepRef}
          className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-[#474b37] rounded-3xl p-8 md:p-12"
        >
          {/* Step 1: Business Info */}
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#262720] border border-[#474b37] mb-4">
                  <SparklesIcon className="w-4 h-4 text-[#e7f69e]" />
                  <span className="text-sm text-[#e7f69e] font-medium">Step 1 of 4</span>
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
                  leftIcon={<BuildingIcon className="w-5 h-5" />}
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
                            ? 'bg-[#262720] border-[#474b37] text-[#e7f69e]'
                            : 'bg-[#262720] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#262720] border border-[#474b37] mb-4">
                  <PhoneIcon className="w-4 h-4 text-[#e7f69e]" />
                  <span className="text-sm text-[#e7f69e] font-medium">Step 2 of 4</span>
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
                        ? 'bg-[#262720] border-[#474b37] scale-105'
                        : 'bg-[#262720] border-[#3a3d32] hover:border-[#474b37]'
                    }`}
                  >
                    <div className={`flex justify-center mb-3 ${formData.callVolume === volume.value ? 'text-[#e7f69e]' : 'text-white/40'}`}>
                      <volume.Icon className="w-8 h-8" />
                    </div>
                    <span className={`font-medium ${
                      formData.callVolume === volume.value ? 'text-[#e7f69e]' : 'text-white'
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#262720] border border-[#474b37] mb-4">
                  <SmsIcon className="w-4 h-4 text-[#e7f69e]" />
                  <span className="text-sm text-[#e7f69e] font-medium">Step 3 of 4</span>
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
                        ? 'bg-[#262720] border-[#474b37]'
                        : 'bg-[#262720] border-[#3a3d32] hover:border-[#474b37]'
                    }`}
                  >
                    <div className={formData.painPoint === pain.value ? 'text-[#e7f69e]' : 'text-white/40'}>
                      <pain.Icon className="w-6 h-6" />
                    </div>
                    <span className={`font-medium ${
                      formData.painPoint === pain.value ? 'text-[#e7f69e]' : 'text-white'
                    }`}>
                      {pain.label}
                    </span>
                    {formData.painPoint === pain.value && (
                      <CheckIcon className="w-5 h-5 text-[#e7f69e] ml-auto" />
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#262720] border border-[#474b37] mb-4">
                  <MicIcon className="w-4 h-4 text-[#e7f69e]" />
                  <span className="text-sm text-[#e7f69e] font-medium">Final Step</span>
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
                        ? 'bg-[#262720] border-[#474b37] scale-105'
                        : 'bg-[#262720] border-[#3a3d32] hover:border-[#474b37]'
                    }`}
                  >
                    <div className={`flex justify-center mb-3 ${formData.voiceStyle === voice.value ? 'text-[#e7f69e]' : 'text-white/40'}`}>
                      <voice.Icon className="w-8 h-8" />
                    </div>
                    <span className={`font-medium block mb-1 ${
                      formData.voiceStyle === voice.value ? 'text-[#e7f69e]' : 'text-white'
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
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#3a3d32]">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeftIcon />}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<ArrowRightIcon />}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed()}
                isLoading={isLoading}
                rightIcon={<SparklesIcon />}
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
