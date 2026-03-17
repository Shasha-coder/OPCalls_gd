/**
 * OPCALLS Phase 7: Setup Status Hook
 * 
 * Smart routing based on user's setup state
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

// ============================================================================
// Types
// ============================================================================

interface SetupStatus {
  userId: string
  orgId: string | null
  orgName: string | null
  setupStatus: 'pending' | 'onboarding' | 'provisioning' | 'active' | 'suspended'
  onboardingComplete: boolean
  hasAgent: boolean
  hasPhone: boolean
  hasSubscription: boolean
  isAdmin: boolean
  nextAction: SetupAction
  redirectPath: string
}

type SetupAction = 
  | 'complete_onboarding'
  | 'start_provisioning'
  | 'wait_for_provisioning'
  | 'add_payment'
  | 'dashboard'
  | 'suspended'

// ============================================================================
// Hook: useSetupStatus
// ============================================================================

export function useSetupStatus() {
  const { session } = useAuthStore()
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStatus = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/user/setup-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch setup status')
      }
      
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])
  
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  
  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    isComplete: status?.nextAction === 'dashboard',
    needsOnboarding: status?.nextAction === 'complete_onboarding',
    needsProvisioning: status?.nextAction === 'start_provisioning',
    isProvisioning: status?.nextAction === 'wait_for_provisioning',
    needsPayment: status?.nextAction === 'add_payment',
    isSuspended: status?.nextAction === 'suspended',
    isAdmin: status?.isAdmin || false,
  }
}

// ============================================================================
// Hook: useSmartRedirect
// ============================================================================

export function useSmartRedirect() {
  const router = useRouter()
  const { status, loading } = useSetupStatus()
  
  useEffect(() => {
    if (!loading && status) {
      // Don't redirect if already on the correct path
      const currentPath = window.location.pathname
      
      // Allow staying on current page in some cases
      if (currentPath.startsWith('/admin') && status.isAdmin) {
        return // Admin can stay on admin pages
      }
      
      if (currentPath === status.redirectPath) {
        return // Already on correct path
      }
      
      // Check if redirect is needed
      if (status.nextAction !== 'dashboard' && !currentPath.startsWith('/setup')) {
        // Need to complete setup
        router.push(status.redirectPath)
      }
    }
  }, [loading, status, router])
  
  return { status, loading }
}

// ============================================================================
// Hook: useRequireSetup
// ============================================================================

/**
 * Use on protected pages to ensure setup is complete
 */
export function useRequireSetup() {
  const router = useRouter()
  const { status, loading, isComplete, needsOnboarding, needsProvisioning, isProvisioning } = useSetupStatus()
  
  useEffect(() => {
    if (!loading && status) {
      if (!isComplete) {
        router.push(status.redirectPath)
      }
    }
  }, [loading, status, isComplete, router])
  
  return {
    loading,
    isComplete,
    status,
  }
}

// ============================================================================
// Hook: useRequireAdmin
// ============================================================================

/**
 * Use on admin pages to verify admin access
 */
export function useRequireAdmin() {
  const router = useRouter()
  const { status, loading, isAdmin } = useSetupStatus()
  
  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        router.push('/dashboard')
      }
    }
  }, [loading, isAdmin, router])
  
  return {
    loading,
    isAdmin,
    status,
  }
}
