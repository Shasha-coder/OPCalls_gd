/**
 * OPCALLS Phase 3: Number Service
 * 
 * High-level service for phone number operations:
 * - Search available numbers
 * - Purchase numbers
 * - Release numbers
 * - Manage number lifecycle
 * 
 * Integrates with both Twilio provider and Supabase database.
 */

import { createClient } from '@supabase/supabase-js'
import { getTwilioProvider } from './twilio-provider'
import {
  NumberSearchParams,
  AvailableNumber,
  PurchasedNumber,
  PhoneNumberRecord,
  TelephonyError,
  TELEPHONY_ERRORS,
} from './types'
import { checkCanAddNumber } from '@/lib/billing/entitlements'

// ============================================================================
// Initialize Supabase
// ============================================================================

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================================
// Types
// ============================================================================

export interface SearchNumbersRequest {
  orgId: string
  country?: string
  type?: 'local' | 'toll_free' | 'mobile'
  areaCode?: string
  contains?: string
  locality?: string
  region?: string
  limit?: number
}

export interface PurchaseNumberRequest {
  orgId: string
  phoneNumber: string
  friendlyName?: string
  agentId?: string
}

export interface NumberSearchResult {
  numbers: AvailableNumber[]
  cached: boolean
  cacheExpiresAt?: Date
}

export interface PurchaseResult {
  success: boolean
  phoneNumber?: PhoneNumberRecord
  error?: string
}

export interface ReleaseResult {
  success: boolean
  error?: string
}

// ============================================================================
// Number Search
// ============================================================================

/**
 * Search for available phone numbers
 * Uses caching to reduce API calls
 */
export async function searchAvailableNumbers(
  request: SearchNumbersRequest
): Promise<NumberSearchResult> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  const country = request.country || 'US'
  const type = request.type || 'local'
  
  // Check cache first
  const cacheKey = buildCacheKey(request)
  const cached = await getCachedSearch(cacheKey)
  
  if (cached) {
    return {
      numbers: cached.numbers,
      cached: true,
      cacheExpiresAt: cached.expiresAt,
    }
  }
  
  // Get Twilio subaccount for this org
  const { data: twilioAccount } = await supabase
    .from('twilio_accounts')
    .select('twilio_subaccount_sid')
    .eq('org_id', request.orgId)
    .eq('status', 'active')
    .single()
  
  // Search via provider
  const searchParams: NumberSearchParams = {
    country,
    type,
    areaCode: request.areaCode,
    contains: request.contains,
    locality: request.locality,
    region: request.region,
    limit: request.limit || 20,
    subaccountSid: twilioAccount?.twilio_subaccount_sid,
  }
  
  const numbers = await provider.searchNumbers(searchParams)
  
  // Cache results
  await cacheSearchResults(cacheKey, numbers, request)
  
  return {
    numbers,
    cached: false,
  }
}

/**
 * Build cache key from search parameters
 */
function buildCacheKey(request: SearchNumbersRequest): string {
  const parts = [
    request.country || 'US',
    request.type || 'local',
    request.areaCode || '',
    request.contains || '',
    request.region || '',
    request.locality || '',
  ]
  return parts.join(':')
}

/**
 * Get cached search results
 */
