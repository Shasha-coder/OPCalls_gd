/**
 * OPCalls Onboarding Wizard - Clean Design
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useProvisioning } from '@/hooks/useProvisioning'
import { BusinessInfoStep } from './steps/BusinessInfoStep'
import { BusinessHoursStep } from './steps/BusinessHoursStep'
import { AgentConfigStep } from './steps/AgentConfigStep'
import { PhoneNumberStep } from './steps/PhoneNumberStep'
import { ReviewStep } from './steps/ReviewStep'
import { ProvisioningStep } from './steps/ProvisioningStep'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface OnboardingData {
  businessInfo?: {
    name: string
    industry: string
    industryOther?: string
    phone?: string
    address?: string
    website?: string
    timezone?: string
  }
  businessHours?: Record<string, { open: string; close: string; enabled: boolean }>
  agentConfig?: {
    name: string
    type: string
    voiceId: string
    customInstructions?: string
  }
  phoneConfig?: {
    areaCode?: string
    type: 'local' | 'toll_free'
    selectedNumber?: string
  }
}

const STEPS = [
  { id: 1, name: 'businessInfo', title: 'Business Info', description: 'Tell us about your business' },
  { id: 2, name: 'businessHours', title: 'Business Hours', description: 'Set your availability' },
  { id: 3, name: 'agentConfig', title: 'AI Agent', description: 'Configure your assistant' },
  { id: 4, name: 'phoneConfig', title: 'Phone Number', description: 'Choose your number' },
  { id: 5, name: 'review', title: 'Review', description: 'Confirm your setup' },
  { id: 6, name: 'provisioning', title: 'Setup', description: 'Creating your agent' },
]

// ============================================================================
// Onboarding Wizard
// ============================================================================

export function OnboardingWizard() {
  const router = useRouter()
  const {
    onboardingState,
    onboardingLoading,
    onboardingSaving,
    updateOnboardingStep,
    startOnboardingProvisioning,
    checkProvisioningStatus,
  } = useProvisioning()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({})
  const [jobId, setJobId] = useState<string | null>(null)
  
  // Initialize from saved state
  useEffect(() => {
    if (onboardingState) {
      setCurrentStep(onboardingState.currentStep)
      setData(onboardingState.stepData)
      if (onboardingState.provisioningJobId) {
        setJobId(onboardingState.provisioningJobId)
      }
      
      if (onboardingState.status === 'completed') {
        router.push('/dashboard')
      }
    }
  }, [onboardingState, router])
  
  const handleStepComplete = async (stepName: string, stepData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...stepData }))
    // Always advance the step first for smooth UX, then save in background
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    // Save in background - don't block navigation
    updateOnboardingStep(currentStep, stepName, stepData).catch(console.error)
  }
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }
  
  const [provisioningError, setProvisioningError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  
  const handleStartProvisioning = async () => {
    setProvisioningError(null)
    setIsStarting(true)
    
    try {
      const newJobId = await startOnboardingProvisioning()
      
      if (newJobId) {
        setJobId(newJobId)
        setCurrentStep(6)
      } else {
        // If no jobId but also no error, go to dashboard
        router.push('/dashboard?welcome=true')
      }
    } catch (err) {
      setProvisioningError(err instanceof Error ? err.message : 'Failed to start setup')
    } finally {
      setIsStarting(false)
    }
  }
  
  const handleProvisioningComplete = () => {
    router.push('/dashboard?welcome=true')
  }
  
  if (onboardingLoading) {
    return (
      <div className="min-h-screen dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/favicon.png"
              alt="OPCalls"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-white text-lg">OPCalls</span>
          </Link>
          
          {/* Step indicator */}
          <div className="hidden md:flex items-center gap-1">
            {STEPS.slice(0, -1).map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id >= currentStep}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                    step.id < currentStep 
                      ? "bg-white text-black cursor-pointer hover:bg-white/90"
                      : step.id === currentStep
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/40"
                  )}
                >
                  {step.id < currentStep ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </button>
                {index < STEPS.length - 2 && (
                  <div className={cn(
                    "w-8 h-px mx-1",
                    step.id < currentStep ? "bg-white" : "bg-white/10"
                  )} />
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile step indicator */}
          <div className="md:hidden text-sm text-white/50">
            Step {currentStep} of {STEPS.length - 1}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        {/* Step Header */}
        <div className="mb-8 md:mb-12">
          <p className="text-white/50 text-sm font-medium mb-2">
            {STEPS[currentStep - 1]?.description}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
            {STEPS[currentStep - 1]?.title}
          </h1>
        </div>
        
        {/* Step Content */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          {currentStep === 1 && (
            <BusinessInfoStep
              data={data.businessInfo}
              onComplete={(businessInfo) => handleStepComplete('businessInfo', { businessInfo })}
              saving={onboardingSaving}
            />
          )}
          
          {currentStep === 2 && (
            <BusinessHoursStep
              data={data.businessHours}
              onComplete={(businessHours) => handleStepComplete('businessHours', { businessHours })}
              onBack={handleBack}
              saving={onboardingSaving}
            />
          )}
          
          {currentStep === 3 && (
            <AgentConfigStep
              data={data.agentConfig}
              businessName={data.businessInfo?.name}
              industry={data.businessInfo?.industry}
              onComplete={(agentConfig) => handleStepComplete('agentConfig', { agentConfig })}
              onBack={handleBack}
              saving={onboardingSaving}
            />
          )}
          
          {currentStep === 4 && (
            <PhoneNumberStep
              data={data.phoneConfig}
              onComplete={(phoneConfig) => handleStepComplete('phoneConfig', { phoneConfig })}
              onBack={handleBack}
              saving={onboardingSaving}
            />
          )}
          
          {currentStep === 5 && (
            <ReviewStep
              data={data}
              onConfirm={handleStartProvisioning}
              onBack={handleBack}
              saving={isStarting}
              error={provisioningError}
            />
          )}
          
          {currentStep === 6 && (
            <ProvisioningStep
              jobId={jobId}
              onComplete={handleProvisioningComplete}
              checkStatus={checkProvisioningStatus}
            />
          )}
        </div>
        
        {/* Help text */}
        <p className="mt-6 text-center text-sm text-white/40">
          Need help? <a href="mailto:support@opcalls.com" className="text-white/70 hover:text-white transition-colors">Contact support</a>
        </p>
      </main>
    </div>
  )
}
