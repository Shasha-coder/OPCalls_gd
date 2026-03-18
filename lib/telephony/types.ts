/**
 * OPCALLS Phase 3: Telephony Types
 * 
 * Provider-agnostic interfaces for telephony operations.
 * This is the core abstraction layer that allows swapping
 * Twilio for Telnyx, Vonage, or other providers later.
 */

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * TelephonyProvider interface
 * All telephony providers must implement this interface
 */
export interface TelephonyProvider {
  readonly name: string
  readonly supportsSubaccounts: boolean
  readonly supportsSipTrunks: boolean
  
  // Subaccount operations
  createSubaccount(params: CreateSubaccountParams): Promise<SubaccountResult>
  getSubaccount(subaccountSid: string): Promise<Subaccount | null>
  suspendSubaccount(subaccountSid: string): Promise<void>
  resumeSubaccount(subaccountSid: string): Promise<void>
  closeSubaccount(subaccountSid: string): Promise<void>
  
  // Number operations
  searchNumbers(params: NumberSearchParams): Promise<AvailableNumber[]>
  purchaseNumber(params: PurchaseNumberParams): Promise<PurchasedNumber>
  releaseNumber(numberSid: string, subaccountSid?: string): Promise<void>
  getNumber(numberSid: string, subaccountSid?: string): Promise<PhoneNumber | null>
  updateNumber(numberSid: string, params: UpdateNumberParams): Promise<PhoneNumber>
  listNumbers(subaccountSid?: string): Promise<PhoneNumber[]>
  
  // SIP Trunk operations
  createTrunk(params: CreateTrunkParams): Promise<SipTrunk>
  getTrunk(trunkSid: string): Promise<SipTrunk | null>
  updateTrunk(trunkSid: string, params: UpdateTrunkParams): Promise<SipTrunk>
  deleteTrunk(trunkSid: string): Promise<void>
  
  // Trunk number binding
  attachNumberToTrunk(trunkSid: string, numberSid: string): Promise<void>
  detachNumberFromTrunk(trunkSid: string, numberSid: string): Promise<void>
  
  // Webhook validation
  validateWebhook(payload: string, signature: string, url: string): boolean
  
  // Health check
  healthCheck(): Promise<ProviderHealthStatus>
}

// ============================================================================
// Subaccount Types
// ============================================================================

export interface CreateSubaccountParams {
  friendlyName: string
  orgId: string
}

export interface SubaccountResult {
  sid: string
  authToken: string
  friendlyName: string
  status: SubaccountStatus
  dateCreated: Date
}

export interface Subaccount {
  sid: string
  friendlyName: string
  status: SubaccountStatus
  dateCreated: Date
  dateUpdated: Date
}

export type SubaccountStatus = 'active' | 'suspended' | 'closed'

// ============================================================================
// Phone Number Types
// ============================================================================

export interface NumberSearchParams {
  country: string
  type?: NumberType
  areaCode?: string
  contains?: string
  locality?: string
  region?: string
  postalCode?: string
  limit?: number
  subaccountSid?: string
}

export interface AvailableNumber {
  phoneNumber: string // E.164 format
  friendlyName: string
  locality?: string
  region?: string
  postalCode?: string
  country: string
  capabilities: NumberCapabilities
  type: NumberType
  addressRequirements?: AddressRequirement
  monthlyPriceCents: number
}

export interface PurchaseNumberParams {
  phoneNumber: string
  subaccountSid?: string
  friendlyName?: string
  voiceUrl?: string
  voiceMethod?: 'GET' | 'POST'
  smsUrl?: string
  smsMethod?: 'GET' | 'POST'
  statusCallback?: string
}

export interface PurchasedNumber {
  sid: string
  phoneNumber: string
  friendlyName: string
  capabilities: NumberCapabilities
  status: NumberStatus
  dateCreated: Date
}

export interface PhoneNumber {
  sid: string
  phoneNumber: string
  friendlyName: string
  capabilities: NumberCapabilities
  status: NumberStatus
  voiceUrl?: string
  smsUrl?: string
  trunkSid?: string
  dateCreated: Date
  dateUpdated: Date
}

export interface UpdateNumberParams {
  friendlyName?: string
  voiceUrl?: string
  voiceMethod?: 'GET' | 'POST'
  voiceFallbackUrl?: string
  smsUrl?: string
  smsMethod?: 'GET' | 'POST'
  statusCallback?: string
}

export interface NumberCapabilities {
  voice: boolean
  sms: boolean
  mms: boolean
  fax?: boolean
}

export type NumberType = 'local' | 'toll_free' | 'mobile'
export type NumberStatus = 'pending' | 'active' | 'suspended' | 'released' | 'failed'
export type AddressRequirement = 'none' | 'local' | 'foreign' | 'any'

// ============================================================================
// SIP Trunk Types
// ============================================================================

export interface CreateTrunkParams {
  friendlyName: string
  subaccountSid?: string
  domainName?: string
  secure?: boolean
  cnamLookupEnabled?: boolean
  disasterRecoveryUrl?: string
  disasterRecoveryMethod?: 'GET' | 'POST'
}

export interface SipTrunk {
  sid: string
  friendlyName: string
  domainName?: string
  terminationUri?: string
  originationUris: string[]
  secure: boolean
  cnamLookupEnabled: boolean
  status: TrunkStatus
  dateCreated: Date
  dateUpdated: Date
}