async function getCachedSearch(cacheKey: string): Promise<{
  numbers: AvailableNumber[]
  expiresAt: Date
} | null> {
  const supabase = getSupabase()
  
  const parts = cacheKey.split(':')
  
  const { data } = await supabase
    .from('number_search_cache')
    .select('results, expires_at')
    .eq('country', parts[0])
    .eq('number_type', parts[1])
    .eq('area_code', parts[2] || null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (data) {
    return {
      numbers: data.results as AvailableNumber[],
      expiresAt: new Date(data.expires_at),
    }
  }
  
  return null
}

/**
 * Cache search results
 */
async function cacheSearchResults(
  _cacheKey: string,
  numbers: AvailableNumber[],
  request: SearchNumbersRequest
): Promise<void> {
  const supabase = getSupabase()
  
  await supabase.from('number_search_cache').insert({
    country: request.country || 'US',
    number_type: request.type || 'local',
    area_code: request.areaCode,
    contains: request.contains,
    region: request.region,
    locality: request.locality,
    results: numbers,
    result_count: numbers.length,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
  })
}

// ============================================================================
// Number Purchase
// ============================================================================

/**
 * Purchase a phone number for an organization
 */
export async function purchaseNumber(
  request: PurchaseNumberRequest
): Promise<PurchaseResult> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  // 1. Check entitlements
  const entitlementCheck = await checkCanAddNumber(request.orgId)
  if (!entitlementCheck.allowed) {
    return {
      success: false,
      error: entitlementCheck.reason || 'Cannot add numbers',
    }
  }
  
  // 2. Get or create Twilio subaccount
  const { data: twilioAccount } = await supabase
    .from('twilio_accounts')
    .select('twilio_subaccount_sid')
    .eq('org_id', request.orgId)
    .eq('status', 'active')
    .single()
  
  if (!twilioAccount) {
    return {
      success: false,
      error: 'Twilio account not provisioned',
    }
  }
  
  // 3. Purchase from Twilio
  let purchasedNumber: PurchasedNumber
  
  try {
    purchasedNumber = await provider.purchaseNumber({
      phoneNumber: request.phoneNumber,
      subaccountSid: twilioAccount.twilio_subaccount_sid,
      friendlyName: request.friendlyName || `OPCalls - ${request.phoneNumber}`,
      // Voice/SMS URLs will be configured during provisioning
    })
  } catch (error) {
    if (error instanceof TelephonyError) {
      return {
        success: false,
        error: error.message,
      }
    }
    throw error
  }
  
  // 4. Create database record
  const phoneNumberRecord: Partial<PhoneNumberRecord> = {
    org_id: request.orgId,
    agent_id: request.agentId,
    e164: request.phoneNumber,
    retell_phone_number: request.phoneNumber,
    pretty_number: formatPhoneNumber(request.phoneNumber),
    twilio_sid: purchasedNumber.sid,
    twilio_subaccount_sid: twilioAccount.twilio_subaccount_sid,
    provider: 'twilio',
    capabilities: purchasedNumber.capabilities,
    number_type: 'local', // Detect from search results in production
    area_code: extractAreaCode(request.phoneNumber),
    country: 'US', // Detect from number in production
    status: 'active',
    is_active: true,
    purchased_at: new Date().toISOString(),
  }
  
  const { data: dbRecord, error: dbError } = await supabase
    .from('phone_numbers')
    .insert(phoneNumberRecord)
    .select()
    .single()
  
  if (dbError) {
    // Rollback: release the number
    console.error('Failed to create phone number record, rolling back:', dbError)
    try {
      await provider.releaseNumber(
        purchasedNumber.sid,
        twilioAccount.twilio_subaccount_sid
      )
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError)
    }
    
    return {
      success: false,
      error: 'Failed to save phone number',
    }
  }
  
  // 5. Log event
  await supabase.rpc('log_telephony_event', {
    p_org_id: request.orgId,
    p_event_type: 'number.purchased',
    p_event_source: 'system',
    p_resource_type: 'phone_number',
    p_resource_id: dbRecord.id,
    p_twilio_sid: purchasedNumber.sid,
    p_description: `Purchased number ${request.phoneNumber}`,
    p_metadata: { friendly_name: request.friendlyName },
  })
  
  return {
    success: true,
    phoneNumber: dbRecord as PhoneNumberRecord,
  }
}

// ============================================================================
// Number Release
// ============================================================================

/**
 * Release a phone number
 */
