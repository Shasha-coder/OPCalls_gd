/**
 * OPCALLS Phase 5: Workflows
 * 
 * Pre-defined workflows for provisioning jobs.
 * Each workflow is a sequence of steps with handlers.
 */

import {
  Workflow,
  WorkflowStep,
  StepContext,
  StepHandlerResult,
  FullOnboardingInput,
  AddPhoneNumberInput,
  AddAgentInput,
  BindAgentInput,
} from './types'
import {
  createSubaccountForOrg,
  createSipTrunkForOrg,
} from '@/lib/telephony/subaccount-service'
import {
  searchAvailableNumbers,
  purchaseNumber,
  releaseNumber,
} from '@/lib/telephony/number-service'
import {
  createAgent,
  deleteAgent,
} from '@/lib/ai/agent-service'
import {
  bindPhoneToAgent,
  unbindPhone,
} from '@/lib/ai/binding-service'

// ============================================================================
// FULL ONBOARDING WORKFLOW
// ============================================================================

const fullOnboardingSteps: WorkflowStep[] = [
  {
    name: 'create_subaccount',
    description: 'Create Twilio subaccount for organization',
    retryable: true,
    maxRetries: 3,
    timeoutMs: 30000,
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as FullOnboardingInput
      
      const result = await createSubaccountForOrg(ctx.orgId, input.businessName)
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          twilioSubaccountSid: result.account?.twilio_subaccount_sid,
          twilioAccountId: result.account?.id,
        },
        rollbackData: {
          twilioSubaccountSid: result.account?.twilio_subaccount_sid,
        },
      }
    },
    rollbackHandler: async (ctx: StepContext, stepResult) => {
      // Subaccount rollback would require closing the account
      // For now, log the orphaned account
      console.warn('Subaccount created but workflow failed, orphaned:', stepResult.data)
    },
  },
  
  {
    name: 'create_sip_trunk',
    description: 'Create SIP trunk for voice routing',
    retryable: true,
    maxRetries: 3,
    timeoutMs: 30000,
    dependsOn: ['create_subaccount'],
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as FullOnboardingInput
      
      const result = await createSipTrunkForOrg(ctx.orgId, `${input.businessName} - Voice`)
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          sipTrunkSid: result.trunk?.twilio_trunk_sid,
          sipTrunkId: result.trunk?.id,
          terminationUri: result.trunk?.termination_uri,
        },
        rollbackData: {
          sipTrunkSid: result.trunk?.twilio_trunk_sid,
        },
      }
    },
  },
  
  {
    name: 'search_phone_number',
    description: 'Search for available phone numbers',
    retryable: true,
    maxRetries: 2,
    timeoutMs: 15000,
    dependsOn: ['create_subaccount'],
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as FullOnboardingInput
      
      const result = await searchAvailableNumbers({
        orgId: ctx.orgId,
        country: 'US',
        type: input.phoneType || 'local',
        areaCode: input.phoneAreaCode,
        limit: 5,
      })
      
      if (result.numbers.length === 0) {
        return {
          success: false,
          error: 'No phone numbers available in the requested area',
        }
      }
      
      // Select the first available number
      const selectedNumber = result.numbers[0]
      
      return {
        success: true,
        data: {
          availableNumbers: result.numbers,
          selectedNumber: selectedNumber.phoneNumber,
        },
      }
    },
  },
  
  {
    name: 'purchase_phone_number',
    description: 'Purchase the selected phone number',
    retryable: true,
    maxRetries: 2,
    timeoutMs: 30000,
    dependsOn: ['search_phone_number'],
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as FullOnboardingInput
      const searchResult = ctx.previousStepResults['search_phone_number']
      
      const phoneNumber = searchResult?.data?.selectedNumber as string
      if (!phoneNumber) {
        return { success: false, error: 'No phone number selected' }
      }
      
      const result = await purchaseNumber({
        orgId: ctx.orgId,
        phoneNumber,
        friendlyName: `${input.businessName} - Main`,
      })
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          phoneNumberId: result.phoneNumber?.id,
          phoneNumber: result.phoneNumber?.e164,
          twilioSid: result.phoneNumber?.twilio_sid,
        },
        rollbackData: {
          phoneNumberId: result.phoneNumber?.id,
        },
      }
    },
    rollbackHandler: async (ctx: StepContext, stepResult) => {
      const phoneNumberId = stepResult.rollbackData?.phoneNumberId as string
      if (phoneNumberId) {
        await releaseNumber(ctx.orgId, phoneNumberId)
      }
    },
  },
  
  {
    name: 'create_agent',
    description: 'Create AI voice agent',
    retryable: true,
    maxRetries: 3,
    timeoutMs: 60000,
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as FullOnboardingInput
      
      const result = await createAgent({
        orgId: ctx.orgId,
        name: input.agentName || 'AI Receptionist',
        type: (input.agentType as 'receptionist' | 'booking' | 'support') || 'receptionist',
        vertical: (input.vertical as any) || 'generic',
        voiceId: input.voiceId,
        customInstructions: input.customInstructions,
        businessInfo: {
          name: input.businessName,
          industry: input.industry,
          phone: input.phone,
          address: input.address,
          hours: input.hours,
        },
      })
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          agentId: result.agent?.id,
          retellAgentId: result.agent?.retellAgentId,
        },
        rollbackData: {
          agentId: result.agent?.id,
        },
      }
    },
    rollbackHandler: async (ctx: StepContext, stepResult) => {
      const agentId = stepResult.rollbackData?.agentId as string
      if (agentId) {
        await deleteAgent(ctx.orgId, agentId)
      }
    },
  },
  
  {
    name: 'bind_agent_to_number',
    description: 'Connect agent to phone number',
    retryable: true,
    maxRetries: 3,
    timeoutMs: 30000,
    dependsOn: ['purchase_phone_number', 'create_agent'],
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const phoneResult = ctx.previousStepResults['purchase_phone_number']
      const agentResult = ctx.previousStepResults['create_agent']
      
      const phoneNumberId = phoneResult?.data?.phoneNumberId as string
      const agentId = agentResult?.data?.agentId as string
      
      if (!phoneNumberId || !agentId) {
        return {
          success: false,
          error: 'Missing phone number or agent ID',
        }
      }
      
      const result = await bindPhoneToAgent(ctx.orgId, phoneNumberId, agentId, 'inbound')
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          bindingId: result.binding?.id,
        },
        rollbackData: {
          phoneNumberId,
        },
      }
    },
    rollbackHandler: async (ctx: StepContext, stepResult) => {
      const phoneNumberId = stepResult.rollbackData?.phoneNumberId as string
      if (phoneNumberId) {
        await unbindPhone(ctx.orgId, phoneNumberId)
      }
    },
  },
]

