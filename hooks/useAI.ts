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
  const { session, orgId } = useAuthStore()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchAgents = useCallback(async () => {
    if (!orgId || !session?.access_token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/agents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
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
  }, [orgId, session?.access_token])
  
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
  const { session } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createAgent = useCallback(async (params: CreateAgentParams): Promise<Agent | null> => {
    if (!session?.access_token) {
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
          'Authorization': `Bearer ${session.access_token}`,
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
  }, [session?.access_token])
  
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
  const { session } = useAuthStore()
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchVoices() {
      if (!session?.access_token) {
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch('/api/ai/agents?action=voices', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        
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
  }, [session?.access_token])
  
  return { voices, loading }
}

// ============================================================================
// usePromptTemplates Hook
// ============================================================================

export function usePromptTemplates(vertical?: string) {
  const { session } = useAuthStore()
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchTemplates() {
      if (!session?.access_token) {
        setLoading(false)
        return
      }
      
      try {
        const params = new URLSearchParams({ action: 'templates' })
        if (vertical) params.append('vertical', vertical)
        
        const response = await fetch(`/api/ai/agents?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        
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
  }, [session?.access_token, vertical])
  
  return { templates, loading }
}

// ============================================================================
// useBindings Hook
// ============================================================================

export function useBindings() {
  const { session, orgId } = useAuthStore()
  const [bindings, setBindings] = useState<Binding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchBindings = useCallback(async () => {
    if (!orgId || !session?.access_token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/bindings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
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
  }, [orgId, session?.access_token])
  
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
  const { session } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bind = useCallback(async (
    phoneNumberId: string,
    agentId: string,
    bindingType: 'inbound' | 'outbound' | 'both' = 'inbound'
  ): Promise<Binding | null> => {
    if (!session?.access_token) {
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
          'Authorization': `Bearer ${session.access_token}`,
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
  }, [session?.access_token])
  
  const unbind = useCallback(async (phoneNumberId: string): Promise<boolean> => {
    if (!session?.access_token) {
      setError('Not authenticated')
      return false
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/ai/bindings?phoneNumberId=${phoneNumberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
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
  }, [session?.access_token])
  
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