export interface UpdateTrunkParams {
  friendlyName?: string
  secure?: boolean
  cnamLookupEnabled?: boolean
  disasterRecoveryUrl?: string
  disasterRecoveryMethod?: 'GET' | 'POST'
}

export type TrunkStatus = 'pending' | 'active' | 'suspended' | 'deleted'

// ============================================================================
// Webhook Types
// ============================================================================

export interface TwilioCallWebhook {
  CallSid: string
  AccountSid: string
  From: string
  To: string
  CallStatus: TwilioCallStatus
  Direction: 'inbound' | 'outbound-api' | 'outbound-dial'
  ApiVersion: string
  CallerName?: string
  Duration?: string
  RecordingUrl?: string
  RecordingSid?: string
  Timestamp?: string
}

export type TwilioCallStatus = 
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled'

export interface TwilioSmsWebhook {
  MessageSid: string
  AccountSid: string
  From: string
  To: string
  Body: string
  MessageStatus?: TwilioSmsStatus
  NumMedia?: string
  NumSegments?: string
}

export type TwilioSmsStatus =
  | 'accepted'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed'

// ============================================================================
// Provider Health
// ============================================================================

export interface ProviderHealthStatus {
  provider: string
  healthy: boolean
  latencyMs: number
  lastChecked: Date
  details?: Record<string, unknown>
}

// ============================================================================
// Error Types
// ============================================================================

export class TelephonyError extends Error {
  code: string
  provider: string
  retryable: boolean
  providerError?: unknown
  
  constructor(
    code: string,
    message: string,
    provider: string,
    retryable: boolean = false,
    providerError?: unknown
  ) {
    super(message)
    this.name = 'TelephonyError'
    this.code = code
    this.provider = provider
    this.retryable = retryable
    this.providerError = providerError
  }
}

// Standard error codes
export const TELEPHONY_ERRORS = {
  // Subaccount errors
  SUBACCOUNT_CREATE_FAILED: 'SUBACCOUNT_CREATE_FAILED',
  SUBACCOUNT_NOT_FOUND: 'SUBACCOUNT_NOT_FOUND',
  SUBACCOUNT_SUSPENDED: 'SUBACCOUNT_SUSPENDED',
  
  // Number errors
  NUMBER_SEARCH_FAILED: 'NUMBER_SEARCH_FAILED',
  NUMBER_NOT_AVAILABLE: 'NUMBER_NOT_AVAILABLE',
  NUMBER_PURCHASE_FAILED: 'NUMBER_PURCHASE_FAILED',
  NUMBER_RELEASE_FAILED: 'NUMBER_RELEASE_FAILED',
  NUMBER_NOT_FOUND: 'NUMBER_NOT_FOUND',
  NUMBER_ALREADY_OWNED: 'NUMBER_ALREADY_OWNED',
  
  // Trunk errors
  TRUNK_CREATE_FAILED: 'TRUNK_CREATE_FAILED',
  TRUNK_NOT_FOUND: 'TRUNK_NOT_FOUND',
  TRUNK_BINDING_FAILED: 'TRUNK_BINDING_FAILED',
  
  // SIP Endpoint errors
  ENDPOINT_CREATE_FAILED: 'ENDPOINT_CREATE_FAILED',
  ENDPOINT_DELETE_FAILED: 'ENDPOINT_DELETE_FAILED',
  
  // Webhook errors
  WEBHOOK_INVALID_SIGNATURE: 'WEBHOOK_INVALID_SIGNATURE',
  WEBHOOK_PARSE_FAILED: 'WEBHOOK_PARSE_FAILED',
  
  // Provider errors
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_RATE_LIMITED: 'PROVIDER_RATE_LIMITED',
  PROVIDER_AUTH_FAILED: 'PROVIDER_AUTH_FAILED',
} as const

// ============================================================================
// Database Types (matching Supabase schema)
// ============================================================================

export interface TwilioAccountRecord {
  id: string
  org_id: string
  twilio_subaccount_sid: string
  twilio_auth_token_encrypted?: string
  friendly_name?: string
  status: 'active' | 'suspended' | 'closed'
  balance_cents: number
  created_at: string
  updated_at: string
}

export interface SipTrunkRecord {
  id: string
  org_id: string
  twilio_account_id?: string
  twilio_trunk_sid?: string
  friendly_name?: string
  termination_uri?: string
  origination_uris: string[]
  status: 'pending' | 'active' | 'suspended' | 'deleted'
  secure: boolean
  cnam_lookup_enabled: boolean
  disaster_recovery_url?: string
  disaster_recovery_method: string
  created_at: string
  updated_at: string
}

export interface PhoneNumberRecord {
  id: string
  org_id: string
  agent_id?: string
  e164?: string
  retell_phone_number: string
  pretty_number: string
  twilio_sid?: string
  twilio_subaccount_sid?: string
  sip_trunk_id?: string
  provider: string
  capabilities: NumberCapabilities
  number_type: string
  area_code?: number
  country: string
  locality?: string
  region?: string
  monthly_cost_cents: number
  status: string
  inbound_agent_id?: string
  outbound_agent_id?: string
  nickname?: string
  is_active: boolean
  purchased_at?: string
  released_at?: string
  created_at: string
  updated_at?: string
}

export interface TelephonyEventRecord {
  id: string
  org_id?: string
  event_type: string
  event_source: string
  resource_type?: string
  resource_id?: string
  twilio_sid?: string
  twilio_request_id?: string
  signature_verified: boolean
  description?: string
  metadata: Record<string, unknown>
  processed: boolean
  processed_at?: string
  error_message?: string
  created_at: string
}
