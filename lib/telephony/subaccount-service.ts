/**
 * OPCALLS Phase 3: Subaccount Service
 * 
 * Manages Twilio subaccounts and SIP trunks for organizations.
 * Each organization gets its own Twilio subaccount for isolation.
 */

import { createClient } from '@supabase/supabase-js'
import { getTwilioProvider } from './twilio-provider'
import {
  TwilioAccountRecord,
  SipTrunkRecord,
  TelephonyError,
  TELEPHONY_ERRORS,
} from './types'

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

export interface CreateSubaccountResult {
  success: boolean
  account?: TwilioAccountRecord
  error?: string
}

export interface CreateTrunkResult {
  success: boolean
  trunk?: SipTrunkRecord
  error?: string
}

export interface ProvisionResult {
  success: boolean
  subaccount?: TwilioAccountRecord
  sipTrunk?: SipTrunkRecord
  error?: string
}

// ============================================================================
// Subaccount Operations
// ============================================================================

/**
 * Create a Twilio subaccount for an organization
 */
export async function createSubaccountForOrg(
  orgId: string,
  orgName: string
): Promise<CreateSubaccountResult> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  // Check if subaccount already exists
  const { data: existing } = await supabase
    .from('twilio_accounts')
    .select('*')
    .eq('org_id', orgId)
    .single()
  
  if (existing) {
    return {
      success: true,
      account: existing as TwilioAccountRecord,
    }
  }
  
  try {
    // Create Twilio subaccount
    const result = await provider.createSubaccount({
      friendlyName: `OPCalls - ${orgName}`,
      orgId,
    })
    
    // Store in database
    const { data: account, error: dbError } = await supabase
      .from('twilio_accounts')
      .insert({
        org_id: orgId,
        twilio_subaccount_sid: result.sid,
        // Note: In production, encrypt the auth token
        twilio_auth_token_encrypted: result.authToken,
        friendly_name: result.friendlyName,
        status: 'active',
      })
      .select()
      .single()
    
    if (dbError) {
      // Rollback: close the Twilio subaccount
      console.error('Failed to store subaccount, rolling back:', dbError)
      try {
        await provider.closeSubaccount(result.sid)
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError)
      }
      
      return {
        success: false,
        error: 'Failed to save subaccount',
      }
    }
    
    // Log event
    await supabase.rpc('log_telephony_event', {
      p_org_id: orgId,
      p_event_type: 'subaccount.created',
      p_event_source: 'system',
      p_resource_type: 'subaccount',
      p_resource_id: account.id,
      p_twilio_sid: result.sid,
      p_description: `Created Twilio subaccount: ${result.friendlyName}`,
      p_metadata: {},
    })
    
    return {
      success: true,
      account: account as TwilioAccountRecord,
    }
  } catch (error) {
    const message = error instanceof TelephonyError
      ? error.message
      : 'Failed to create subaccount'
    
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Get the Twilio subaccount for an organization
 */
export async function getOrgSubaccount(
  orgId: string
): Promise<TwilioAccountRecord | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('twilio_accounts')
    .select('*')
    .eq('org_id', orgId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as TwilioAccountRecord
}

/**
 * Suspend an organization's Twilio subaccount
 */
export async function suspendOrgSubaccount(
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  const account = await getOrgSubaccount(orgId)
  if (!account) {
    return { success: false, error: 'Subaccount not found' }
  }
  
  if (account.status === 'suspended') {
    return { success: true } // Already suspended
  }
  
  try {
    // Suspend in Twilio
    await provider.suspendSubaccount(account.twilio_subaccount_sid)
    
    // Update database
    await supabase
      .from('twilio_accounts')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id)
    
    // Also suspend all numbers
    await supabase
      .from('phone_numbers')
      .update({
        status: 'suspended',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('status', 'active')
    
    // Log event
    await supabase.rpc('log_telephony_event', {
      p_org_id: orgId,
      p_event_type: 'subaccount.suspended',
      p_event_source: 'system',
      p_resource_type: 'subaccount',
      p_resource_id: account.id,
      p_twilio_sid: account.twilio_subaccount_sid,
      p_description: 'Subaccount suspended',
      p_metadata: {},
    })
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof TelephonyError ? error.message : 'Suspend failed',
    }
  }
}

/**
 * Resume an organization's Twilio subaccount
 */
export async function resumeOrgSubaccount(
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  const account = await getOrgSubaccount(orgId)
  if (!account) {
    return { success: false, error: 'Subaccount not found' }
  }
  
  if (account.status === 'active') {
    return { success: true } // Already active
  }
  
  try {
    // Resume in Twilio
    await provider.resumeSubaccount(account.twilio_subaccount_sid)
    
    // Update database
    await supabase
      .from('twilio_accounts')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id)
    
    // Also resume all numbers
    await supabase
      .from('phone_numbers')
      .update({
        status: 'active',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('status', 'suspended')
    
    // Log event
    await supabase.rpc('log_telephony_event', {
      p_org_id: orgId,
      p_event_type: 'subaccount.resumed',
      p_event_source: 'system',
      p_resource_type: 'subaccount',
      p_resource_id: account.id,
      p_twilio_sid: account.twilio_subaccount_sid,
      p_description: 'Subaccount resumed',
      p_metadata: {},
    })
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof TelephonyError ? error.message : 'Resume failed',
    }
  }
}

// ============================================================================
// SIP Trunk Operations
// ============================================================================

/**
 * Create a SIP trunk for an organization
 */
export async function createSipTrunkForOrg(
  orgId: string,
  friendlyName?: string
): Promise<CreateTrunkResult> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  // Get subaccount
  const account = await getOrgSubaccount(orgId)
  if (!account) {
    return {
      success: false,
      error: 'Subaccount not found - create subaccount first',
    }
  }
  
  // Check if trunk already exists
  const { data: existing } = await supabase
    .from('sip_trunks')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()
  
  if (existing) {
    return {
      success: true,
      trunk: existing as SipTrunkRecord,
    }
  }
  
  try {
    // Create trunk in Twilio
    const result = await provider.createTrunk({
      friendlyName: friendlyName || `OPCalls Trunk - ${orgId}`,
      subaccountSid: account.twilio_subaccount_sid,
      secure: true,
    })
    
    // Store in database
    const { data: trunk, error: dbError } = await supabase
      .from('sip_trunks')
      .insert({
        org_id: orgId,
        twilio_account_id: account.id,
        twilio_trunk_sid: result.sid,
        friendly_name: result.friendlyName,
        termination_uri: result.terminationUri,
        origination_uris: result.originationUris,
        status: 'active',
        secure: result.secure,
        cnam_lookup_enabled: result.cnamLookupEnabled,
      })
      .select()
      .single()
    
    if (dbError) {
      // Rollback: delete the trunk
      console.error('Failed to store trunk, rolling back:', dbError)
      try {
        await provider.deleteTrunk(result.sid)
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError)
      }
      
      return {
        success: false,
        error: 'Failed to save SIP trunk',
      }
    }
    
    // Log event
    await supabase.rpc('log_telephony_event', {
      p_org_id: orgId,
      p_event_type: 'trunk.created',
      p_event_source: 'system',
      p_resource_type: 'sip_trunk',
      p_resource_id: trunk.id,
      p_twilio_sid: result.sid,
      p_description: `Created SIP trunk: ${result.friendlyName}`,
      p_metadata: { termination_uri: result.terminationUri },
    })
    
    return {
      success: true,
      trunk: trunk as SipTrunkRecord,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof TelephonyError
        ? error.message
        : 'Failed to create SIP trunk',
    }
  }
}

