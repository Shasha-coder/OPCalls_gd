/**
 * OPCALLS Phase 4: AI Hooks
 * 
 * React hooks for AI agent operations in frontend components
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'

// ============================================================================
// Types
// ============================================================================

interface Agent {
  id: string
  name: string
  type: string
  industry: string
  retellAgentId: string
  voiceId: string
  voiceName: string
  isActive: boolean
  totalCalls: number
  totalMinutes: number
  createdAt: string
  promptVersion?: {
    version: number
    successRate?: number
  }
}

interface Voice {
  id: string
  name: string
  gender: 'male' | 'female'
  provider: string
  accent?: string
  description?: string
}

interface PromptTemplate {
  id: string
  vertical: string
  purpose: string
  name: string
  description?: string
  defaultVoiceId: string
}

interface Binding {
  id: string
  phoneNumberId: string
  retellAgentId: string
  bindingType: 'inbound' | 'outbound' | 'both'
  status: string
  boundAt?: string
}

interface CreateAgentParams {
  name: string
  type: string
  vertical?: string
  voiceId?: string
  customInstructions?: string
  businessInfo?: {
    name?: string
    industry?: string
    phone?: string
    address?: string
    hours?: string
  }
}

// ============================================================================
// useAgents Hook
// ============================================================================

export function useAgents() {
  const { user, organization } = useAuthStore()
  const orgId = organization?.id
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchAgents = useCallback(async () => {
    if (!orgId || !user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/agents')
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      
      const data = await response.json()
      setAgents(data.agents || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [orgId, user])
  
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])
  
  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
  }
}

// ============================================================================
// useCreateAgent Hook
// ============================================================================

export function useCreateAgent() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createAgent = useCallback(async (params: CreateAgentParams): Promise<Agent | null> => {
    if (!user) {
      setError('Not authenticated')
      return null
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent')
      }
      
      return data.agent
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])
  
  return {
    createAgent,
    loading,
    error,
  }
}

// ============================================================================
// useVoices Hook
// ============================================================================

export function useVoices() {
  const { user } = useAuthStore()
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchVoices() {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch('/api/ai/agents?action=voices')
        
        if (response.ok) {
          const data = await response.json()
          setVoices(data.voices || [])
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }
    
    fetchVoices()
  }, [user])
  
  return { voices, loading }
}

// ============================================================================
// usePromptTemplates Hook
// ============================================================================

export function usePromptTemplates(vertical?: string) {
  const { user } = useAuthStore()
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchTemplates() {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const params = new URLSearchParams({ action: 'templates' })
        if (vertical) params.append('vertical', vertical)
        
        const response = await fetch(`/api/ai/agents?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || [])
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }
    
    fetchTemplates()
  }, [user, vertical])
  
  return { templates, loading }
}

// ============================================================================
// useBindings Hook
// ============================================================================

export function useBindings() {
  const { user, organization } = useAuthStore()
  const orgId = organization?.id
  const [bindings, setBindings] = useState<Binding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchBindings = useCallback(async () => {
    if (!orgId || !user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/bindings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch bindings')
      }
      
      const data = await response.json()
      setBindings(data.bindings || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [orgId, user])
  
  useEffect(() => {
    fetchBindings()
  }, [fetchBindings])
  
  return {
    bindings,
    loading,
    error,
    refetch: fetchBindings,
  }
}

// ============================================================================
// useBindAgent Hook
// ============================================================================

export function useBindAgent() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bind = useCallback(async (
    phoneNumberId: string,
    agentId: string,
    bindingType: 'inbound' | 'outbound' | 'both' = 'inbound'
  ): Promise<Binding | null> => {
    if (!user) {
      setError('Not authenticated')
      return null
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/bindings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumberId, agentId, bindingType }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to bind')
      }
      
      return data.binding
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Binding failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])
  
  const unbind = useCallback(async (phoneNumberId: string): Promise<boolean> => {
    if (!user) {
      setError('Not authenticated')
      return false
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/ai/bindings?phoneNumberId=${phoneNumberId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unbind')
      }
      
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbind failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])
  
  return {
    bind,
    unbind,
    loading,
    error,
  }
}

// ============================================================================
// Combined Hook
// ============================================================================

export function useAI() {
  const agents = useAgents()
  const createAgent = useCreateAgent()
  const voices = useVoices()
  const bindings = useBindings()
  const bindAgent = useBindAgent()
  
  return {
    // Agents
    agents: agents.agents,
    agentsLoading: agents.loading,
    agentsError: agents.error,
    refetchAgents: agents.refetch,
    
    // Create agent
    createAgent: createAgent.createAgent,
    createAgentLoading: createAgent.loading,
    createAgentError: createAgent.error,
    
    // Voices
    voices: voices.voices,
    voicesLoading: voices.loading,
    
    // Bindings
    bindings: bindings.bindings,
    bindingsLoading: bindings.loading,
    bindingsError: bindings.error,
    refetchBindings: bindings.refetch,
    
    // Bind/unbind
    bindPhoneToAgent: bindAgent.bind,
    unbindPhone: bindAgent.unbind,
    bindingLoading: bindAgent.loading,
    bindingError: bindAgent.error,
  }
}
