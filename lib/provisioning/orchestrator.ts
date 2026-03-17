/**
 * OPCALLS Phase 5: Orchestrator
 * 
 * High-level orchestration for provisioning:
 * - Start and monitor jobs
 * - Manage onboarding state
 * - Process retry queue
 */

import { createClient } from '@supabase/supabase-js'
import { createJob, executeJob, getJob, getJobWithSteps, retryJob } from './job-runner'
import { getWorkflow, WORKFLOWS } from './workflows'
import {
  ProvisioningJob,
  ProvisioningStep,
  OnboardingState,
  OnboardingStepData,
  OnboardingStatus,
  FullOnboardingInput,
  OnboardingStateRecord,
} from './types'

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
// Job Orchestration
// ============================================================================

/**
 * Start a new provisioning job
 */
export async function startProvisioningJob(params: {
  orgId: string
  jobType: string
  inputParams: Record<string, unknown>
  triggeredBy?: 'system' | 'user' | 'admin' | 'webhook'
  triggeredByUserId?: string
}): Promise<{ jobId: string; status: string }> {
  const workflow = getWorkflow(params.jobType)
  
  if (!workflow) {
    throw new Error(`Unknown job type: ${params.jobType}`)
  }
  
  // Create the job
  const job = await createJob({
    orgId: params.orgId,
    jobType: params.jobType,
    inputParams: params.inputParams,
    workflow,
    triggeredBy: params.triggeredBy,
    triggeredByUserId: params.triggeredByUserId,
  })
  
  // Execute asynchronously (don't await)
  executeJob(job.id, workflow).catch(error => {
    console.error(`Job ${job.id} failed:`, error)
  })
  
  return {
    jobId: job.id,
    status: 'running',
  }
}

/**
 * Execute a job synchronously (for simple jobs)
 */
export async function executeProvisioningJob(params: {
  orgId: string
  jobType: string
  inputParams: Record<string, unknown>
  triggeredBy?: 'system' | 'user' | 'admin' | 'webhook'
  triggeredByUserId?: string
}): Promise<ProvisioningJob> {
  const workflow = getWorkflow(params.jobType)
  
  if (!workflow) {
    throw new Error(`Unknown job type: ${params.jobType}`)
  }
  
  const job = await createJob({
    orgId: params.orgId,
    jobType: params.jobType,
    inputParams: params.inputParams,
    workflow,
    triggeredBy: params.triggeredBy,
    triggeredByUserId: params.triggeredByUserId,
  })
  
  return await executeJob(job.id, workflow)
}

/**
 * Get job status with steps
 */
export async function getProvisioningStatus(jobId: string): Promise<{
  job: ProvisioningJob
  steps: ProvisioningStep[]
  progress: number
} | null> {
  const result = await getJobWithSteps(jobId)
  if (!result) return null
  
  const completedCount = result.steps.filter(
    s => s.status === 'completed' || s.status === 'skipped'
  ).length
  const progress = Math.round((completedCount / result.steps.length) * 100)
  
  return {
    ...result,
    progress,
  }
}

/**
 * Process retry queue (call from cron)
 */
export async function processRetryQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const supabase = getSupabase()
  
  // Get failed jobs ready for retry
  const { data: jobs } = await supabase
    .from('provisioning_jobs')
    .select('*')
    .eq('status', 'failed')
    .lte('next_retry_at', new Date().toISOString())
    .lt('attempt_count', 3) // max_attempts
    .order('next_retry_at')
    .limit(10)
  
  if (!jobs || jobs.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 }
  }
  
  let succeeded = 0
  let failed = 0
  
  for (const jobRecord of jobs) {
    const workflow = getWorkflow(jobRecord.job_type)
    if (!workflow) continue
    
    try {
      // Reset job for retry
      await supabase
        .from('provisioning_jobs')
        .update({
          status: 'pending',
          failed_step: null,
          last_error: null,
          next_retry_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobRecord.id)
      
      // Execute
      const result = await executeJob(jobRecord.id, workflow)
      
      if (result.status === 'completed') {
        succeeded++
      } else {
        failed++
      }
    } catch (error) {
      failed++
      console.error(`Retry failed for job ${jobRecord.id}:`, error)
    }
  }
  
  return {
    processed: jobs.length,
    succeeded,
    failed,
  }
}

// ============================================================================
// Onboarding State Management
// ============================================================================

/**
 * Get or create onboarding state for an organization
 */
