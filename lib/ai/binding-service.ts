/**
 * OPCALLS Phase 4: Binding Service
 * 
 * Manages connections between phone numbers and AI agents.
 * Handles Retell phone number registration and agent binding.
 */

import { createClient } from '@supabase/supabase-js'
import { getRetellProvider } from './retell-provider'
import { AIError, AI_ERRORS, AgentBinding } from './types'

// ============================================================================
// Initialize
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

export interface BindingResult {
  success: boolean
  binding?: AgentBinding
  error?: string
}

// ============================================================================
// Binding Operations
// ============================================================================

/**
 * Bind a phone number to an agent
 */
export async function bindPhoneToAgent(
  orgId: string,
  phoneNumberId: string,
  agentId: string,
  bindingType: 'inbound' | 'outbound' | 'both' = 'inbound'
): Promise<BindingResult> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // Get phone number details
  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('e164, retell_phone_number, org_id')
    .eq('id', phoneNumberId)
    .eq('org_id', orgId)
    .single()
  
  if (phoneError || !phoneNumber) {
    return { success: false, error: 'Phone number not found' }
  }
  
  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from('retell_agents')
    .select('retell_agent_id, org_id')
    .eq('agent_id', agentId)
    .eq('org_id', orgId)
    .single()
  
  if (agentError || !agent) {
    return { success: false, error: 'Agent not found' }
  }
  
  // Check for existing binding
  const { data: existing } = await supabase
    .from('retell_bindings')
    .select('id')
    .eq('phone_number_id', phoneNumberId)
    .eq('status', 'active')
    .single()
  
  if (existing) {
    // Unbind first
    await unbindPhone(orgId, phoneNumberId)
  }
  
  const e164 = phoneNumber.e164 || phoneNumber.retell_phone_number
  const terminationUri = process.env.RETELL_TERMINATION_URI || 'sip.retellai.com'
  
  try {
    // Check if number is already in Retell
    const existingNumber = await retell.getPhoneNumber(e164)
    
    if (existingNumber) {
      // Update existing number
      await retell.updatePhoneNumber(e164, {
        inboundAgentId: bindingType !== 'outbound' ? agent.retell_agent_id : undefined,
        outboundAgentId: bindingType !== 'inbound' ? agent.retell_agent_id : undefined,
      })
    } else {
      // Import number to Retell
      await retell.importPhoneNumber({
        phoneNumber: e164,
        terminationUri,
        inboundAgentId: bindingType !== 'outbound' ? agent.retell_agent_id : undefined,
        outboundAgentId: bindingType !== 'inbound' ? agent.retell_agent_id : undefined,
      })
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof AIError ? error.message : 'Failed to bind in Retell',
    }
  }
  
  // Create binding record
  const { data: binding, error: bindError } = await supabase
    .from('retell_bindings')
    .insert({
      org_id: orgId,
      phone_number_id: phoneNumberId,
      retell_agent_id: agentId,
      retell_phone_number_id: e164,
      retell_agent_retell_id: agent.retell_agent_id,
      binding_type: bindingType,
      status: 'active',
      bound_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (bindError) {
    console.error('Failed to create binding record:', bindError)
    return { success: false, error: 'Failed to save binding' }
  }
  
  // Update phone_numbers record
  await supabase
    .from('phone_numbers')
    .update({
      agent_id: agentId,
      inbound_agent_id: bindingType !== 'outbound' ? agent.retell_agent_id : null,
      outbound_agent_id: bindingType !== 'inbound' ? agent.retell_agent_id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', phoneNumberId)
  
  return {
    success: true,
    binding: {
      id: binding.id,
      orgId: binding.org_id,
      phoneNumberId: binding.phone_number_id,
      retellAgentId: binding.retell_agent_id,
      bindingType: binding.binding_type,
      status: binding.status,
      boundAt: binding.bound_at,
    },
  }
}

/**
 * Unbind a phone number from its agent
 */
export async function unbindPhone(
  orgId: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // Get binding and phone number
  const { data: binding } = await supabase
    .from('retell_bindings')
    .select('*, phone_numbers(e164, retell_phone_number)')
    .eq('phone_number_id', phoneNumberId)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()
  
  if (!binding) {
    return { success: true } // Already unbound
  }
  
  const phoneNumber = binding.phone_numbers as { e164?: string; retell_phone_number: string }
  const e164 = phoneNumber?.e164 || phoneNumber?.retell_phone_number
  
  if (e164) {
    try {
      // Remove agent bindings in Retell
      await retell.updatePhoneNumber(e164, {
        inboundAgentId: undefined,
        outboundAgentId: undefined,
      })
    } catch (error) {
      // Continue even if Retell update fails
      console.error('Failed to unbind in Retell:', error)
    }
  }
  
  // Update binding record
  await supabase
    .from('retell_bindings')
    .update({
      status: 'suspended',
      unbound_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', binding.id)
  
  // Update phone_numbers record
  await supabase
    .from('phone_numbers')
    .update({
      agent_id: null,
      inbound_agent_id: null,
      outbound_agent_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', phoneNumberId)
  
  return { success: true }
}

/**
 * Suspend all bindings for an organization (used during billing suspension)
 */
export async function suspendOrgBindings(
  orgId: string
): Promise<{ success: boolean; suspended: number; error?: string }> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // Get all active bindings
  const { data: bindings, error } = await supabase
    .from('retell_bindings')
    .select('*, phone_numbers(e164, retell_phone_number)')
    .eq('org_id', orgId)
    .eq('status', 'active')
  
  if (error) {
    return { success: false, suspended: 0, error: 'Failed to fetch bindings' }
  }
  
  let suspended = 0
  
  for (const binding of bindings || []) {
    const phoneNumber = binding.phone_numbers as { e164?: string; retell_phone_number: string }
    const e164 = phoneNumber?.e164 || phoneNumber?.retell_phone_number
    
    if (e164) {
      try {
        await retell.updatePhoneNumber(e164, {
          inboundAgentId: undefined,
          outboundAgentId: undefined,
        })
      } catch {
        // Continue with other bindings
      }
    }
    
    await supabase
      .from('retell_bindings')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', binding.id)
    
    suspended++
  }
  
  return { success: true, suspended }
}

/**
 * Resume all suspended bindings for an organization
 */
export async function resumeOrgBindings(
  orgId: string
): Promise<{ success: boolean; resumed: number; error?: string }> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // Get all suspended bindings
  const { data: bindings, error } = await supabase
    .from('retell_bindings')
    .select('*, phone_numbers(e164, retell_phone_number), retell_agents(retell_agent_id)')
    .eq('org_id', orgId)
    .eq('status', 'suspended')
  
  if (error) {
    return { success: false, resumed: 0, error: 'Failed to fetch bindings' }
  }
  
  let resumed = 0
  
  for (const binding of bindings || []) {
    const phoneNumber = binding.phone_numbers as { e164?: string; retell_phone_number: string }
    const e164 = phoneNumber?.e164 || phoneNumber?.retell_phone_number
    const agent = binding.retell_agents as { retell_agent_id: string }
    
    if (e164 && agent?.retell_agent_id) {
      try {
        await retell.updatePhoneNumber(e164, {
          inboundAgentId: binding.binding_type !== 'outbound' ? agent.retell_agent_id : undefined,
          outboundAgentId: binding.binding_type !== 'inbound' ? agent.retell_agent_id : undefined,
        })
        
        await supabase
          .from('retell_bindings')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', binding.id)
        
        resumed++
      } catch {
        // Mark as failed
        await supabase
          .from('retell_bindings')
          .update({
            status: 'failed',
            error_message: 'Failed to resume binding',
            updated_at: new Date().toISOString(),
          })
          .eq('id', binding.id)
      }
    }
  }
  
  return { success: true, resumed }
}

// ============================================================================
// Binding Queries
// ============================================================================

/**
 * Get all bindings for an organization
 */
export async function getOrgBindings(
  orgId: string
): Promise<AgentBinding[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('retell_bindings')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching bindings:', error)
    return []
  }
  
  return data.map(b => ({
    id: b.id,
    orgId: b.org_id,
    phoneNumberId: b.phone_number_id,
    retellAgentId: b.retell_agent_id,
    bindingType: b.binding_type,
    status: b.status,
    errorMessage: b.error_message,
    boundAt: b.bound_at,
  }))
}

/**
 * Get binding for a specific phone number
 */
export async function getPhoneBinding(
  orgId: string,
  phoneNumberId: string
): Promise<AgentBinding | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('retell_bindings')
    .select('*')
    .eq('org_id', orgId)
    .eq('phone_number_id', phoneNumberId)
    .eq('status', 'active')
    .single()
  
  if (error || !data) return null
  
  return {
    id: data.id,
    orgId: data.org_id,
    phoneNumberId: data.phone_number_id,
    retellAgentId: data.retell_agent_id,
    bindingType: data.binding_type,
    status: data.status,
    errorMessage: data.error_message,
    boundAt: data.bound_at,
  }
}

/**
 * Check if an agent has any active bindings
 */
export async function hasActiveBindings(
  agentId: string
): Promise<boolean> {
  const supabase = getSupabase()
  
  const { count } = await supabase
    .from('retell_bindings')
    .select('*', { count: 'exact', head: true })
    .eq('retell_agent_id', agentId)
    .eq('status', 'active')
  
  return (count || 0) > 0
}
