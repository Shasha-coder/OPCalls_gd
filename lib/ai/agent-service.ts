/**
 * OPCALLS Phase 4: Agent Service
 * 
 * High-level service for creating and managing AI voice agents.
 * Integrates Retell provider with Supabase database.
 */

import { createClient } from '@supabase/supabase-js'
import { getRetellProvider } from './retell-provider'
import {
  CreateAgentParams,
  AgentConfig,
  VerticalType,
  AgentType,
  RetellAgentRecord,
  PromptTemplate,
  AIError,
  AI_ERRORS,
  AVAILABLE_VOICES,
} from './types'
import { checkCanCreateAgent } from '@/lib/billing/entitlements'

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

export interface CreateAgentResult {
  success: boolean
  agent?: {
    id: string
    retellAgentId: string
    name: string
  }
  error?: string
}

export interface AgentDetails {
  id: string
  orgId: string
  name: string
  type: AgentType
  industry: VerticalType
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

// ============================================================================
// Agent Creation
// ============================================================================

/**
 * Create a new AI voice agent
 */
export async function createAgent(
  params: CreateAgentParams
): Promise<CreateAgentResult> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // 1. Check entitlements
  const entitlementCheck = await checkCanCreateAgent(params.orgId)
  if (!entitlementCheck.allowed) {
    return {
      success: false,
      error: entitlementCheck.reason || 'Cannot create agent',
    }
  }
  
  // 2. Get prompt template
  const template = await getPromptTemplate(params.vertical, params.type)
  if (!template) {
    return {
      success: false,
      error: `No template found for ${params.vertical}/${params.type}`,
    }
  }
  
  // 3. Fill template with business info
  const { systemPrompt, greetingMessage } = fillTemplate(template, {
    agent_name: params.name,
    business_name: params.businessInfo.name,
    industry: params.businessInfo.industry,
    business_phone: params.businessInfo.phone || '',
    business_address: params.businessInfo.address || '',
    business_hours: params.businessInfo.hours || 'Monday-Friday 9am-5pm',
    custom_instructions: params.customInstructions || '',
    ...params.businessInfo.customFields,
  })
  