export async function releaseNumber(
  orgId: string,
  phoneNumberId: string
): Promise<ReleaseResult> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  // 1. Get the phone number record
  const { data: phoneNumber, error: fetchError } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('id', phoneNumberId)
    .eq('org_id', orgId)
    .single()
  
  if (fetchError || !phoneNumber) {
    return {
      success: false,
      error: 'Phone number not found',
    }
  }
  
  if (phoneNumber.status === 'released') {
    return {
      success: true, // Already released
    }
  }
  
  // 2. Release from Twilio
  if (phoneNumber.twilio_sid) {
    try {
      await provider.releaseNumber(
        phoneNumber.twilio_sid,
        phoneNumber.twilio_subaccount_sid
      )
    } catch (error) {
      if (error instanceof TelephonyError && 
          error.code !== TELEPHONY_ERRORS.NUMBER_NOT_FOUND) {
        return {
          success: false,
          error: error.message,
        }
      }
      // Number not found in Twilio is OK (already released)
    }
  }
  
  // 3. Update database
  await supabase
    .from('phone_numbers')
    .update({
      status: 'released',
      is_active: false,
      released_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', phoneNumberId)
  
  // 4. Log event
  await supabase.rpc('log_telephony_event', {
    p_org_id: orgId,
    p_event_type: 'number.released',
    p_event_source: 'system',
    p_resource_type: 'phone_number',
    p_resource_id: phoneNumberId,
    p_twilio_sid: phoneNumber.twilio_sid,
    p_description: `Released number ${phoneNumber.e164 || phoneNumber.retell_phone_number}`,
    p_metadata: {},
  })
  
  return {
    success: true,
  }
}

// ============================================================================
// Number Status Management
// ============================================================================

/**
 * Suspend a phone number (keep ownership but disable routing)
 */
export async function suspendNumber(
  orgId: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  
  // Update in database
  const { error } = await supabase
    .from('phone_numbers')
    .update({
      status: 'suspended',
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', phoneNumberId)
    .eq('org_id', orgId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Log event
  await supabase.rpc('log_telephony_event', {
    p_org_id: orgId,
    p_event_type: 'number.suspended',
    p_event_source: 'system',
    p_resource_type: 'phone_number',
    p_resource_id: phoneNumberId,
    p_description: 'Number suspended',
    p_metadata: {},
  })
  
  return { success: true }
}

/**
 * Resume a suspended phone number
 */
export async function resumeNumber(
  orgId: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  
  // Update in database
  const { error } = await supabase
    .from('phone_numbers')
    .update({
      status: 'active',
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', phoneNumberId)
    .eq('org_id', orgId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Log event
  await supabase.rpc('log_telephony_event', {
    p_org_id: orgId,
    p_event_type: 'number.resumed',
    p_event_source: 'system',
    p_resource_type: 'phone_number',
    p_resource_id: phoneNumberId,
    p_description: 'Number resumed',
    p_metadata: {},
  })
  
  return { success: true }
}

// ============================================================================
// Number Queries
// ============================================================================

/**
 * Get all phone numbers for an organization
 */
export async function getOrgPhoneNumbers(
  orgId: string,
  options?: {
    status?: string
    includeReleased?: boolean
  }
): Promise<PhoneNumberRecord[]> {
  const supabase = getSupabase()
  
  let query = supabase
    .from('phone_numbers')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  
  if (options?.status) {
    query = query.eq('status', options.status)
  } else if (!options?.includeReleased) {
    query = query.neq('status', 'released')
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching phone numbers:', error)
    return []
  }
  
  return data as PhoneNumberRecord[]
}

/**
 * Get a single phone number
 */
export async function getPhoneNumber(
  orgId: string,
  phoneNumberId: string
): Promise<PhoneNumberRecord | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('id', phoneNumberId)
    .eq('org_id', orgId)
    .single()
  
  if (error) {
    return null
  }
  
  return data as PhoneNumberRecord
}

/**
 * Get phone number by E.164
 */
export async function getPhoneNumberByE164(
  e164: string
): Promise<PhoneNumberRecord | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('e164', e164)
    .eq('status', 'active')
    .single()
  
  if (error) {
    return null
  }
  
  return data as PhoneNumberRecord
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format phone number for display
 */
export function formatPhoneNumber(e164: string): string {
  // US format: +1 (555) 123-4567
  if (e164.startsWith('+1') && e164.length === 12) {
    const areaCode = e164.substring(2, 5)
    const prefix = e164.substring(5, 8)
    const line = e164.substring(8)
    return `(${areaCode}) ${prefix}-${line}`
  }
  
  // Default: return as-is
  return e164
}

/**
 * Extract area code from E.164 number
 */
function extractAreaCode(e164: string): number | undefined {
  if (e164.startsWith('+1') && e164.length >= 5) {
    return parseInt(e164.substring(2, 5), 10)
  }
  return undefined
}

/**
 * Validate E.164 format
 */
export function isValidE164(number: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(number)
}
