/**
 * OPCALLS Phase 7: Provider Registry
 * 
 * Central registry for telephony and AI providers.
 * Handles provider initialization, caching, and swapping.
 */

import { createClient } from '@supabase/supabase-js'
import {
  TelephonyProvider,
  AIProvider,
  TelephonyProviderType,
  AIProviderType,
  ProviderConfig,
  ProviderError,
} from './interfaces'

// ============================================================================
// Provider Adapters (lazy imports)
// ============================================================================

async function getTwilioAdapter(): Promise<TelephonyProvider> {
  const { TwilioProvider } = await import('@/lib/telephony/twilio-provider')
  return new TwilioProvider()
}

async function getRetellAdapter(): Promise<AIProvider> {
  const { RetellProvider } = await import('@/lib/ai/retell-provider')
  // Adapt RetellProvider to AIProvider interface
  const retell = new RetellProvider()
  return createRetellAdapter(retell)
}

// Adapter to convert RetellProvider to AIProvider interface
function createRetellAdapter(retell: any): AIProvider {
  return {
    name: 'Retell',
    type: 'retell',
    
    async createAgent(params) {
      try {
        const result = await retell.createAgent({
          name: params.name,
          voiceId: params.voiceId,
          systemPrompt: params.systemPrompt,
          greetingMessage: params.greetingMessage,
          webhookUrl: params.webhookUrl,
          ...params.config,
        })
        return {
          success: true,
          agentId: result.agent_id,
          llmId: result.response_engine?.llm_id,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create agent',
        }
      }
    },
    
    async getAgent(agentId) {
      const agent = await retell.getAgent(agentId)
      if (!agent) return null
      return {
        id: agent.agent_id,
        name: agent.agent_name,
        voiceId: agent.voice_id,
        status: 'active',
        createdAt: new Date(agent.created_at),
      }
    },
    
    async updateAgent(agentId, updates) {
      const result = await retell.updateAgent(agentId, {
        name: updates.name,
        voiceId: updates.voiceId,
        ...updates.config,
      })
      return {
        id: result.agent_id,
        name: result.agent_name,
        voiceId: result.voice_id,
        status: 'active',
        createdAt: new Date(result.created_at),
      }
    },
    
    async deleteAgent(agentId) {
      await retell.deleteAgent(agentId)
    },
    
    async listAgents() {
      const agents = await retell.listAgents()
      return agents.map((a: any) => ({
        id: a.agent_id,
        name: a.agent_name,
        voiceId: a.voice_id,
        status: 'active' as const,
        createdAt: new Date(a.created_at),
      }))
    },
    
    async updatePrompt(agentId, prompt, greeting) {
      // Get agent to find LLM ID
      const agent = await retell.getAgent(agentId)
      if (agent?.response_engine?.llm_id) {
        await retell.updateLLM(agent.response_engine.llm_id, {
          systemPrompt: prompt,
          greetingMessage: greeting,
        })
      }
    },
    
    async bindPhoneNumber(phoneNumber, agentId, direction) {
      const terminationUri = process.env.RETELL_TERMINATION_URI || 'sip.retellai.com'
      await retell.importPhoneNumber({
        phoneNumber,
        terminationUri,
        inboundAgentId: direction !== 'outbound' ? agentId : undefined,
        outboundAgentId: direction !== 'inbound' ? agentId : undefined,
      })
    },
    
    async unbindPhoneNumber(phoneNumber) {
      await retell.updatePhoneNumber(phoneNumber, {
        inboundAgentId: undefined,
        outboundAgentId: undefined,
      })
    },
    
    async initiateCall(params) {
      try {
        const result = await retell.createCall({
          fromNumber: params.fromNumber,
          toNumber: params.toNumber,
          agentId: params.agentId,
          metadata: params.metadata,
        })
        return {
          success: true,
          callId: result.call_id,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initiate call',
        }
      }
    },
    
    async getCall(callId) {
      const call = await retell.getCall(callId)
      if (!call) return null
      return {
        id: call.call_id,
        status: call.call_status as any,
        direction: call.direction || 'inbound',
        fromNumber: call.from_number || '',
        toNumber: call.to_number || '',
        agentId: call.agent_id,
        duration: call.duration_ms ? Math.round(call.duration_ms / 1000) : undefined,
        transcript: call.transcript,
      }
    },
    
    async healthCheck() {
      return retell.healthCheck()
    },
  }
}

// ============================================================================
// Provider Registry
// ============================================================================

class ProviderRegistry {
  private telephonyProviders: Map<TelephonyProviderType, TelephonyProvider> = new Map()
  private aiProviders: Map<AIProviderType, AIProvider> = new Map()
  private defaultConfig: ProviderConfig = { telephony: 'twilio', ai: 'retell' }
  