  // 4. Create agent in Retell
  const voiceId = params.voiceId || template.defaultVoiceId
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/retell`
  
  const agentConfig: AgentConfig = {
    name: `${params.businessInfo.name} - ${params.name}`,
    voiceId,
    systemPrompt,
    greetingMessage,
    webhookUrl,
    ...template.config,
  }
  
  let retellAgent
  try {
    retellAgent = await retell.createAgent(agentConfig)
  } catch (error) {
    return {
      success: false,
      error: error instanceof AIError ? error.message : 'Failed to create agent in Retell',
    }
  }
  
  // 5. Create agent record in database
  const { data: agentRecord, error: dbError } = await supabase
    .from('agents')
    .insert({
      org_id: params.orgId,
      name: params.name,
      type: params.type,
      industry: params.vertical,
      retell_agent_id: retellAgent.agent_id,
      retell_voice_id: voiceId,
      prompt: systemPrompt,
      languages: ['en'],
      primary_language: 'en',
      is_active: true,
    })
    .select()
    .single()
  
  if (dbError) {
    // Rollback: delete agent from Retell
    console.error('Failed to create agent record, rolling back:', dbError)
    try {
      await retell.deleteAgent(retellAgent.agent_id)
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError)
    }
    
    return {
      success: false,
      error: 'Failed to save agent',
    }
  }
  
  // 6. Create retell_agents record
  await supabase.from('retell_agents').insert({
    org_id: params.orgId,
    agent_id: agentRecord.id,
    retell_agent_id: retellAgent.agent_id,
    retell_llm_id: retellAgent.response_engine?.llm_id,
    voice_id: voiceId,
    webhook_url: webhookUrl,
    status: 'active',
    last_synced_at: new Date().toISOString(),
  })
  
  // 7. Create initial prompt version
  await supabase.rpc('create_prompt_version', {
    p_org_id: params.orgId,
    p_agent_id: agentRecord.id,
    p_system_prompt: systemPrompt,
    p_greeting_message: greetingMessage,
    p_created_by: 'system',
    p_reason: 'Initial agent creation',
  })
  
  return {
    success: true,
    agent: {
      id: agentRecord.id,
      retellAgentId: retellAgent.agent_id,
      name: params.name,
    },
  }
}

/**
 * Get prompt template by vertical and purpose
 */
async function getPromptTemplate(
  vertical: VerticalType,
  purpose: AgentType
): Promise<PromptTemplate | null> {
  const supabase = getSupabase()
  
  // Try exact match first
  let { data } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('vertical', vertical)
    .eq('purpose', purpose)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()
  
  // Fallback to generic
  if (!data) {
    const result = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('vertical', 'generic')
      .eq('purpose', purpose)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()
    
    data = result.data
  }
  
  // Final fallback to generic receptionist
  if (!data) {
    const result = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('vertical', 'generic')
      .eq('purpose', 'receptionist')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    data = result.data
  }
  
  if (!data) return null
  
  return {
    id: data.id,
    vertical: data.vertical,
    purpose: data.purpose,
    name: data.name,
    description: data.description,
    systemPrompt: data.system_prompt,
    greetingMessage: data.greeting_message,
    variables: data.variables || [],
    defaultVoiceId: data.default_voice_id,
    config: data.config || {},
    isActive: data.is_active,
    version: data.version,
  }
}

/**
 * Fill template variables
 */
function fillTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): { systemPrompt: string; greetingMessage: string } {
  let systemPrompt = template.systemPrompt
  let greetingMessage = template.greetingMessage || ''
  
  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    systemPrompt = systemPrompt.replace(regex, value)
    greetingMessage = greetingMessage.replace(regex, value)
  }
  
  return { systemPrompt, greetingMessage }
}

// ============================================================================
// Agent Updates
// ============================================================================

/**
 * Update an agent's configuration
 */
export async function updateAgent(
  orgId: string,
  agentId: string,
  updates: {
    name?: string
    voiceId?: string
    isActive?: boolean
    customInstructions?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // Get current agent
  const { data: agent, error: fetchError } = await supabase
    .from('agents')
    .select('*, retell_agents(*)')
    .eq('id', agentId)
    .eq('org_id', orgId)
    .single()
  
  if (fetchError || !agent) {
    return { success: false, error: 'Agent not found' }
  }
  
  const retellAgentId = agent.retell_agent_id
  
  // Update in Retell if needed
  if (updates.name || updates.voiceId) {
    try {
      await retell.updateAgent(retellAgentId, {
        name: updates.name,
        voiceId: updates.voiceId,
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof AIError ? error.message : 'Failed to update agent',
      }
    }
  }
  
  // Update in database
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name) dbUpdates.name = updates.name
  if (updates.voiceId) dbUpdates.retell_voice_id = updates.voiceId
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  
  await supabase
    .from('agents')
    .update(dbUpdates)
    .eq('id', agentId)
  
  // Update retell_agents record
  if (updates.voiceId) {
    await supabase
      .from('retell_agents')
      .update({
        voice_id: updates.voiceId,
        last_synced_at: new Date().toISOString(),
      })
      .eq('agent_id', agentId)
  }
  
  return { success: true }
}

/**
 * Update an agent's prompt
 */
export async function updateAgentPrompt(
  orgId: string,
  agentId: string,
  newPrompt: string,
  newGreeting?: string,
  reason?: string
): Promise<{ success: boolean; versionId?: string; error?: string }> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // Get agent and its LLM ID
  const { data: retellAgent } = await supabase
    .from('retell_agents')
    .select('retell_agent_id, retell_llm_id')
    .eq('agent_id', agentId)
    .eq('org_id', orgId)
    .single()
  
  if (!retellAgent?.retell_llm_id) {
    return { success: false, error: 'Agent LLM not found' }
  }
  
  // Update in Retell
  try {
    await retell.updateLLM(retellAgent.retell_llm_id, {
      systemPrompt: newPrompt,
      greetingMessage: newGreeting,
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof AIError ? error.message : 'Failed to update prompt',
    }
  }
  
  // Create new prompt version
  const { data: versionId } = await supabase.rpc('create_prompt_version', {
    p_org_id: orgId,
    p_agent_id: agentId,
    p_system_prompt: newPrompt,
    p_greeting_message: newGreeting || '',
    p_created_by: 'user',
    p_reason: reason || 'Manual update',
  })
  
  // Update agent record
  await supabase
    .from('agents')
    .update({ prompt: newPrompt, updated_at: new Date().toISOString() })
    .eq('id', agentId)
  
  return { success: true, versionId }
}

/**
 * Delete an agent
 */
export async function deleteAgent(
  orgId: string,
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  // Get agent
  const { data: agent } = await supabase
    .from('agents')
    .select('retell_agent_id')
    .eq('id', agentId)
    .eq('org_id', orgId)
    .single()
  
  if (!agent) {
    return { success: false, error: 'Agent not found' }
  }
  
  // Delete from Retell
  try {
    await retell.deleteAgent(agent.retell_agent_id)
  } catch (error) {
    // Continue even if Retell delete fails
    console.error('Failed to delete agent from Retell:', error)
  }
  
  // Soft delete in database (set inactive)
  await supabase
    .from('agents')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', agentId)
  
  // Update retell_agents status
  await supabase
    .from('retell_agents')
    .update({ status: 'deleted' })
    .eq('agent_id', agentId)
  
  return { success: true }
}

// ============================================================================
// Agent Queries
// ============================================================================

/**
 * Get all agents for an organization
 */
export async function getOrgAgents(
  orgId: string,
  options?: { includeInactive?: boolean }
): Promise<AgentDetails[]> {
  const supabase = getSupabase()
  
  let query = supabase
    .from('agents')
    .select(`
      *,
      retell_agents (voice_id),
      prompt_versions (version, success_rate)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  
  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching agents:', error)
    return []
  }
  
  return data.map(agent => {
    const voiceId = agent.retell_agents?.[0]?.voice_id || agent.retell_voice_id
    const voice = AVAILABLE_VOICES.find(v => v.id === voiceId)
    const activePrompt = agent.prompt_versions?.find((p: { version: number }) => 
      p.version === Math.max(...agent.prompt_versions.map((pv: { version: number }) => pv.version))
    )
    
    return {
      id: agent.id,
      orgId: agent.org_id,
      name: agent.name,
      type: agent.type as AgentType,
      industry: agent.industry as VerticalType,
      retellAgentId: agent.retell_agent_id,
      voiceId,
      voiceName: voice?.name || 'Unknown',
      isActive: agent.is_active,
      totalCalls: agent.total_calls,
      totalMinutes: agent.total_minutes,
      createdAt: agent.created_at,
      promptVersion: activePrompt ? {
        version: activePrompt.version,
        successRate: activePrompt.success_rate,
      } : undefined,
    }
  })
}

