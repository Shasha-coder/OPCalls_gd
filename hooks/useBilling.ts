/**
 * OPCALLS Phase 2: Billing Hooks
 * 
 * React hooks for billing operations in frontend components
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'

// ============================================================================
// Types
// ============================================================================

interface Subscription {
  status: string
  planName: string
  planCode: string
  amount: number
  interval: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  paymentMethod?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
}

interface Entitlements {
  canReceiveCalls: boolean
  canMakeCalls: boolean
  canSendSms: boolean
  canEditSettings: boolean
  canAddNumbers: boolean
  canCreateAgents: boolean
  canAccessAnalytics: boolean
  canAccessApi: boolean
  maxMinutes: number
  maxNumbers: number
  maxAgents: number
  maxConcurrentCalls: number
  restrictionReason: string | null
  isRestricted: boolean
  isSuspended: boolean
}

interface Invoice {
  id: string
  number: string | null
  status: string
  total: number
  currency: string
  paidAt: string | null
  invoiceUrl: string | null
  pdfUrl: string | null
}

interface BillingDashboard {
  subscription: {
    status: string
    planName: string
    amount: number
    interval: string
    periodEnd: string
    cancelAtPeriodEnd: boolean
  } | null
  usage: {
    minutesUsed: number
    minutesIncluded: number
    percentUsed: number
  }
  spend: {
    currentMonth: number
    softLimit: number | null
    hardLimit: number | null
    thresholdStatus: 'ok' | 'soft_warning' | 'hard_limit'
  }
  recentInvoices: Array<{
    id: string
    number: string
    amount: number
    status: string
    date: string
  }>
}

interface UseBillingReturn {
  subscription: Subscription | null
  entitlements: Entitlements | null
  invoices: Invoice[]
  dashboard: BillingDashboard | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  openCheckout: (planCode: string, billingInterval?: 'month' | 'year') => Promise<void>
  openPortal: () => Promise<void>
}

// ============================================================================
// Main Hook
// ============================================================================

export function useBilling(): UseBillingReturn {
  const { session, orgId } = useAuthStore()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [dashboard, setDashboard] = useState<BillingDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch billing data
  const fetchBilling = useCallback(async () => {
    if (!orgId || !session?.access_token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/billing/subscription?orgId=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing data')
      }
      
      const data = await response.json()
      
      setSubscription(data.subscription)
      setEntitlements(data.entitlements)
      setInvoices(data.invoices || [])
      setDashboard(data.dashboard)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [orgId, session?.access_token])
  
  // Load on mount and when orgId changes
  useEffect(() => {
    fetchBilling()
  }, [fetchBilling])
  
  // Open checkout
  const openCheckout = useCallback(async (
    planCode: string, 
    billingInterval: 'month' | 'year' = 'month'
  ) => {
    if (!orgId || !session?.access_token) {
      throw new Error('Not authenticated')
    }
    
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        orgId,
        planCode,
        billingInterval,
      }),
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to create checkout session')
    }
    
    const { url } = await response.json()
    window.location.href = url
  }, [orgId, session?.access_token])
  
  // Open customer portal
  const openPortal = useCallback(async () => {
    if (!orgId || !session?.access_token) {
      throw new Error('Not authenticated')
    }
    
    const response = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ orgId }),
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to open portal')
    }
    
    const { url } = await response.json()
    window.location.href = url
  }, [orgId, session?.access_token])
  
  return {
    subscription,
    entitlements,
    invoices,
    dashboard,
    loading,
    error,
    refetch: fetchBilling,
    openCheckout,
    openPortal,
  }
}

// ============================================================================
// Entitlement Check Hook
// ============================================================================

export function useEntitlementCheck(check: keyof Entitlements) {
  const { entitlements, loading } = useBilling()
  
  return {
    allowed: entitlements ? Boolean(entitlements[check]) : false,
    loading,
    restrictionReason: entitlements?.restrictionReason,
  }
}

// ============================================================================
// Plan Selector Hook
// ============================================================================

interface Plan {
  code: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  limits: {
    minutes: number
    numbers: number
    agents: number
  }
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // In production, fetch from API
    // For now, use static plans
    setPlans([
      {
        code: 'starter',
        name: 'Starter',
        description: 'Perfect for trying out AI voice agents',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: ['30 minutes included', '1 phone number', '1 AI agent', 'Community support'],
        limits: { minutes: 30, numbers: 1, agents: 1 },
      },
      {
        code: 'core',
        name: 'Core',
        description: 'For small businesses ready to automate',
        monthlyPrice: 99,
        yearlyPrice: 990,
        features: ['500 minutes included', '1 phone number', '2 AI agents', 'Email support', 'Basic integrations'],
        limits: { minutes: 500, numbers: 1, agents: 2 },
      },
      {
        code: 'scale',
        name: 'Scale',
        description: 'For growing businesses with high call volume',
        monthlyPrice: 299,
        yearlyPrice: 2990,
        features: ['2,000 minutes included', '3 phone numbers', '5 AI agents', 'Priority support', 'All integrations', 'API access'],
        limits: { minutes: 2000, numbers: 3, agents: 5 },
      },
      {
        code: 'enterprise',
        name: 'Enterprise',
        description: 'Custom solutions for large organizations',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: ['Unlimited minutes', 'Unlimited numbers', 'Unlimited agents', 'Dedicated support', 'Custom SLA', 'White-label options'],
        limits: { minutes: 0, numbers: 0, agents: 0 },
      },
    ])
    setLoading(false)
  }, [])
  
  return { plans, loading }
}

// ============================================================================
// Billing Status Banner Hook
// ============================================================================

export function useBillingBanner() {
  const { subscription, entitlements } = useBilling()
  
  if (!subscription) {
    return null
  }
  
  // Past due
  if (subscription.status === 'past_due') {
    return {
      type: 'warning' as const,
      message: 'Your payment is past due. Please update your payment method to avoid service interruption.',
      action: 'Update Payment',
    }
  }
  
  // Restricted
  if (subscription.status === 'restricted' || entitlements?.isRestricted) {
    return {
      type: 'error' as const,
      message: 'Your service is restricted due to payment issues. Some features are disabled.',
      action: 'Fix Payment',
    }
  }
  
  // Suspended
  if (subscription.status === 'suspended' || entitlements?.isSuspended) {
    return {
      type: 'error' as const,
      message: 'Your service is suspended. Please update your payment to restore service.',
      action: 'Restore Service',
    }
  }
  
  // Canceling
  if (subscription.cancelAtPeriodEnd) {
    return {
      type: 'info' as const,
      message: `Your subscription will end on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`,
      action: 'Reactivate',
    }
  }
  
  return null
}