  /**
   * Get telephony provider (with caching)
   */
  async getTelephonyProvider(type?: TelephonyProviderType): Promise<TelephonyProvider> {
    const providerType = type || await this.getDefaultTelephonyType()
    
    if (!this.telephonyProviders.has(providerType)) {
      const provider = await this.initializeTelephonyProvider(providerType)
      this.telephonyProviders.set(providerType, provider)
    }
    
    return this.telephonyProviders.get(providerType)!
  }
  
  /**
   * Get AI provider (with caching)
   */
  async getAIProvider(type?: AIProviderType): Promise<AIProvider> {
    const providerType = type || await this.getDefaultAIType()
    
    if (!this.aiProviders.has(providerType)) {
      const provider = await this.initializeAIProvider(providerType)
      this.aiProviders.set(providerType, provider)
    }
    
    return this.aiProviders.get(providerType)!
  }
  
  /**
   * Get providers for a specific organization
   */
  async getOrgProviders(orgId: string): Promise<{
    telephony: TelephonyProvider
    ai: AIProvider
  }> {
    const config = await this.getOrgProviderConfig(orgId)
    
    return {
      telephony: await this.getTelephonyProvider(config.telephony),
      ai: await this.getAIProvider(config.ai),
    }
  }
  
  /**
   * Initialize telephony provider by type
   */
  private async initializeTelephonyProvider(type: TelephonyProviderType): Promise<TelephonyProvider> {
    switch (type) {
      case 'twilio':
        return getTwilioAdapter()
      
      case 'telnyx':
        // TODO: Implement Telnyx adapter
        throw new ProviderError('telnyx', 'NOT_IMPLEMENTED', 'Telnyx provider not yet implemented', false)
      
      case 'bandwidth':
        throw new ProviderError('bandwidth', 'NOT_IMPLEMENTED', 'Bandwidth provider not yet implemented', false)
      
      case 'signalwire':
        throw new ProviderError('signalwire', 'NOT_IMPLEMENTED', 'SignalWire provider not yet implemented', false)
      
      default:
        throw new ProviderError('unknown', 'INVALID_PROVIDER', `Unknown telephony provider: ${type}`, false)
    }
  }
  
  /**
   * Initialize AI provider by type
   */
  private async initializeAIProvider(type: AIProviderType): Promise<AIProvider> {
    switch (type) {
      case 'retell':
        return getRetellAdapter()
      
      case 'vapi':
        // TODO: Implement Vapi adapter
        throw new ProviderError('vapi', 'NOT_IMPLEMENTED', 'Vapi provider not yet implemented', false)
      
      case 'bland':
        throw new ProviderError('bland', 'NOT_IMPLEMENTED', 'Bland AI provider not yet implemented', false)
      
      case 'voiceflow':
        throw new ProviderError('voiceflow', 'NOT_IMPLEMENTED', 'Voiceflow provider not yet implemented', false)
      
      default:
        throw new ProviderError('unknown', 'INVALID_PROVIDER', `Unknown AI provider: ${type}`, false)
    }
  }
  
  /**
   * Get default telephony provider type from system config
   */
  private async getDefaultTelephonyType(): Promise<TelephonyProviderType> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'active_telephony_provider')
        .single()
      
      if (data?.value) {
        return JSON.parse(data.value) as TelephonyProviderType
      }
    } catch {
      // Fall through to default
    }
    
    return this.defaultConfig.telephony
  }
  
  /**
   * Get default AI provider type from system config
   */
  private async getDefaultAIType(): Promise<AIProviderType> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'active_ai_provider')
        .single()
      
      if (data?.value) {
        return JSON.parse(data.value) as AIProviderType
      }
    } catch {
      // Fall through to default
    }
    
    return this.defaultConfig.ai
  }
  
  /**
   * Get provider config for a specific organization
   */
  private async getOrgProviderConfig(orgId: string): Promise<ProviderConfig> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data } = await supabase
        .from('organizations')
        .select('provider_config')
        .eq('id', orgId)
        .single()
      
      if (data?.provider_config) {
        return data.provider_config as ProviderConfig
      }
    } catch {
      // Fall through to defaults
    }
    
    return {
      telephony: await this.getDefaultTelephonyType(),
      ai: await this.getDefaultAIType(),
    }
  }
  
  /**
   * Clear cached providers (for testing or config changes)
   */
  clearCache(): void {
    this.telephonyProviders.clear()
    this.aiProviders.clear()
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const providerRegistry = new ProviderRegistry()

// Convenience functions
export async function getTelephonyProvider(type?: TelephonyProviderType): Promise<TelephonyProvider> {
  return providerRegistry.getTelephonyProvider(type)
}

export async function getAIProvider(type?: AIProviderType): Promise<AIProvider> {
  return providerRegistry.getAIProvider(type)
}

export async function getOrgProviders(orgId: string) {
  return providerRegistry.getOrgProviders(orgId)
}
