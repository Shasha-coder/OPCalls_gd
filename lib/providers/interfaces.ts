/**
 * OPCALLS Phase 7: Provider Abstraction
 * 
 * Clean interfaces for telephony and AI providers.
 * Makes it easy to swap Twilio/Telnyx or Retell/Vapi.
 */

// ============================================================================
// TELEPHONY PROVIDER INTERFACE
// ============================================================================

export interface CreateSubaccountParams {
  orgId?: string
  friendlyName: string
}

export interface TelephonyProvider {
  readonly name: string
  readonly type: 'twilio' | 'telnyx' | 'bandwidth' | 'signalwire'
  
  // Subaccount/Project Management
  createSubaccount(params: CreateSubaccountParams): Promise<SubaccountResult>
  getSubaccount(subaccountId: string): Promise<Subaccount | null>
  suspendSubaccount(subaccountId: string): Promise<void>
  resumeSubaccount(subaccountId: string): Promise<void>
  
  // Phone Numbers
  searchNumbers(params: NumberSearchParams): Promise<AvailableNumber[]>
  purchaseNumber(params: PurchaseNumberParams): Promise<PurchasedNumber>
  releaseNumber(numberId: string): Promise<void>
  updateNumber(numberId: string, updates: NumberUpdateParams): Promise<void>
  
  // SIP/Voice Routing
  createSipEndpoint(params: SipEndpointParams): Promise<SipEndpoint>
  deleteSipEndpoint(endpointId: string): Promise<void>
  
  // Health
  healthCheck(): Promise<ProviderHealthStatus>
}

export interface ProviderHealthStatus {
  healthy: boolean
  latencyMs?: number
  message?: string
  lastChecked: Date
}

export interface SubaccountResult {
  sid: string
  authToken: string
  friendlyName: string
  status: 'active' | 'suspended' | 'closed'
  dateCreated: Date
}

export interface Subaccount {
  sid: string
  friendlyName: string
  status: 'active' | 'suspended' | 'closed'
  dateCreated: Date
  dateUpdated?: Date
}

export interface NumberSearchParams {
  country: string
  type: 'local' | 'toll_free' | 'mobile'
  areaCode?: string
  contains?: string
  limit?: number
}

export interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  locality?: string
  region?: string
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
  }
  monthlyCost?: number
}

export interface PurchaseNumberParams {
  phoneNumber: string
  friendlyName?: string
  voiceUrl?: string
  smsUrl?: string
}

export interface PurchasedNumber {
  id: string
  phoneNumber: string
  friendlyName: string
  status: 'active' | 'pending'
}

export interface NumberUpdateParams {
  friendlyName?: string
  voiceUrl?: string
  smsUrl?: string
}

export interface SipEndpointParams {
  friendlyName: string
  terminationUri: string
  originationUri?: string
}

export interface SipEndpoint {
  id: string
  friendlyName: string
  terminationUri: string
  originationUri?: string
}

export interface ProviderHealth {
  healthy: boolean
  latencyMs: number
  message?: string
}

// ============================================================================
// AI PROVIDER INTERFACE
// ============================================================================

export interface AIProvider {
  readonly name: string
  readonly type: 'retell' | 'vapi' | 'bland' | 'voiceflow'
  
  // Agent Management
  createAgent(params: CreateAgentParams): Promise<AgentResult>
  getAgent(agentId: string): Promise<Agent | null>
  updateAgent(agentId: string, updates: UpdateAgentParams): Promise<Agent>
  deleteAgent(agentId: string): Promise<void>
  listAgents(): Promise<Agent[]>
  
  // Prompt/LLM Management
  updatePrompt(agentId: string, prompt: string, greeting?: string): Promise<void>
  
  // Phone Binding
  bindPhoneNumber(phoneNumber: string, agentId: string, direction: 'inbound' | 'outbound' | 'both'): Promise<void>
  unbindPhoneNumber(phoneNumber: string): Promise<void>
  
  // Calls
  initiateCall(params: InitiateCallParams): Promise<CallResult>
  getCall(callId: string): Promise<Call | null>
  
  // Health
  healthCheck(): Promise<ProviderHealth>
}

export interface CreateAgentParams {
  name: string
  voiceId: string
  systemPrompt: string
  greetingMessage?: string
  llmModel?: string
  webhookUrl?: string
  config?: AgentConfig
}

export interface AgentConfig {
  interruptionSensitivity?: number
  responsiveness?: number
  ambientSound?: string
  backchannelEnabled?: boolean
  maxCallDurationSeconds?: number
}

export interface AgentResult {
  success: boolean
  agentId?: string
  llmId?: string
  error?: string
}

export interface Agent {
  id: string
  name: string
  voiceId: string
  llmId?: string
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface UpdateAgentParams {
  name?: string
  voiceId?: string
  config?: Partial<AgentConfig>
}

export interface InitiateCallParams {
  fromNumber: string
  toNumber: string
  agentId: string
  metadata?: Record<string, unknown>
}

export interface CallResult {
  success: boolean
  callId?: string
  error?: string
}

export interface Call {
  id: string
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed'
  direction: 'inbound' | 'outbound'
  fromNumber: string
  toNumber: string
  agentId: string
  duration?: number
  transcript?: string
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

export type TelephonyProviderType = 'twilio' | 'telnyx' | 'bandwidth' | 'signalwire'
export type AIProviderType = 'retell' | 'vapi' | 'bland' | 'voiceflow'

export interface ProviderConfig {
  telephony: TelephonyProviderType
  ai: AIProviderType
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ProviderError extends Error {
  provider: string
  code: string
  retryable: boolean
  
  constructor(
    provider: string,
    code: string,
    message: string,
    retryable: boolean = false
  ) {
    super(message)
    this.name = 'ProviderError'
    this.provider = provider
    this.code = code
    this.retryable = retryable
  }
}
