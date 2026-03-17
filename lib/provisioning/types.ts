/**
 * OPCALLS Phase 5: Provisioning Types
 * 
 * Type definitions for durable provisioning jobs
 */

// ============================================================================
// Job Types
// ============================================================================

export type JobType = 
  | 'full_onboarding'
  | 'add_phone_number'
  | 'add_agent'
  | 'bind_agent'
  | 'repair_telephony'

export type JobStatus = 
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type StepStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'rolled_back'

export interface ProvisioningJob {
  id: string
  orgId: string
  jobType: JobType
  idempotencyKey: string
  status: JobStatus
  currentStep?: string
  completedSteps: string[]
  failedStep?: string
  totalSteps: number
  stepResults: Record<string, StepResult>
  inputParams: Record<string, unknown>
  output?: Record<string, unknown>
  attemptCount: number
  maxAttempts: number
  lastError?: string
  lastErrorCode?: string
  nextRetryAt?: Date
  startedAt?: Date
  completedAt?: Date
  triggeredBy: 'system' | 'user' | 'admin' | 'webhook'
  triggeredByUserId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProvisioningStep {
  id: string
  jobId: string
  stepName: string
  stepOrder: number
  status: StepStatus
  inputParams: Record<string, unknown>
  output?: Record<string, unknown>
  errorMessage?: string
  errorCode?: string
  attemptCount: number
  startedAt?: Date
  completedAt?: Date
  durationMs?: number
  rollbackData?: Record<string, unknown>
  createdAt: Date
}

export interface StepResult {
  status: 'success' | 'failed' | 'skipped'
  data?: Record<string, unknown>
  error?: string
  durationMs?: number
}

// ============================================================================
// Workflow Definition Types
// ============================================================================

export interface WorkflowStep {
  name: string
  description: string
  handler: StepHandler
  rollbackHandler?: RollbackHandler
  retryable: boolean
  maxRetries?: number
  timeoutMs?: number
  dependsOn?: string[]
  skipIf?: (context: StepContext) => boolean
}

export interface Workflow {
  type: JobType
  name: string
  description: string
  steps: WorkflowStep[]
}

export type StepHandler = (context: StepContext) => Promise<StepHandlerResult>
export type RollbackHandler = (context: StepContext, stepResult: StepResult) => Promise<void>

export interface StepContext {
  jobId: string
  orgId: string
  stepName: string
  inputParams: Record<string, unknown>
  previousStepResults: Record<string, StepResult>
  attemptNumber: number
}

export interface StepHandlerResult {
  success: boolean
  data?: Record<string, unknown>
  error?: string
  errorCode?: string
  rollbackData?: Record<string, unknown>
}

// ============================================================================
// Job Input Types
// ============================================================================

export interface FullOnboardingInput {
  businessName: string
  industry: string
  phone?: string
  address?: string
  hours?: string
  agentName: string
  agentType: string
  vertical?: string
  voiceId?: string
  customInstructions?: string
  phoneAreaCode?: string
  phoneType?: 'local' | 'toll_free'
}

export interface AddPhoneNumberInput {
  phoneNumber?: string // Specific number, or search params
  areaCode?: string
  type?: 'local' | 'toll_free'
  agentId?: string // Optionally bind to agent
}

export interface AddAgentInput {
  name: string
  type: string
  vertical?: string
  voiceId?: string
  customInstructions?: string
  phoneNumberId?: string // Optionally bind to number
}

export interface BindAgentInput {
  agentId: string
  phoneNumberId: string
  bindingType?: 'inbound' | 'outbound' | 'both'
}

// ============================================================================
// Job Output Types
// ============================================================================

export interface FullOnboardingOutput {
  twilioSubaccountSid?: string
  sipTrunkSid?: string
  phoneNumberId?: string
  phoneNumber?: string
  agentId?: string
  retellAgentId?: string
  bindingId?: string
}

export interface AddPhoneNumberOutput {
  phoneNumberId: string
  phoneNumber: string
  twilioSid: string
  bindingId?: string
}

export interface AddAgentOutput {
  agentId: string
  retellAgentId: string
  bindingId?: string
}

// ============================================================================
// Onboarding State Types
// ============================================================================

export type OnboardingStatus = 
  | 'not_started'
  | 'in_progress'
  | 'provisioning'
  | 'completed'
  | 'error'

export interface OnboardingState {
  id: string
  orgId: string
  currentStep: number
  totalSteps: number
  stepsCompleted: string[]
  stepData: OnboardingStepData
  provisioningJobId?: string
  status: OnboardingStatus
  errorMessage?: string
  startedAt: Date
  completedAt?: Date
  updatedAt: Date
}

export interface OnboardingStepData {
  // Step 1: Business Info
  businessInfo?: {
    name: string
    industry: string
    phone?: string
    address?: string
    website?: string
    timezone?: string
  }
  