/**
 * Get the SIP trunk for an organization
 */
export async function getOrgSipTrunk(
  orgId: string
): Promise<SipTrunkRecord | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('sip_trunks')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as SipTrunkRecord
}

/**
 * Attach a phone number to an organization's SIP trunk
 */
export async function attachNumberToOrgTrunk(
  orgId: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  const provider = getTwilioProvider()
  
  // Get trunk
  const trunk = await getOrgSipTrunk(orgId)
  if (!trunk || !trunk.twilio_trunk_sid) {
    return { success: false, error: 'SIP trunk not found' }
  }
  
  // Get phone number
  const { data: phoneNumber } = await supabase
    .from('phone_numbers')
    .select('twilio_sid')
    .eq('id', phoneNumberId)
    .eq('org_id', orgId)
    .single()
  
  if (!phoneNumber?.twilio_sid) {
    return { success: false, error: 'Phone number not found' }
  }
  
  try {
    await provider.attachNumberToTrunk(trunk.twilio_trunk_sid, phoneNumber.twilio_sid)
    
    // Update phone number record
    await supabase
      .from('phone_numbers')
      .update({
        sip_trunk_id: trunk.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', phoneNumberId)
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof TelephonyError ? error.message : 'Attach failed',
    }
  }
}

// ============================================================================
// Full Provisioning
// ============================================================================

/**
 * Provision complete telephony infrastructure for an organization
 * Creates: Subaccount + SIP Trunk
 */
export async function provisionOrgTelephony(
  orgId: string,
  orgName: string
): Promise<ProvisionResult> {
  // 1. Create subaccount
  const subaccountResult = await createSubaccountForOrg(orgId, orgName)
  if (!subaccountResult.success) {
    return {
      success: false,
      error: subaccountResult.error,
    }
  }
  
  // 2. Create SIP trunk
  const trunkResult = await createSipTrunkForOrg(orgId, `${orgName} - Voice`)
  if (!trunkResult.success) {
    // Don't rollback subaccount - it can exist without trunk
    return {
      success: false,
      subaccount: subaccountResult.account,
      error: trunkResult.error,
    }
  }
  
  return {
    success: true,
    subaccount: subaccountResult.account,
    sipTrunk: trunkResult.trunk,
  }
}

/**
 * Check if an organization has telephony provisioned
 */
export async function isOrgTelephonyProvisioned(
  orgId: string
): Promise<{
  hasSubaccount: boolean
  hasSipTrunk: boolean
  isActive: boolean
}> {
  const [subaccount, trunk] = await Promise.all([
    getOrgSubaccount(orgId),
    getOrgSipTrunk(orgId),
  ])
  
  return {
    hasSubaccount: !!subaccount,
    hasSipTrunk: !!trunk,
    isActive: subaccount?.status === 'active',
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Verify telephony health for an organization
 */
export async function verifyOrgTelephonyHealth(
  orgId: string
): Promise<{
  healthy: boolean
  checks: Array<{
    name: string
    status: 'passed' | 'failed' | 'warning'
    message?: string
  }>
}> {
  const provider = getTwilioProvider()
  const checks: Array<{
    name: string
    status: 'passed' | 'failed' | 'warning'
    message?: string
  }> = []
  
  // Check 1: Subaccount exists and is active
  const subaccount = await getOrgSubaccount(orgId)
  if (!subaccount) {
    checks.push({
      name: 'subaccount',
      status: 'failed',
      message: 'Twilio subaccount not found',
    })
  } else if (subaccount.status !== 'active') {
    checks.push({
      name: 'subaccount',
      status: 'warning',
      message: `Subaccount status: ${subaccount.status}`,
    })
  } else {
    // Verify with Twilio
    try {
      const twilioAccount = await provider.getSubaccount(subaccount.twilio_subaccount_sid)
      if (twilioAccount) {
        checks.push({
          name: 'subaccount',
          status: 'passed',
          message: 'Subaccount active in Twilio',
        })
      } else {
        checks.push({
          name: 'subaccount',
          status: 'failed',
          message: 'Subaccount not found in Twilio',
        })
      }
    } catch {
      checks.push({
        name: 'subaccount',
        status: 'failed',
        message: 'Failed to verify with Twilio',
      })
    }
  }
  
  // Check 2: SIP trunk exists
  const trunk = await getOrgSipTrunk(orgId)
  if (!trunk) {
    checks.push({
      name: 'sip_trunk',
      status: 'warning',
      message: 'SIP trunk not configured',
    })
  } else if (trunk.status !== 'active') {
    checks.push({
      name: 'sip_trunk',
      status: 'warning',
      message: `SIP trunk status: ${trunk.status}`,
    })
  } else {
    checks.push({
      name: 'sip_trunk',
      status: 'passed',
      message: `SIP trunk active: ${trunk.termination_uri}`,
    })
  }
  
  // Check 3: At least one active phone number
  const supabase = getSupabase()
  const { count: phoneCount } = await supabase
    .from('phone_numbers')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')
  
  if (!phoneCount || phoneCount === 0) {
    checks.push({
      name: 'phone_numbers',
      status: 'warning',
      message: 'No active phone numbers',
    })
  } else {
    checks.push({
      name: 'phone_numbers',
      status: 'passed',
      message: `${phoneCount} active phone number(s)`,
    })
  }
  
  const healthy = checks.every(c => c.status !== 'failed')
  
  return { healthy, checks }
}
