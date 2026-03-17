/**
 * OPCALLS Phase 5: Job Runner
 * 
 * Core execution engine for provisioning jobs:
 * - Step-by-step execution
 * - Retry with exponential backoff
 * - Rollback on failure
 * - Idempotency
 */

import { createClient } from '@supabase/supabase-js'
import {
  ProvisioningJob,
  ProvisioningStep,
  JobStatus,
  StepStatus,
  StepResult,
  StepContext,
  Workflow,
  WorkflowStep,
  ProvisioningError,
  PROVISIONING_ERRORS,
  ProvisioningJobRecord,
  ProvisioningStepRecord,
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
// Configuration
// ============================================================================

const DEFAULT_MAX_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 60000

// ============================================================================
// Job Creation
// ============================================================================

/**
 * Create a new provisioning job (idempotent)
 */
export async function createJob(params: {
  orgId: string
  jobType: string
  inputParams: Record<string, unknown>
  workflow: Workflow
  triggeredBy?: 'system' | 'user' | 'admin' | 'webhook'
  triggeredByUserId?: string
  idempotencyKey?: string
}): Promise<ProvisioningJob> {
  const supabase = getSupabase()
  
  // Generate idempotency key if not provided
  const idempotencyKey = params.idempotencyKey || 
    `${params.orgId}:${params.jobType}:${Date.now()}`
  
  // Check for existing job with same idempotency key
  const { data: existing } = await supabase
    .from('provisioning_jobs')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single()
  
  if (existing) {
    return mapJobRecord(existing)
  }
  
  // Create job
  const { data: job, error: jobError } = await supabase
    .from('provisioning_jobs')
    .insert({
      org_id: params.orgId,
      job_type: params.jobType,
      idempotency_key: idempotencyKey,
      status: 'pending',
      total_steps: params.workflow.steps.length,
      input_params: params.inputParams,
      max_attempts: DEFAULT_MAX_ATTEMPTS,
      triggered_by: params.triggeredBy || 'system',
      triggered_by_user_id: params.triggeredByUserId,
    })
    .select()
    .single()
  
  if (jobError) {
    throw new ProvisioningError(
      PROVISIONING_ERRORS.INVALID_INPUT,
      `Failed to create job: ${jobError.message}`,
      false
    )
  }
  
  // Create step records
  const stepInserts = params.workflow.steps.map((step, index) => ({
    job_id: job.id,
    step_name: step.name,
    step_order: index + 1,
    status: 'pending',
    input_params: {},
  }))
  
  await supabase.from('provisioning_steps').insert(stepInserts)
  
  return mapJobRecord(job)
}

// ============================================================================
// Job Execution
// ============================================================================

/**
 * Execute a provisioning job
 */
export async function executeJob(
  jobId: string,
  workflow: Workflow
): Promise<ProvisioningJob> {
  const supabase = getSupabase()
  
  // Get job
  const job = await getJob(jobId)
  if (!job) {
    throw new ProvisioningError(
      PROVISIONING_ERRORS.JOB_NOT_FOUND,
      `Job not found: ${jobId}`,
      false
    )
  }
  
  // Check if already completed or running
  if (job.status === 'completed') {
    return job
  }
  
  if (job.status === 'running') {
    throw new ProvisioningError(
      PROVISIONING_ERRORS.JOB_ALREADY_RUNNING,
      `Job is already running: ${jobId}`,
      false
    )
  }
  
  // Update job status to running
  await supabase
    .from('provisioning_jobs')
    .update({
      status: 'running',
      started_at: job.startedAt ? undefined : new Date().toISOString(),
      attempt_count: job.attemptCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
  
  const stepResults: Record<string, StepResult> = { ...job.stepResults }
  
  try {
    // Execute each step in order
    for (const step of workflow.steps) {
      // Skip if already completed
      if (job.completedSteps.includes(step.name)) {
        continue
      }
      
      // Check skip condition
      const context = buildStepContext(job, step.name, stepResults)
      if (step.skipIf && step.skipIf(context)) {
        stepResults[step.name] = { status: 'skipped' }
        await updateStepStatus(jobId, step.name, 'skipped')
        continue
      }
      
      // Check dependencies
      if (step.dependsOn) {
        const dependenciesMet = step.dependsOn.every(
          dep => stepResults[dep]?.status === 'success'
        )
        if (!dependenciesMet) {
          throw new ProvisioningError(
            PROVISIONING_ERRORS.DEPENDENCY_FAILED,
            `Dependencies not met for step: ${step.name}`,
            false,
            step.name
          )
        }
      }
      
      // Update current step
      await supabase
        .from('provisioning_jobs')
        .update({ current_step: step.name, updated_at: new Date().toISOString() })
        .eq('id', jobId)
      
      // Execute step with retry
      const result = await executeStepWithRetry(job, step, stepResults)
      stepResults[step.name] = result
      
      if (result.status === 'failed') {
        // Attempt rollback
        await rollbackCompletedSteps(job, workflow, stepResults)
        
        // Update job as failed
        await supabase
          .from('provisioning_jobs')
          .update({
            status: 'failed',
            failed_step: step.name,
            last_error: result.error,
            step_results: stepResults,
            next_retry_at: calculateNextRetry(job.attemptCount),
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId)
        
        return await getJob(jobId) as ProvisioningJob
      }
    }
    
    // All steps completed
    await supabase
      .from('provisioning_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        step_results: stepResults,
        output: buildJobOutput(stepResults),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
    
    return await getJob(jobId) as ProvisioningJob
    
  } catch (error) {
    // Unexpected error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    await supabase
      .from('provisioning_jobs')
      .update({
        status: 'failed',
        last_error: errorMessage,
        next_retry_at: calculateNextRetry(job.attemptCount),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
    
    throw error
  }
}

/**
 * Execute a single step with retry logic
 */
async function executeStepWithRetry(
  job: ProvisioningJob,
  step: WorkflowStep,
  previousResults: Record<string, StepResult>
): Promise<StepResult> {
  const supabase = getSupabase()
  const maxRetries = step.maxRetries ?? (step.retryable ? 3 : 1)
  
  // Update step to running
  await supabase
    .from('provisioning_steps')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('job_id', job.id)
    .eq('step_name', step.name)
  
  let lastError: string | undefined
  let attemptCount = 0
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    attemptCount = attempt + 1
    
    try {
      const context = buildStepContext(job, step.name, previousResults, attemptCount)
      const startTime = Date.now()
      
      // Execute with timeout if specified
      let result
      if (step.timeoutMs) {
        result = await Promise.race([
          step.handler(context),
          timeout(step.timeoutMs, step.name),
        ])
      } else {
        result = await step.handler(context)
      }
      
      const durationMs = Date.now() - startTime
      
      if (result.success) {
        // Update step as completed
        await supabase
          .from('provisioning_steps')
          .update({
            status: 'completed',
            output: result.data,
            rollback_data: result.rollbackData,
            attempt_count: attemptCount,
            completed_at: new Date().toISOString(),
            duration_ms: durationMs,
          })
          .eq('job_id', job.id)
          .eq('step_name', step.name)
        
        // Update job completed_steps
        await supabase
          .from('provisioning_jobs')
          .update({
            completed_steps: [...job.completedSteps, step.name],
            step_results: { ...previousResults, [step.name]: { status: 'success', data: result.data, durationMs } },
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id)
        
        return { status: 'success', data: result.data, durationMs }
      } else {
        lastError = result.error
        
        // If not retryable, fail immediately
        if (!step.retryable) {
          break
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await delay(calculateRetryDelay(attempt))
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      
      if (!step.retryable || attempt === maxRetries - 1) {
        break
      }
      
      await delay(calculateRetryDelay(attempt))
    }
  }
  
  // All retries exhausted - mark as failed
  await supabase
    .from('provisioning_steps')
    .update({
      status: 'failed',
      error_message: lastError,
      attempt_count: attemptCount,
      completed_at: new Date().toISOString(),
    })
    .eq('job_id', job.id)
    .eq('step_name', step.name)
  
  return { status: 'failed', error: lastError }
}

/**
 * Rollback completed steps in reverse order
 */
async function rollbackCompletedSteps(
  job: ProvisioningJob,
  workflow: Workflow,
  stepResults: Record<string, StepResult>
): Promise<void> {
  const supabase = getSupabase()
  
  // Get completed steps in reverse order
  const completedSteps = [...job.completedSteps].reverse()
  
  for (const stepName of completedSteps) {
    const step = workflow.steps.find(s => s.name === stepName)
    if (!step?.rollbackHandler) continue
    
    const result = stepResults[stepName]
    if (!result || result.status !== 'success') continue
    
    try {
      const context = buildStepContext(job, stepName, stepResults)
      await step.rollbackHandler(context, result)
      
      // Update step status
      await supabase
        .from('provisioning_steps')
        .update({ status: 'rolled_back' })
        .eq('job_id', job.id)
        .eq('step_name', stepName)
      
    } catch (error) {
      console.error(`Rollback failed for step ${stepName}:`, error)
      // Continue with other rollbacks
    }
  }
}

// ============================================================================
// Job Queries
// ============================================================================

/**
 * Get a job by ID
 */
export async function getJob(jobId: string): Promise<ProvisioningJob | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('provisioning_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  if (error || !data) return null
  
  return mapJobRecord(data)
}

/**
 * Get job with steps
 */
export async function getJobWithSteps(jobId: string): Promise<{
  job: ProvisioningJob
  steps: ProvisioningStep[]
} | null> {
  const supabase = getSupabase()
  
  const { data: job } = await supabase
    .from('provisioning_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  if (!job) return null
  
  const { data: steps } = await supabase
    .from('provisioning_steps')
    .select('*')
    .eq('job_id', jobId)
    .order('step_order')
  
  return {
    job: mapJobRecord(job),
    steps: (steps || []).map(mapStepRecord),
  }
}

/**
 * Get jobs for an organization
 */
export async function getOrgJobs(
  orgId: string,
  options?: {
    status?: JobStatus
    jobType?: string
    limit?: number
  }
): Promise<ProvisioningJob[]> {
  const supabase = getSupabase()
  
  let query = supabase
    .from('provisioning_jobs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  
  if (options?.status) query = query.eq('status', options.status)
  if (options?.jobType) query = query.eq('job_type', options.jobType)
  if (options?.limit) query = query.limit(options.limit)
  
  const { data, error } = await query
  
  if (error) return []
  
  return data.map(mapJobRecord)
}

/**
 * Get jobs ready for retry
 */
export async function getRetryableJobs(limit: number = 10): Promise<ProvisioningJob[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('provisioning_jobs')
    .select('*')
    .eq('status', 'failed')
    .lt('attempt_count', supabase.rpc('get_max_attempts_column'))
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at')
    .limit(limit)
  
  if (error) return []
  
  return data.map(mapJobRecord)
}

// ============================================================================
// Job Management
// ============================================================================

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('provisioning_jobs')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', ['pending', 'paused', 'failed'])
  
  return !error
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const job = await getJob(jobId)
  if (!job || job.status !== 'failed') return false
  
  if (job.attemptCount >= job.maxAttempts) {
    return false // Max retries exceeded
  }
  
  // Reset to pending for retry
  const { error } = await supabase
    .from('provisioning_jobs')
    .update({
      status: 'pending',
      failed_step: null,
      last_error: null,
      next_retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
  
  return !error
}

// ============================================================================
// Helpers
// ============================================================================

function buildStepContext(
  job: ProvisioningJob,
  stepName: string,
  previousResults: Record<string, StepResult>,
  attemptNumber: number = 1
): StepContext {
  return {
    jobId: job.id,
    orgId: job.orgId,
    stepName,
    inputParams: job.inputParams,
    previousStepResults: previousResults,
    attemptNumber,
  }
}

function buildJobOutput(stepResults: Record<string, StepResult>): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  
  for (const [stepName, result] of Object.entries(stepResults)) {
    if (result.status === 'success' && result.data) {
      Object.assign(output, result.data)
    }
  }
  
  return output
}

function calculateRetryDelay(attempt: number): number {
  const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt)
  return Math.min(delay, MAX_RETRY_DELAY_MS)
}

function calculateNextRetry(attemptCount: number): string {
  const delayMs = calculateRetryDelay(attemptCount)
  return new Date(Date.now() + delayMs).toISOString()
}

async function updateStepStatus(
  jobId: string,
  stepName: string,
  status: StepStatus
): Promise<void> {
  const supabase = getSupabase()
  
  await supabase
    .from('provisioning_steps')
    .update({
      status,
      completed_at: ['completed', 'failed', 'skipped'].includes(status)
        ? new Date().toISOString()
        : null,
    })
    .eq('job_id', jobId)
    .eq('step_name', stepName)
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function timeout(ms: number, stepName: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new ProvisioningError(
        PROVISIONING_ERRORS.STEP_TIMEOUT,
        `Step timed out after ${ms}ms: ${stepName}`,
        true,
        stepName
      ))
    }, ms)
  })
}

function mapJobRecord(record: ProvisioningJobRecord): ProvisioningJob {
  return {
    id: record.id,
    orgId: record.org_id,
    jobType: record.job_type as ProvisioningJob['jobType'],
    idempotencyKey: record.idempotency_key,
    status: record.status as JobStatus,
    currentStep: record.current_step,
    completedSteps: record.completed_steps || [],
    failedStep: record.failed_step,
    totalSteps: record.total_steps,
    stepResults: record.step_results as Record<string, StepResult>,
    inputParams: record.input_params,
    output: record.output as Record<string, unknown>,
    attemptCount: record.attempt_count,
    maxAttempts: record.max_attempts,
    lastError: record.last_error,
    lastErrorCode: record.last_error_code,
    nextRetryAt: record.next_retry_at ? new Date(record.next_retry_at) : undefined,
    startedAt: record.started_at ? new Date(record.started_at) : undefined,
    completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
    triggeredBy: record.triggered_by as ProvisioningJob['triggeredBy'],
    triggeredByUserId: record.triggered_by_user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  }
}

function mapStepRecord(record: ProvisioningStepRecord): ProvisioningStep {
  return {
    id: record.id,
    jobId: record.job_id,
    stepName: record.step_name,
    stepOrder: record.step_order,
    status: record.status as StepStatus,
    inputParams: record.input_params,
    output: record.output as Record<string, unknown>,
    errorMessage: record.error_message,
    errorCode: record.error_code,
    attemptCount: record.attempt_count,
    startedAt: record.started_at ? new Date(record.started_at) : undefined,
    completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
    durationMs: record.duration_ms,
    rollbackData: record.rollback_data as Record<string, unknown>,
    createdAt: new Date(record.created_at),
  }
}
