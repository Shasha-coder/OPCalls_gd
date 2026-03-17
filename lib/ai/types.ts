/**
 * OPCALLS Phase 4: AI Types
 * 
 * Type definitions for Retell AI integration
 */

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentConfig {
  name: string
  voiceId: string
  voiceModel?: string
  voiceTemperature?: number
  voiceSpeed?: number
  llmModel?: string
  llmTemperature?: number
  systemPrompt: string
  greetingMessage?: string
  interruptionSensitivity?: number
  responsiveness?: number
  ambientSound?: 'off' | 'coffee_shop' | 'office' | 'restaurant'
  backchannelEnabled?: boolean
  enableVoicemailDetection?: boolean
  voicemailMessage?: string
  maxCallDurationSeconds?: number
  endCallAfterSilenceSeconds?: number
  webhookUrl?: string
}

export interface RetellAgentResponse {
  agent_id: string
  agent_name: string
  voice_id: string
  voice_model: string
  language: string
  llm_websocket_url: string
  response_engine: {
    type: string
    llm_id?: string
  }
  created_at: string
  last_modified_at: string
}

export interface CreateAgentParams {
  orgId: string
  name: string
  type: AgentType
  vertical: VerticalType
  customInstructions?: string
  businessInfo: BusinessInfo
  voiceId?: string
}

export interface BusinessInfo {
  name: string
  industry: string
  phone?: string
  address?: string
  hours?: string
  customFields?: Record<string, string>
}

export type AgentType = 
  | 'receptionist'
  | 'booking'
  | 'followup'
  | 'support'
  | 'afterhours'
  | 'missed_call'

export type VerticalType =
  | 'clinic'
  | 'hvac'
  | 'salon'
  | 'legal'
  | 'dental'
  | 'medspa'
  | 'realty'
  | 'plumbing'
  | 'electrical'
  | 'generic'

// ============================================================================
// Voice Types
// ============================================================================

export interface Voice {
  id: string
  name: string
  gender: 'male' | 'female'
  provider: 'elevenlabs' | 'openai' | 'deepgram'
  accent?: string
  description?: string
  previewUrl?: string
}

export const AVAILABLE_VOICES: Voice[] = [
  { id: '11labs-Adrian', name: 'Adrian', gender: 'male', provider: 'elevenlabs', accent: 'American', description: 'Professional, warm' },
  { id: '11labs-Rachel', name: 'Rachel', gender: 'female', provider: 'elevenlabs', accent: 'American', description: 'Friendly, caring' },
  { id: '11labs-Josh', name: 'Josh', gender: 'male', provider: 'elevenlabs', accent: 'American', description: 'Casual, energetic' },
  { id: '11labs-Sarah', name: 'Sarah', gender: 'female', provider: 'elevenlabs', accent: 'American', description: 'Upbeat, cheerful' },
  { id: '11labs-Adam', name: 'Adam', gender: 'male', provider: 'elevenlabs', accent: 'American', description: 'Authoritative, confident' },
  { id: '11labs-Emily', name: 'Emily', gender: 'female', provider: 'elevenlabs', accent: 'British', description: 'Professional, articulate' },
  { id: 'openai-alloy', name: 'Alloy', gender: 'female', provider: 'openai', description: 'Neutral, clear' },
  { id: 'openai-echo', name: 'Echo', gender: 'male', provider: 'openai', description: 'Warm, conversational' },
  { id: 'openai-nova', name: 'Nova', gender: 'female', provider: 'openai', description: 'Energetic, expressive' },
]

// ============================================================================
// Knowledge Base Types
// ============================================================================

export interface KnowledgeSource {
  id: string
  orgId: string
  name: string
  type: 'text' | 'url' | 'file' | 'faq'
  content?: string
  url?: string
  faqPairs?: FaqPair[]
  retellKbId?: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  chunkCount: number
  lastSyncedAt?: string
}

export interface FaqPair {
  question: string
  answer: string
}

export interface CreateKnowledgeParams {
  orgId: string
  name: string
  type: 'text' | 'url' | 'faq'
  content?: string
  url?: string
  faqPairs?: FaqPair[]
}

// ============================================================================
// Call Analysis Types
// ============================================================================

export interface CallAnalysis {
  callId: string
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  sentimentScore: number
  primaryIntent: string
  secondaryIntents: string[]
  callSuccessful: boolean
  outcomeCategory: string
  outcomeDetails: Record<string, unknown>
  agentPerformanceScore: number
  customerSatisfactionScore: number
  keyMoments: KeyMoment[]
  actionItems: ActionItem[]
  topics: string[]
  improvementSuggestions: string[]
}

export interface KeyMoment {
  timestamp: number
  type: 'objection' | 'agreement' | 'question' | 'escalation' | 'booking'
  content: string
}