export const FULL_ONBOARDING_WORKFLOW: Workflow = {
  type: 'full_onboarding',
  name: 'Full Onboarding',
  description: 'Complete setup: Twilio subaccount, SIP trunk, phone number, AI agent, and binding',
  steps: fullOnboardingSteps,
}

// ============================================================================
// ADD PHONE NUMBER WORKFLOW
// ============================================================================

const addPhoneNumberSteps: WorkflowStep[] = [
  {
    name: 'search_phone_number',
    description: 'Search for available phone numbers',
    retryable: true,
    maxRetries: 2,
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as AddPhoneNumberInput
      
      // If specific number provided, skip search
      if (input.phoneNumber) {
        return {
          success: true,
          data: { selectedNumber: input.phoneNumber },
        }
      }
      
      const result = await searchAvailableNumbers({
        orgId: ctx.orgId,
        country: 'US',
        type: input.type || 'local',
        areaCode: input.areaCode,
        limit: 5,
      })
      
      if (result.numbers.length === 0) {
        return {
          success: false,
          error: 'No phone numbers available',
        }
      }
      
      return {
        success: true,
        data: {
          availableNumbers: result.numbers,
          selectedNumber: result.numbers[0].phoneNumber,
        },
      }
    },
  },
  
  {
    name: 'purchase_phone_number',
    description: 'Purchase the selected phone number',
    retryable: true,
    maxRetries: 2,
    dependsOn: ['search_phone_number'],
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const searchResult = ctx.previousStepResults['search_phone_number']
      const phoneNumber = searchResult?.data?.selectedNumber as string
      
      if (!phoneNumber) {
        return { success: false, error: 'No phone number selected' }
      }
      
      const result = await purchaseNumber({
        orgId: ctx.orgId,
        phoneNumber,
      })
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          phoneNumberId: result.phoneNumber?.id,
          phoneNumber: result.phoneNumber?.e164,
          twilioSid: result.phoneNumber?.twilio_sid,
        },
        rollbackData: {
          phoneNumberId: result.phoneNumber?.id,
        },
      }
    },
    rollbackHandler: async (ctx: StepContext, stepResult) => {
      const phoneNumberId = stepResult.rollbackData?.phoneNumberId as string
      if (phoneNumberId) {
        await releaseNumber(ctx.orgId, phoneNumberId)
      }
    },
  },
  
  {
    name: 'bind_to_agent',
    description: 'Bind number to agent (if specified)',
    retryable: true,
    maxRetries: 2,
    dependsOn: ['purchase_phone_number'],
    skipIf: (ctx: StepContext) => !(ctx.inputParams as AddPhoneNumberInput).agentId,
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as AddPhoneNumberInput
      const purchaseResult = ctx.previousStepResults['purchase_phone_number']
      const phoneNumberId = purchaseResult?.data?.phoneNumberId as string
      
      if (!input.agentId || !phoneNumberId) {
        return { success: true, data: {} } // Skip binding
      }
      
      const result = await bindPhoneToAgent(ctx.orgId, phoneNumberId, input.agentId, 'inbound')
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: { bindingId: result.binding?.id },
      }
    },
  },
]