/**
 * Get a single agent
 */
export async function getAgent(
  orgId: string,
  agentId: string
): Promise<AgentDetails | null> {
  const agents = await getOrgAgents(orgId, { includeInactive: true })
  return agents.find(a => a.id === agentId) || null
}

/**
 * Get available prompt templates
 */
export async function getPromptTemplates(
  vertical?: VerticalType
): Promise<PromptTemplate[]> {
  const supabase = getSupabase()
  
  let query = supabase
    .from('prompt_templates')
    .select('*')
    .eq('is_active', true)
    .order('vertical')
    .order('purpose')
  
  if (vertical) {
    query = query.or(`vertical.eq.${vertical},vertical.eq.generic`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }
  
  return data.map(t => ({
    id: t.id,
    vertical: t.vertical,
    purpose: t.purpose,
    name: t.name,
    description: t.description,
    systemPrompt: t.system_prompt,
    greetingMessage: t.greeting_message,
    variables: t.variables || [],
    defaultVoiceId: t.default_voice_id,
    config: t.config || {},
    isActive: t.is_active,
    version: t.version,
  }))
}

/**
 * Get available voices
 */
export function getAvailableVoices() {
  return AVAILABLE_VOICES
}

// ============================================================================
// Agent Sync
// ============================================================================

/**
 * Sync agent state with Retell
 */
export async function syncAgentWithRetell(
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()
  const retell = getRetellProvider()
  
  const { data: retellAgent } = await supabase
    .from('retell_agents')
    .select('retell_agent_id')
    .eq('agent_id', agentId)
    .single()
  
  if (!retellAgent) {
    return { success: false, error: 'Retell agent not found' }
  }
  
  try {
    const agent = await retell.getAgent(retellAgent.retell_agent_id)
    
    if (!agent) {
      await supabase
        .from('retell_agents')
        .update({
          status: 'deleted',
          sync_error: 'Agent not found in Retell',
        })
        .eq('agent_id', agentId)
      
      return { success: false, error: 'Agent not found in Retell' }
    }
    
    await supabase
      .from('retell_agents')
      .update({
        voice_id: agent.voice_id,
        voice_model: agent.voice_model,
        last_synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('agent_id', agentId)
    
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed'
    
    await supabase
      .from('retell_agents')
      .update({ sync_error: errorMessage })
      .eq('agent_id', agentId)
    
    return { success: false, error: errorMessage }
  }
}