  // Step 2: Business Hours
  businessHours?: {
    mon?: { open: string; close: string; enabled: boolean }
    tue?: { open: string; close: string; enabled: boolean }
    wed?: { open: string; close: string; enabled: boolean }
    thu?: { open: string; close: string; enabled: boolean }
    fri?: { open: string; close: string; enabled: boolean }
    sat?: { open: string; close: string; enabled: boolean }
    sun?: { open: string; close: string; enabled: boolean }
  }
  
  // Step 3: Agent Configuration
  agentConfig?: {
    name: string
    type: string
    voiceId: string
    customInstructions?: string
  }
  
  // Step 4: Phone Number Selection
  phoneConfig?: {
    areaCode?: string
    type: 'local' | 'toll_free'
    selectedNumber?: string
  }
  
  // Step 5: Review (no data, just confirmation)
  
  // Step 6: Provisioning (handled by job)
}

// ============================================================================
// Database Record Types
// ============================================================================

export interface ProvisioningJobRecord {
  id: string
  org_id: string
  job_type: string
  idempotency_key: string
  status: string
  current_step?: string
  completed_steps: string[]
  failed_step?: string
  total_steps: number
  step_results: Record<string, unknown>
  input_params: Record<string, unknown>
  output?: Record<string, unknown>
  attempt_count: number
  max_attempts: number
  last_error?: string
  last_error_code?: string
  next_retry_at?: string
  started_at?: string
  completed_at?: string
  triggered_by: string
  triggered_by_user_id?: string
  created_at: string
  updated_at: string
}

export interface ProvisioningStepRecord {
  id: string
  job_id: string
  step_name: string
  step_order: number
  status: string
  input_params: Record<string, unknown>
  output?: Record<string, unknown>
  error_message?: string
  error_code?: string
  attempt_count: number
  started_at?: string
  completed_at?: string
  duration_ms?: number
  rollback_data?: Record<string, unknown>
  created_at: string
}

export interface OnboardingStateRecord {
  id: string
  org_id: string
  current_step: number
  total_steps: number
  steps_completed: string[]
  step_data: Record<string, unknown>
  provisioning_job_id?: string
  status: string
  error_message?: string
  started_at: string
  completed_at?: string
  updated_at: string
}

// ============================================================================
// Error Types
// ============================================================================

export class ProvisioningError extends Error {
  code: string
  retryable: boolean
  stepName?: string
  
  constructor(
    code: string,
    message: string,
    retryable: boolean = false,
    stepName?: string
  ) {
    super(message)
    this.name = 'ProvisioningError'
    this.code = code
    this.retryable = retryable
    this.stepName = stepName
  }
}

export const PROVISIONING_ERRORS = {
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_ALREADY_RUNNING: 'JOB_ALREADY_RUNNING',
  JOB_ALREADY_COMPLETED: 'JOB_ALREADY_COMPLETED',
  STEP_FAILED: 'STEP_FAILED',
  STEP_TIMEOUT: 'STEP_TIMEOUT',
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
  ROLLBACK_FAILED: 'ROLLBACK_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',
} as const
