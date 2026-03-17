/**
 * OPCALLS Phase 4: Retell Provider
 * 
 * Retell AI API client for agent management, calls, and analysis.
 * https://docs.retellai.com/api-references
 */

import {
  AgentConfig,
  RetellAgentResponse,
  RetellCallData,
  AIError,
  AI_ERRORS,
} from './types'

// ============================================================================
// Configuration
// ============================================================================

const RETELL_API_BASE = 'https://api.retellai.com'

interface RetellConfig {
  apiKey: string
}

// ============================================================================
// Retell Provider Class
// ============================================================================

export class RetellProvider {
  private apiKey: string
  
  constructor(config?: Partial<RetellConfig>) {
    this.apiKey = config?.apiKey || process.env.RETELL_API_KEY!
    
    if (!this.apiKey) {
      throw new Error('Retell API key not configured')
    }
  }
  
  // ==========================================================================
  // HTTP Client
  // ==========================================================================
  
  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${RETELL_API_BASE}${endpoint}`
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
    
    const options: RequestInit = {
      method,
      headers,
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorBody = await response.text()
        let errorMessage = `Retell API error: ${response.status}`
        
        try {
          const errorJson = JSON.parse(errorBody)
          errorMessage = errorJson.message || errorJson.error || errorMessage
        } catch {
          errorMessage = errorBody || errorMessage
        }
        
        throw new AIError(
          AI_ERRORS.RETELL_API_ERROR,
          errorMessage,
          response.status >= 500 || response.status === 429,
          { status: response.status, body: errorBody }
        )
      }
      
      // Handle empty responses
      const text = await response.text()
      if (!text) {
        return {} as T
      }
      
      return JSON.parse(text) as T
    } catch (error) {
      if (error instanceof AIError) {
        throw error
      }
      
      throw new AIError(
        AI_ERRORS.RETELL_API_ERROR,
        `Failed to call Retell API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true,
        error
      )
    }
  }
  
  // ==========================================================================
  // Agent Operations
  // ==========================================================================
  
  /**
   * Create a new Retell agent
   */
  async createAgent(config: AgentConfig): Promise<RetellAgentResponse> {
    const payload = {
      agent_name: config.name,
      voice_id: config.voiceId,
      voice_model: config.voiceModel || 'eleven_turbo_v2',
      voice_temperature: config.voiceTemperature ?? 1.0,
      voice_speed: config.voiceSpeed ?? 1.0,
      response_engine: {
        type: 'retell-llm',
        llm_id: undefined as string | undefined, // Will be created with LLM
      },
      language: 'en-US',
      interruption_sensitivity: config.interruptionSensitivity ?? 0.8,
      responsiveness: config.responsiveness ?? 0.9,
      ambient_sound: config.ambientSound || 'off',
      backchannel_frequency: config.backchannelEnabled ? 0.8 : 0,
      enable_backchannel: config.backchannelEnabled ?? true,
      opt_out_sensitive_data_storage: false,
      enable_voicemail_detection: config.enableVoicemailDetection ?? true,
      voicemail_message: config.voicemailMessage,
      max_call_duration_ms: (config.maxCallDurationSeconds || 1800) * 1000,
      end_call_after_silence_ms: (config.endCallAfterSilenceSeconds || 30) * 1000,
      webhook_url: config.webhookUrl,
    }
    
    try {
      // First create the LLM
      const llm = await this.createLLM(config.systemPrompt, config.greetingMessage)
      payload.response_engine.llm_id = llm.llm_id
      
      // Then create the agent
      const agent = await this.request<RetellAgentResponse>('POST', '/v2/agent', payload)
      
      return agent
    } catch (error) {
      throw new AIError(
        AI_ERRORS.AGENT_CREATE_FAILED,
        `Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false,
        error
      )
    }
  }
  
  /**
   * Get an agent by ID
   */
  async getAgent(agentId: string): Promise<RetellAgentResponse | null> {
    try {
      return await this.request<RetellAgentResponse>('GET', `/v2/agent/${agentId}`)
    } catch (error) {
      if (error instanceof AIError && error.providerError) {
        const providerError = error.providerError as { status?: number }
        if (providerError.status === 404) {
          return null
        }
      }
      throw error
    }
  }
  
  /**
   * Update an agent
   */
  async updateAgent(
    agentId: string,
    updates: Partial<AgentConfig>
  ): Promise<RetellAgentResponse> {
    const payload: Record<string, unknown> = {}
    
    if (updates.name) payload.agent_name = updates.name
    if (updates.voiceId) payload.voice_id = updates.voiceId
    if (updates.voiceModel) payload.voice_model = updates.voiceModel
    if (updates.voiceTemperature !== undefined) payload.voice_temperature = updates.voiceTemperature
    if (updates.voiceSpeed !== undefined) payload.voice_speed = updates.voiceSpeed
    if (updates.interruptionSensitivity !== undefined) payload.interruption_sensitivity = updates.interruptionSensitivity
    if (updates.responsiveness !== undefined) payload.responsiveness = updates.responsiveness
    if (updates.ambientSound) payload.ambient_sound = updates.ambientSound
    if (updates.backchannelEnabled !== undefined) {
      payload.enable_backchannel = updates.backchannelEnabled
      payload.backchannel_frequency = updates.backchannelEnabled ? 0.8 : 0
    }
    if (updates.enableVoicemailDetection !== undefined) payload.enable_voicemail_detection = updates.enableVoicemailDetection
    if (updates.voicemailMessage) payload.voicemail_message = updates.voicemailMessage
    if (updates.maxCallDurationSeconds) payload.max_call_duration_ms = updates.maxCallDurationSeconds * 1000
    if (updates.endCallAfterSilenceSeconds) payload.end_call_after_silence_ms = updates.endCallAfterSilenceSeconds * 1000
    if (updates.webhookUrl) payload.webhook_url = updates.webhookUrl
    
    try {
      return await this.request<RetellAgentResponse>('PATCH', `/v2/agent/${agentId}`, payload)
    } catch (error) {
      throw new AIError(
        AI_ERRORS.AGENT_UPDATE_FAILED,
        `Failed to update agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false,
        error
      )
    }
  }
  
  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    await this.request<void>('DELETE', `/v2/agent/${agentId}`)
  }
  
  /**
   * List all agents
   */
  async listAgents(): Promise<RetellAgentResponse[]> {
    return await this.request<RetellAgentResponse[]>('GET', '/v2/agent')
  }
  
  // ==========================================================================
  // LLM Operations
  // ==========================================================================
  
  /**
   * Create a Retell LLM
   */
  async createLLM(
    systemPrompt: string,
    greetingMessage?: string,
    model: string = 'gpt-4o-mini'
  ): Promise<{ llm_id: string }> {
    const payload = {
      model,
      general_prompt: systemPrompt,
      begin_message: greetingMessage,
      general_tools: [],
      states: [],
    }
    
    return await this.request<{ llm_id: string }>('POST', '/v2/llm', payload)
  }
  
  /**
   * Update a Retell LLM
   */
  async updateLLM(
    llmId: string,
    updates: {
      systemPrompt?: string
      greetingMessage?: string
      model?: string
    }
  ): Promise<{ llm_id: string }> {
    const payload: Record<string, unknown> = {}
    
    if (updates.systemPrompt) payload.general_prompt = updates.systemPrompt
    if (updates.greetingMessage !== undefined) payload.begin_message = updates.greetingMessage
    if (updates.model) payload.model = updates.model
    
    return await this.request<{ llm_id: string }>('PATCH', `/v2/llm/${llmId}`, payload)
  }
  
  /**
   * Get LLM details
   */
  async getLLM(llmId: string): Promise<{
    llm_id: string
    model: string
    general_prompt: string
    begin_message?: string
  }> {
    return await this.request('GET', `/v2/llm/${llmId}`)
  }
  
  // ==========================================================================
  // Phone Number Operations
  // ==========================================================================
  
  /**
   * Import a phone number to Retell
   */
  async importPhoneNumber(params: {
    phoneNumber: string // E.164 format
    terminationUri: string
    inboundAgentId?: string
    outboundAgentId?: string
    nickname?: string
  }): Promise<{
    phone_number: string
    phone_number_pretty: string
    inbound_agent_id?: string
    outbound_agent_id?: string
    nickname?: string
  }> {
    const payload = {
      phone_number: params.phoneNumber,
      termination_uri: params.terminationUri,
      inbound_agent_id: params.inboundAgentId,
      outbound_agent_id: params.outboundAgentId,
      nickname: params.nickname,
    }
    
    return await this.request('POST', '/v2/phone-number/import', payload)
  }
  
  /**
   * Update phone number agent binding
   */
  async updatePhoneNumber(
    phoneNumber: string,
    updates: {
      inboundAgentId?: string
      outboundAgentId?: string
      nickname?: string
    }
  ): Promise<void> {
    const payload: Record<string, unknown> = {}
    
    if (updates.inboundAgentId !== undefined) payload.inbound_agent_id = updates.inboundAgentId
    if (updates.outboundAgentId !== undefined) payload.outbound_agent_id = updates.outboundAgentId
    if (updates.nickname) payload.nickname = updates.nickname
    
    await this.request('PATCH', `/v2/phone-number/${encodeURIComponent(phoneNumber)}`, payload)
  }
  
  /**
   * Delete a phone number from Retell
   */
  async deletePhoneNumber(phoneNumber: string): Promise<void> {
    await this.request('DELETE', `/v2/phone-number/${encodeURIComponent(phoneNumber)}`)
  }
  
  /**
   * Get phone number details
   */
  async getPhoneNumber(phoneNumber: string): Promise<{
    phone_number: string
    phone_number_pretty: string
    inbound_agent_id?: string
    outbound_agent_id?: string
    nickname?: string
  } | null> {
    try {
      return await this.request('GET', `/v2/phone-number/${encodeURIComponent(phoneNumber)}`)
    } catch (error) {
      if (error instanceof AIError && error.providerError) {
        const providerError = error.providerError as { status?: number }
        if (providerError.status === 404) {
          return null
        }
      }
      throw error
    }
  }
  
  // ==========================================================================
  // Call Operations
  // ==========================================================================
  
  /**
   * Create an outbound call
   */
  async createCall(params: {
    fromNumber: string
    toNumber: string
    agentId: string
    metadata?: Record<string, unknown>
  }): Promise<RetellCallData> {
    const payload = {
      from_number: params.fromNumber,
      to_number: params.toNumber,
      override_agent_id: params.agentId,
      metadata: params.metadata,
    }
    
    return await this.request<RetellCallData>('POST', '/v2/call', payload)
  }
  
  /**
   * Get call details
   */
  async getCall(callId: string): Promise<RetellCallData | null> {
    try {
      return await this.request<RetellCallData>('GET', `/v2/call/${callId}`)
    } catch (error) {
      if (error instanceof AIError && error.providerError) {
        const providerError = error.providerError as { status?: number }
        if (providerError.status === 404) {
          return null
        }
      }
      throw error
    }
  }
  
  /**
   * List calls with filters
   */
  async listCalls(params?: {
    agentId?: string
    limit?: number
    sortOrder?: 'asc' | 'desc'
    filterCriteria?: {
      after_start_timestamp?: number
      before_start_timestamp?: number
    }
  }): Promise<RetellCallData[]> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('filter_criteria[agent_id][]', params.agentId)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortOrder) queryParams.append('sort_order', params.sortOrder)
    if (params?.filterCriteria?.after_start_timestamp) {
      queryParams.append('filter_criteria[after_start_timestamp]', params.filterCriteria.after_start_timestamp.toString())
    }
    if (params?.filterCriteria?.before_start_timestamp) {
      queryParams.append('filter_criteria[before_start_timestamp]', params.filterCriteria.before_start_timestamp.toString())
    }
    
    const endpoint = `/v2/call${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    return await this.request<RetellCallData[]>('GET', endpoint)
  }
  
  // ==========================================================================
  // Knowledge Base Operations
  // ==========================================================================
  
  /**
   * Create a knowledge base
   */
  async createKnowledgeBase(params: {
    name: string
    texts?: string[]
    urls?: string[]
  }): Promise<{ knowledge_base_id: string }> {
    const payload = {
      knowledge_base_name: params.name,
      knowledge_base_texts: params.texts || [],
      knowledge_base_urls: params.urls || [],
    }
    
    return await this.request('POST', '/v2/knowledge-base', payload)
  }
  
  /**
   * Add content to knowledge base
   */
  async addToKnowledgeBase(
    kbId: string,
    content: {
      texts?: string[]
      urls?: string[]
    }
  ): Promise<void> {
    const payload: Record<string, unknown> = {}
    
    if (content.texts?.length) payload.knowledge_base_texts = content.texts
    if (content.urls?.length) payload.knowledge_base_urls = content.urls
    
    await this.request('PATCH', `/v2/knowledge-base/${kbId}`, payload)
  }
  
  /**
   * Delete knowledge base
   */
  async deleteKnowledgeBase(kbId: string): Promise<void> {
    await this.request('DELETE', `/v2/knowledge-base/${kbId}`)
  }
  
  // ==========================================================================
  // Webhook Validation
  // ==========================================================================
  
  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Retell uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  }
  
  // ==========================================================================
  // Health Check
  // ==========================================================================
  
  async healthCheck(): Promise<{
    healthy: boolean
    latencyMs: number
  }> {
    const startTime = Date.now()
    
    try {
      await this.listAgents()
      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
      }
    } catch {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
      }
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

let providerInstance: RetellProvider | null = null

export function getRetellProvider(): RetellProvider {
  if (!providerInstance) {
    providerInstance = new RetellProvider()
  }
  return providerInstance
}

export function createRetellProvider(config: Partial<RetellConfig>): RetellProvider {
  return new RetellProvider(config)
}
