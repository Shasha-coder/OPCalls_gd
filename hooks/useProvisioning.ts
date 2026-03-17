/**
 * OPCALLS Phase 5: Provisioning Hooks
 * 
 * React hooks for provisioning jobs and onboarding
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/auth'

// ============================================================================
// Types
// ============================================================================

interface ProvisioningJob {
  id: string
  orgId: string
  jobType: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  currentStep?: string
  completedSteps: string[]
  failedStep?: string
  totalSteps: number
  progress?: number
  lastError?: string
  output?: Record<string, unknown>
  createdAt: string
  completedAt?: string
}

interface ProvisioningStep {
  id: string
  stepName: string
  stepOrder: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'rolled_back'
  output?: Record<string, unknown>
  errorMessage?: string
  durationMs?: number
}

interface OnboardingState {
  currentStep: number
  totalSteps: number
  stepsCompleted: string[]
  stepData: OnboardingStepData
  status: 'not_started' | 'in_progress' | 'provisioning' | 'completed' | 'error'
  errorMessage?: string
  provisioningJobId?: string
}

interface OnboardingStepData {
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

// ============================================================================
// useProvisioningJob Hook
// ============================================================================

export function useProvisioningJob(jobId: string | null) {
  const { session } = useAuthStore()
  const [job, setJob] = useState<ProvisioningJob | null>(null)
  const [steps, setSteps] = useState<ProvisioningStep[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  
  const fetchJob = useCallback(async () => {
    if (!jobId || !session?.access_token) {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(`/api/provisioning/jobs?jobId=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }
      
      const data = await response.json()
      setJob(data.job)
      setSteps(data.steps || [])
      setProgress(data.progress || 0)
      setError(null)
      
      // Stop polling if job is done
      if (['completed', 'failed', 'cancelled'].includes(data.job?.status)) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [jobId, session?.access_token])
  
  // Initial fetch and polling
  useEffect(() => {
    if (!jobId) return
    
    fetchJob()
    
    // Poll every 2 seconds while job is running
    pollingRef.current = setInterval(fetchJob, 2000)
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [jobId, fetchJob])
  
  const retry = useCallback(async () => {
    if (!jobId || !session?.access_token) return false
    
    try {
      const response = await fetch('/api/provisioning/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'retry', jobId }),
      })
      
      if (response.ok) {
        // Resume polling
        pollingRef.current = setInterval(fetchJob, 2000)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [jobId, session?.access_token, fetchJob])
  
  const cancel = useCallback(async () => {
    if (!jobId || !session?.access_token) return false
    
    try {
      const response = await fetch('/api/provisioning/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'cancel', jobId }),
      })
      
      if (response.ok) {
        fetchJob()
        return true
      }
      return false
    } catch {
      return false
    }
  }, [jobId, session?.access_token, fetchJob])
  
  return {
    job,
    steps,
    progress,
    loading,
    error,
    retry,
    cancel,
    refetch: fetchJob,
  }
}

// ============================================================================
// useStartJob Hook
// ============================================================================

export function useStartJob() {
  const { session } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const startJob = useCallback(async (
    jobType: string,
    inputParams: Record<string, unknown>
  ): Promise<string | null> => {
    if (!session?.access_token) {
      setError('Not authenticated')
      return null
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/provisioning/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobType, inputParams }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start job')
      }
      
      return data.jobId
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job')
      return null
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])
  
  return { startJob, loading, error }
}

// ============================================================================
// useOnboarding Hook
// ============================================================================

export function useOnboarding() {
  const { session, orgId } = useAuthStore()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Fetch onboarding state
  const fetchState = useCallback(async () => {
    if (!orgId || !session?.access_token) {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/provisioning/onboarding', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding state')
      }
      
      const data = await response.json()
      setState(data.state)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [orgId, session?.access_token])
  
  useEffect(() => {
    fetchState()
  }, [fetchState])
  
  // Update step
  const updateStep = useCallback(async (
    step: number,
    stepName: string,
    stepData: Partial<OnboardingStepData>
  ): Promise<boolean> => {
    if (!session?.access_token) return false
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/provisioning/onboarding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ step, stepName, stepData }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update step')
      }
      
      const data = await response.json()
      setState(prev => prev ? { ...prev, ...data.state } : null)
      
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      return false
    } finally {
      setSaving(false)
    }
  }, [session?.access_token])
  
  // Start provisioning
  const startProvisioning = useCallback(async (): Promise<string | null> => {
    if (!session?.access_token) return null
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/provisioning/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'start-provisioning' }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start provisioning')
      }
      
      const data = await response.json()
      
      // Update state to provisioning
      setState(prev => prev ? { ...prev, status: 'provisioning', provisioningJobId: data.jobId } : null)
      
      return data.jobId
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start provisioning')
      return null
    } finally {
      setSaving(false)
    }
  }, [session?.access_token])
  
  // Check provisioning status
  const checkProvisioning = useCallback(async (): Promise<{
    status: string
    progress?: number
    error?: string
  }> => {
    if (!session?.access_token) {
      return { status: 'error', error: 'Not authenticated' }
    }
    
    try {
      const response = await fetch('/api/provisioning/onboarding?action=check-provisioning', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to check status')
      }
      
      const data = await response.json()
      
      // Update state
      if (data.status === 'completed' || data.status === 'error') {
        setState(prev => prev ? { ...prev, status: data.status, errorMessage: data.error } : null)
      }
      
      return data
      
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [session?.access_token])
  
  return {
    state,
    loading,
    error,
    saving,
    updateStep,
    startProvisioning,
    checkProvisioning,
    refetch: fetchState,
  }
}

// ============================================================================
// useProvisioningProgress Hook
// ============================================================================

export function useProvisioningProgress(jobId: string | null) {
  const { job, steps, progress, loading, error, retry, cancel } = useProvisioningJob(jobId)
  
  // Computed state
  const isComplete = job?.status === 'completed'
  const isFailed = job?.status === 'failed'
  const isRunning = job?.status === 'running' || job?.status === 'pending'
  const canRetry = isFailed && (job?.completedSteps?.length || 0) > 0
  
  // Current step info
  const currentStep = steps.find(s => s.status === 'running') || 
    steps.find(s => s.status === 'pending')
  
  // Failed step info
  const failedStep = steps.find(s => s.status === 'failed')
  
  return {
    job,
    steps,
    progress,
    loading,
    error,
    isComplete,
    isFailed,
    isRunning,
    canRetry,
    currentStep,
    failedStep,
    retry,
    cancel,
  }
}

// ============================================================================
// Combined Hook
// ============================================================================

export function useProvisioning() {
  const onboarding = useOnboarding()
  const startJob = useStartJob()
  
  return {
    // Onboarding state
    onboardingState: onboarding.state,
    onboardingLoading: onboarding.loading,
    onboardingError: onboarding.error,
    onboardingSaving: onboarding.saving,
    updateOnboardingStep: onboarding.updateStep,
    startOnboardingProvisioning: onboarding.startProvisioning,
    checkProvisioningStatus: onboarding.checkProvisioning,
    refetchOnboarding: onboarding.refetch,
    
    // Job operations
    startJob: startJob.startJob,
    startJobLoading: startJob.loading,
    startJobError: startJob.error,
  }
}
