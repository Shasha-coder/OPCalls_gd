/**
 * OPCALLS Phase 3: Telephony Hooks
 * 
 * React hooks for telephony operations in frontend components
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'

// ============================================================================
// Types
// ============================================================================

interface PhoneNumber {
  id: string
  e164: string
  prettyNumber: string
  status: string
  agentId?: string
  areaCode?: number
  country: string
  monthlyPriceCents: number
  purchasedAt?: string
}

interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  locality?: string
  region?: string
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
  }
  type: string
  monthlyPriceCents: number
}

interface ProvisioningStatus {
  hasSubaccount: boolean
  hasSipTrunk: boolean
  isActive: boolean
}

interface HealthCheck {
  healthy: boolean
  checks: Array<{
    name: string
    status: 'passed' | 'failed' | 'warning'
    message?: string
  }>
}

// ============================================================================
// usePhoneNumbers Hook
// ============================================================================

export function usePhoneNumbers() {
  const { user, organization } = useAuthStore()
  const orgId = organization?.id
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchNumbers = useCallback(async () => {
    if (!orgId || !user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/telephony/numbers?action=list')
      
      if (!response.ok) {
        throw new Error('Failed to fetch phone numbers')
      }
      
      const data = await response.json()
      setNumbers(data.numbers.map((n: Record<string, unknown>) => ({
        id: n.id,
        e164: n.e164 || n.retell_phone_number,
        prettyNumber: n.pretty_number,
        status: n.status,
        agentId: n.agent_id,
        areaCode: n.area_code,
        country: n.country,
        monthlyPriceCents: n.monthly_cost_cents,
        purchasedAt: n.purchased_at,
      })))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [orgId, user])
  
  useEffect(() => {
    fetchNumbers()
  }, [fetchNumbers])
  
  return {
    numbers,
    loading,
    error,
    refetch: fetchNumbers,
  }
}

// ============================================================================
// useNumberSearch Hook
// ============================================================================

export function useNumberSearch() {
  const { user } = useAuthStore()
  const [results, setResults] = useState<AvailableNumber[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  
  const search = useCallback(async (params: {
    country?: string
    type?: 'local' | 'toll_free' | 'mobile'
    areaCode?: string
    contains?: string
    locality?: string
    region?: string
  }) => {
    if (!user) {
      setError('Not authenticated')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams({
        action: 'search',
        ...Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined)
        ),
      })
      
      const response = await fetch(`/api/telephony/numbers?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      setResults(data.numbers)
      setCached(data.cached)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [user])
  
  const clear = useCallback(() => {
    setResults([])
    setError(null)
    setCached(false)
  }, [])
  
  return {
    results,
    loading,
    error,
    cached,
    search,
    clear,
  }
}

// ============================================================================
// usePurchaseNumber Hook
// ============================================================================

export function usePurchaseNumber() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const purchase = useCallback(async (params: {
    phoneNumber: string
    friendlyName?: string
    agentId?: string
  }): Promise<PhoneNumber | null> => {
    if (!user) {
      setError('Not authenticated')
      return null
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/telephony/numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed')
      }
      
      return {
        id: data.phoneNumber.id,
        e164: data.phoneNumber.e164,
        prettyNumber: data.phoneNumber.pretty_number,
        status: data.phoneNumber.status,
        agentId: data.phoneNumber.agent_id,
        areaCode: data.phoneNumber.area_code,
        country: data.phoneNumber.country,
        monthlyPriceCents: data.phoneNumber.monthly_cost_cents,
        purchasedAt: data.phoneNumber.purchased_at,
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])
  
  return {
    purchase,
    loading,
    error,
  }
}

// ============================================================================
// useProvisioningStatus Hook
// ============================================================================

export function useProvisioningStatus() {
  const { user, organization } = useAuthStore()
  const orgId = organization?.id
  const [status, setStatus] = useState<ProvisioningStatus | null>(null)
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStatus = useCallback(async () => {
    if (!orgId || !user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/telephony/provision')
      
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      
      const data = await response.json()
      setStatus(data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [orgId, user])
  
  const fetchHealth = useCallback(async () => {
    if (!orgId || !user) return
    
    try {
      const response = await fetch('/api/telephony/provision?action=health')
      
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch {
      // Ignore health check errors
    }
  }, [orgId, user])
  
  const provision = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('Not authenticated')
      return false
    }
    
    setProvisioning(true)
    setError(null)
    
    try {
      const response = await fetch('/api/telephony/provision', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Provisioning failed')
      }
      
      // Refresh status
      await fetchStatus()
      
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provisioning failed')
      return false
    } finally {
      setProvisioning(false)
    }
  }, [user, fetchStatus])
  
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  
  useEffect(() => {
    if (status?.hasSubaccount) {
      fetchHealth()
    }
  }, [status, fetchHealth])
  
  return {
    status,
    health,
    loading,
    provisioning,
    error,
    provision,
    refetch: fetchStatus,
    refetchHealth: fetchHealth,
  }
}

// ============================================================================
// Combined Hook
// ============================================================================

export function useTelephony() {
  const phoneNumbers = usePhoneNumbers()
  const numberSearch = useNumberSearch()
  const purchaseNumber = usePurchaseNumber()
  const provisioning = useProvisioningStatus()
  
  return {
    // Phone numbers
    numbers: phoneNumbers.numbers,
    numbersLoading: phoneNumbers.loading,
    numbersError: phoneNumbers.error,
    refetchNumbers: phoneNumbers.refetch,
    
    // Search
    searchResults: numberSearch.results,
    searchLoading: numberSearch.loading,
    searchError: numberSearch.error,
    searchCached: numberSearch.cached,
    searchNumbers: numberSearch.search,
    clearSearch: numberSearch.clear,
    
    // Purchase
    purchaseNumber: purchaseNumber.purchase,
    purchaseLoading: purchaseNumber.loading,
    purchaseError: purchaseNumber.error,
    
    // Provisioning
    provisioningStatus: provisioning.status,
    provisioningHealth: provisioning.health,
    provisioningLoading: provisioning.loading,
    isProvisioning: provisioning.provisioning,
    provisioningError: provisioning.error,
    provisionTelephony: provisioning.provision,
    refetchProvisioning: provisioning.refetch,
  }
}
