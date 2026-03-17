/**
 * OPCALLS Phase 6: Onboarding Wizard
 * 
 * Main onboarding wizard component
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProvisioning, useProvisioningProgress } from '@/hooks/useProvisioning'
import { BusinessInfoStep } from './steps/BusinessInfoStep'
import { BusinessHoursStep } from './steps/BusinessHoursStep'
import { AgentConfigStep } from './steps/AgentConfigStep'
import { PhoneNumberStep } from './steps/PhoneNumberStep'
import { ReviewStep } from './steps/ReviewStep'
import { ProvisioningStep } from './steps/ProvisioningStep'

// ============================================================================
// Types
// ============================================================================

export interface OnboardingData {
  businessInfo?: {
    name: string
    industry: string
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
  { id: 1, name: 'businessInfo', title: 'Business Info' },
  { id: 2, name: 'businessHours', title: 'Business Hours' },
  { id: 3, name: 'agentConfig', title: 'AI Agent' },
  { id: 4, name: 'phoneConfig', title: 'Phone Number' },
  { id: 5, name: 'review', title: 'Review' },
  { id: 6, name: 'provisioning', title: 'Setup' },
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
      
      // If already completed, redirect to dashboard
      if (onboardingState.status === 'completed') {
        router.push('/dashboard')
      }
    }
  }, [onboardingState, router])
  
  // Handle step completion
  const handleStepComplete = async (stepName: string, stepData: Partial<OnboardingData>) => {
    // Update local data
    setData(prev => ({ ...prev, ...stepData }))
    
    // Save to server
    const success = await updateOnboardingStep(currentStep, stepName, stepData)
    
    if (success) {
      // Move to next step
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }
  
  // Handle going back
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }
  
  // Start provisioning
  const handleStartProvisioning = async () => {
    const newJobId = await startOnboardingProvisioning()
    if (newJobId) {
      setJobId(newJobId)
      setCurrentStep(6)
    }
  }
  
  // Handle provisioning complete
  const handleProvisioningComplete = () => {
    router.push('/dashboard?welcome=true')
  }
  
  if (onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">OP</span>
              </div>
              <span className="text-xl font-semibold text-white">OPCalls</span>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step.id < currentStep
                        ? 'bg-green-500 text-white'
                        : step.id === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${
                        step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Step Title */}
        <div className="mb-8">
          <p className="text-blue-400 text-sm font-medium mb-2">
            Step {currentStep} of {STEPS.length}
          </p>
          <h1 className="text-3xl font-bold text-white">
            {STEPS[currentStep - 1]?.title}
          </h1>
        </div>
        
        {/* Step Content */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
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
              saving={onboardingSaving}
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
      </main>
    </div>
  )
}