export async function getOnboardingState(orgId: string): Promise<OnboardingState> {
  const supabase = getSupabase()
  
  // Try to get existing state
  const { data: existing } = await supabase
    .from('onboarding_state')
    .select('*')
    .eq('org_id', orgId)
    .single()
  
  if (existing) {
    return mapOnboardingRecord(existing)
  }
  
  // Create new state
  const { data: created, error } = await supabase
    .from('onboarding_state')
    .insert({
      org_id: orgId,
      current_step: 1,
      total_steps: 6,
      steps_completed: [],
      step_data: {},
      status: 'not_started',
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create onboarding state: ${error.message}`)
  }
  
  return mapOnboardingRecord(created)
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(
  orgId: string,
  step: number,
  stepName: string,
  stepData: Partial<OnboardingStepData>
): Promise<OnboardingState> {
  const supabase = getSupabase()
  
  // Get current state
  const current = await getOnboardingState(orgId)
  
  // Merge step data
  const newStepData = {
    ...current.stepData,
    ...stepData,
  }
  
  // Update completed steps
  const stepsCompleted = current.stepsCompleted.includes(stepName)
    ? current.stepsCompleted
    : [...current.stepsCompleted, stepName]
  
  // Update state
  const { data, error } = await supabase
    .from('onboarding_state')
    .update({
      current_step: step + 1,
      steps_completed: stepsCompleted,
      step_data: newStepData,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update onboarding step: ${error.message}`)
  }
  
  return mapOnboardingRecord(data)
}

/**
 * Start provisioning from onboarding
 */
export async function startOnboardingProvisioning(
  orgId: string
): Promise<{ jobId: string }> {
  const supabase = getSupabase()
  
  // Get onboarding state
  const state = await getOnboardingState(orgId)
  
  if (!state.stepData.businessInfo || !state.stepData.agentConfig) {
    throw new Error('Onboarding data incomplete')
  }
  
  // Build provisioning input from onboarding data
  const input: FullOnboardingInput = {
    businessName: state.stepData.businessInfo.name,
    industry: state.stepData.businessInfo.industry,
    phone: state.stepData.businessInfo.phone,
    address: state.stepData.businessInfo.address,
    hours: formatBusinessHours(state.stepData.businessHours),
    agentName: state.stepData.agentConfig.name,
    agentType: state.stepData.agentConfig.type,
    voiceId: state.stepData.agentConfig.voiceId,
    customInstructions: state.stepData.agentConfig.customInstructions,
    phoneAreaCode: state.stepData.phoneConfig?.areaCode,
    phoneType: state.stepData.phoneConfig?.type,
  }
  
  // Start provisioning job
  const { jobId } = await startProvisioningJob({
    orgId,
    jobType: 'full_onboarding',
    inputParams: input,
    triggeredBy: 'user',
  })
  
  // Update onboarding state
  await supabase
    .from('onboarding_state')
    .update({
      status: 'provisioning',
      provisioning_job_id: jobId,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
  
  return { jobId }
}

/**
 * Complete onboarding after successful provisioning
 */
export async function completeOnboarding(orgId: string): Promise<void> {
  const supabase = getSupabase()
  
  await supabase
    .from('onboarding_state')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
  
  // Update organization
  await supabase
    .from('organizations')
    .update({
      onboarding_complete: true,
      onboarding_step: 6,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
}

/**
 * Mark onboarding as errored
 */
export async function failOnboarding(orgId: string, error: string): Promise<void> {
  const supabase = getSupabase()
  
  await supabase
    .from('onboarding_state')
    .update({
      status: 'error',
      error_message: error,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
}

/**
 * Poll provisioning status and update onboarding
 */
export async function checkOnboardingProvisioning(
  orgId: string
): Promise<{
  status: OnboardingStatus
  progress?: number
  job?: ProvisioningJob
  error?: string
}> {
  const state = await getOnboardingState(orgId)
  
  if (!state.provisioningJobId) {
    return { status: state.status }
  }
  
  const jobStatus = await getProvisioningStatus(state.provisioningJobId)
  
  if (!jobStatus) {
    return { status: state.status }
  }
  
  const { job, progress } = jobStatus
  
  // Update onboarding based on job status
  if (job.status === 'completed') {
    await completeOnboarding(orgId)
    return {
      status: 'completed',
      progress: 100,
      job,
    }
  }
  
  if (job.status === 'failed') {
    await failOnboarding(orgId, job.lastError || 'Provisioning failed')
    return {
      status: 'error',
      progress,
      job,
      error: job.lastError,
    }
  }
  
  return {
    status: 'provisioning',
    progress,
    job,
  }
}

// ============================================================================
// Helpers
// ============================================================================

function formatBusinessHours(hours?: OnboardingStepData['businessHours']): string {
  if (!hours) return 'Monday-Friday 9am-5pm'
  
  const days: string[] = []
  const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const fullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  dayNames.forEach((day, index) => {
    const schedule = hours[day]
    if (schedule?.enabled) {
      days.push(`${fullNames[index]} ${schedule.open}-${schedule.close}`)
    }
  })
  
  return days.join(', ') || 'By appointment'
}

function mapOnboardingRecord(record: OnboardingStateRecord): OnboardingState {
  return {
    id: record.id,
    orgId: record.org_id,
    currentStep: record.current_step,
    totalSteps: record.total_steps,
    stepsCompleted: record.steps_completed || [],
    stepData: record.step_data as OnboardingStepData,
    provisioningJobId: record.provisioning_job_id,
    status: record.status as OnboardingStatus,
    errorMessage: record.error_message,
    startedAt: new Date(record.started_at),
    completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
    updatedAt: new Date(record.updated_at),
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  getJob,
  getJobWithSteps,
  retryJob,
} from './job-runner'

export {
  WORKFLOWS,
  getWorkflow,
} from './workflows'