export const ADD_PHONE_NUMBER_WORKFLOW: Workflow = {
  type: 'add_phone_number',
  name: 'Add Phone Number',
  description: 'Search for and purchase a new phone number',
  steps: addPhoneNumberSteps,
}

// ============================================================================
// ADD AGENT WORKFLOW
// ============================================================================

const addAgentSteps: WorkflowStep[] = [
  {
    name: 'create_agent',
    description: 'Create AI voice agent',
    retryable: true,
    maxRetries: 3,
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as AddAgentInput
      
      // Get org info for business details
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: org } = await supabase
        .from('organizations')
        .select('name, industry')
        .eq('id', ctx.orgId)
        .single()
      
      const result = await createAgent({
        orgId: ctx.orgId,
        name: input.name,
        type: input.type as any,
        vertical: (input.vertical as any) || 'generic',
        voiceId: input.voiceId,
        customInstructions: input.customInstructions,
        businessInfo: {
          name: org?.name || 'Business',
          industry: org?.industry || 'other',
        },
      })
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          agentId: result.agent?.id,
          retellAgentId: result.agent?.retellAgentId,
        },
        rollbackData: {
          agentId: result.agent?.id,
        },
      }
    },
    rollbackHandler: async (ctx: StepContext, stepResult) => {
      const agentId = stepResult.rollbackData?.agentId as string
      if (agentId) {
        await deleteAgent(ctx.orgId, agentId)
      }
    },
  },
  
  {
    name: 'bind_to_number',
    description: 'Bind agent to phone number (if specified)',
    retryable: true,
    maxRetries: 2,
    dependsOn: ['create_agent'],
    skipIf: (ctx: StepContext) => !(ctx.inputParams as AddAgentInput).phoneNumberId,
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as AddAgentInput
      const agentResult = ctx.previousStepResults['create_agent']
      const agentId = agentResult?.data?.agentId as string
      
      if (!input.phoneNumberId || !agentId) {
        return { success: true, data: {} }
      }
      
      const result = await bindPhoneToAgent(ctx.orgId, input.phoneNumberId, agentId, 'inbound')
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: { bindingId: result.binding?.id },
      }
    },
  },
]

export const ADD_AGENT_WORKFLOW: Workflow = {
  type: 'add_agent',
  name: 'Add Agent',
  description: 'Create a new AI voice agent',
  steps: addAgentSteps,
}

// ============================================================================
// BIND AGENT WORKFLOW
// ============================================================================

const bindAgentSteps: WorkflowStep[] = [
  {
    name: 'bind_agent_to_number',
    description: 'Connect agent to phone number',
    retryable: true,
    maxRetries: 3,
    handler: async (ctx: StepContext): Promise<StepHandlerResult> => {
      const input = ctx.inputParams as BindAgentInput
      
      const result = await bindPhoneToAgent(
        ctx.orgId,
        input.phoneNumberId,
        input.agentId,
        input.bindingType || 'inbound'
      )
      
      if (!result.success) {
        return { success: false, error: result.error }
      }
      
      return {
        success: true,
        data: {
          bindingId: result.binding?.id,
          phoneNumberId: input.phoneNumberId,
          agentId: input.agentId,
        },
      }
    },
  },
]

export const BIND_AGENT_WORKFLOW: Workflow = {
  type: 'bind_agent',
  name: 'Bind Agent',
  description: 'Connect an agent to a phone number',
  steps: bindAgentSteps,
}

// ============================================================================
// WORKFLOW REGISTRY
// ============================================================================

export const WORKFLOWS: Record<string, Workflow> = {
  full_onboarding: FULL_ONBOARDING_WORKFLOW,
  add_phone_number: ADD_PHONE_NUMBER_WORKFLOW,
  add_agent: ADD_AGENT_WORKFLOW,
  bind_agent: BIND_AGENT_WORKFLOW,
}

export function getWorkflow(jobType: string): Workflow | undefined {
  return WORKFLOWS[jobType]
}