export interface ActionItem {
  type: 'callback' | 'email' | 'schedule' | 'transfer' | 'note'
  priority: 'high' | 'medium' | 'low'
  details: string
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface RetellWebhookEvent {
  event: RetellEventType
  call: RetellCallData
}

export type RetellEventType =
  | 'call_started'
  | 'call_ended'
  | 'call_analyzed'

export interface RetellCallData {
  call_id: string
  call_type: 'web_call' | 'phone_call'
  agent_id: string
  call_status: 'registered' | 'ongoing' | 'ended' | 'error'
  from_number?: string
  to_number?: string
  direction?: 'inbound' | 'outbound'
  start_timestamp?: number
  end_timestamp?: number
  duration_ms?: number
  transcript?: string
  transcript_object?: TranscriptTurn[]
  recording_url?: string
  call_analysis?: {
    call_summary?: string
    user_sentiment?: string
    call_successful?: boolean
    custom_analysis_data?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
}

export interface TranscriptTurn {
  role: 'agent' | 'user'
  content: string
  timestamp?: number
}

// ============================================================================
// Prompt Types
// ============================================================================

export interface PromptTemplate {
  id: string
  vertical: VerticalType
  purpose: AgentType
  name: string
  description?: string
  systemPrompt: string
  greetingMessage?: string
  variables: string[]
  defaultVoiceId: string
  config: PromptConfig
  isActive: boolean
  version: number
}

export interface PromptConfig {
  interruptionSensitivity: number
  responsiveness: number
  ambientSound: string
  backchannelEnabled: boolean
  enableVoicemailDetection: boolean
}

export interface PromptVersion {
  id: string
  orgId: string
  agentId: string
  templateId?: string
  version: number
  systemPrompt: string
  greetingMessage?: string
  createdBy: 'system' | 'admin' | 'user' | 'ai_improvement'
  creationReason?: string
  callCount: number
  successRate?: number
  avgSentiment?: number
  avgDurationSeconds?: number
  isActive: boolean
  createdAt: string
}

// ============================================================================
// Improvement Loop Types
// ============================================================================

export interface ImprovementSuggestion {
  type: 'prompt' | 'greeting' | 'faq' | 'voice_settings'
  severity: 'high' | 'medium' | 'low'
  description: string
  suggestedChange: string
  evidence: {
    callIds: string[]
    metrics: {
      beforeValue: number
      projectedValue: number
    }
  }
}

export interface ImprovementLog {
  id: string
  orgId: string
  agentId: string
  improvementType: string
  previousVersionId?: string
  newVersionId?: string
  previousValue?: string
  newValue?: string
  trigger: 'low_satisfaction' | 'high_abandonment' | 'scheduled' | 'manual'
  callsAnalyzed: number
  insights: unknown[]
  status: 'pending' | 'approved' | 'applied' | 'rejected' | 'rolled_back'
  improvementDelta?: number
  createdAt: string
}

// ============================================================================
// Binding Types
// ============================================================================

export interface AgentBinding {
  id: string
  orgId: string
  phoneNumberId: string
  retellAgentId: string
  bindingType: 'inbound' | 'outbound' | 'both'
  status: 'pending' | 'active' | 'suspended' | 'failed'
  errorMessage?: string
  boundAt?: string
}

// ============================================================================
// Database Record Types
// ============================================================================

export interface RetellAgentRecord {
  id: string
  org_id: string
  agent_id: string
  retell_agent_id: string
  retell_llm_id?: string
  voice_id: string
  voice_model: string
  voice_temperature: number
  voice_speed: number
  llm_model: string
  llm_temperature: number
  interruption_sensitivity: number
  responsiveness: number
  ambient_sound: string
  backchannel_enabled: boolean
  enable_voicemail_detection: boolean
  voicemail_message?: string
  max_call_duration_seconds: number
  end_call_after_silence_seconds: number
  webhook_url?: string
  status: string
  last_synced_at?: string
  sync_error?: string
  created_at: string
  updated_at: string
}

export interface CallAnalysisRecord {
  id: string
  call_id: string
  org_id: string
  summary?: string
  sentiment?: string
  sentiment_score?: number
  primary_intent?: string
  secondary_intents?: string[]
  call_successful?: boolean
  outcome_category?: string
  outcome_details?: Record<string, unknown>
  agent_performance_score?: number
  customer_satisfaction_score?: number
  key_moments?: KeyMoment[]
  action_items?: ActionItem[]
  topics?: string[]
  improvement_suggestions?: string[]
  analyzed_at?: string
  analysis_model?: string
  created_at: string
}

// ============================================================================
// Error Types
// ============================================================================

export class AIError extends Error {
  code: string
  retryable: boolean
  providerError?: unknown
  
  constructor(
    code: string,
    message: string,
    retryable: boolean = false,
    providerError?: unknown
  ) {
    super(message)
    this.name = 'AIError'
    this.code = code
    this.retryable = retryable
    this.providerError = providerError
  }
}

export const AI_ERRORS = {
  AGENT_CREATE_FAILED: 'AGENT_CREATE_FAILED',
  AGENT_UPDATE_FAILED: 'AGENT_UPDATE_FAILED',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  BINDING_FAILED: 'BINDING_FAILED',
  KB_CREATE_FAILED: 'KB_CREATE_FAILED',
  KB_SYNC_FAILED: 'KB_SYNC_FAILED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  WEBHOOK_INVALID: 'WEBHOOK_INVALID',
  RETELL_API_ERROR: 'RETELL_API_ERROR',
  PROMPT_NOT_FOUND: 'PROMPT_NOT_FOUND',
} as const
