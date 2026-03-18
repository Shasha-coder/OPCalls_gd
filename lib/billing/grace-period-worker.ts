/**
 * OPCALLS Phase 2: Grace Period Worker
 * 
 * Handles the dunning flow:
 * 1. Payment fails → past_due (grace period starts)
 * 2. Grace period expires → restricted (outbound blocked)
 * 3. Still unpaid → suspended (all service blocked)
 * 4. Payment recovered → active (service restored)
 * 
 * This worker runs on a schedule (e.g., every hour via cron)
 */

import { createClient } from '@supabase/supabase-js'
import { 
  BillingStateMachine, 
  GRACE_PERIOD_CONFIG,
  isGracePeriodExpired,
  SubscriptionStatus,
  SideEffect 
} from './billing-state-machine'
import { recalculateEntitlements } from './entitlements'
import { logBillingEvent } from './utils'
import { executeSideEffects } from './suspend-resume-flow'

// ============================================================================
// Initialize
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// Types
// ============================================================================

interface GraceExpiredSubscription {
  id: string
  org_id: string
  status: SubscriptionStatus
  grace_period_end: string
  payment_failure_count: number
}

interface WorkerResult {
  processed: number
  transitioned: number
  errors: number
  details: Array<{
    orgId: string
    action: string
    success: boolean
    error?: string
  }>
}

// ============================================================================
// Main Worker Function
// ============================================================================

/**
 * Process all subscriptions with expired grace periods
 */
export async function processExpiredGracePeriods(): Promise<WorkerResult> {
  const result: WorkerResult = {
    processed: 0,
    transitioned: 0,
    errors: 0,
    details: []
  }
  
  const now = new Date()
  
  try {
    // Find subscriptions in past_due with expired grace period
    const { data: pastDueExpired, error: pdError } = await supabase
      .from('subscriptions')
      .select('id, org_id, status, grace_period_end, payment_failure_count')
      .eq('status', 'past_due')
      .lt('grace_period_end', now.toISOString())
      .not('grace_period_end', 'is', null)
      
    if (pdError) {
      console.error('Error fetching past_due subscriptions:', pdError)
      throw pdError
    }
    
    // Process past_due → restricted transitions
    for (const sub of pastDueExpired || []) {
      result.processed++
      
      try {
        await transitionToRestricted(sub)
        result.transitioned++
        result.details.push({
          orgId: sub.org_id,
          action: 'past_due → restricted',
          success: true
        })
      } catch (error) {
        result.errors++
        result.details.push({
          orgId: sub.org_id,
          action: 'past_due → restricted',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Find restricted subscriptions that should be suspended
    // (e.g., after additional grace period or immediately based on config)
    const restrictedCutoff = new Date()
    restrictedCutoff.setDate(restrictedCutoff.getDate() - GRACE_PERIOD_CONFIG.restrictedGraceDays)
    
    const { data: restrictedExpired, error: rError } = await supabase
      .from('subscriptions')
      .select('id, org_id, status, grace_period_end, payment_failure_count')
      .eq('status', 'restricted')
      .lt('updated_at', restrictedCutoff.toISOString())
      
    if (rError) {
      console.error('Error fetching restricted subscriptions:', rError)
      throw rError
    }
    
    // Process restricted → suspended transitions
    for (const sub of restrictedExpired || []) {
      result.processed++
      
      try {
        await transitionToSuspended(sub)
        result.transitioned++
        result.details.push({
          orgId: sub.org_id,
          action: 'restricted → suspended',
          success: true
        })
      } catch (error) {
        result.errors++
        result.details.push({
          orgId: sub.org_id,
          action: 'restricted → suspended',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Log worker run
    await logWorkerRun(result)
    
    return result
    
  } catch (error) {
    console.error('Grace period worker error:', error)
    throw error
  }
}

// ============================================================================
// Transition Functions
// ============================================================================

/**
 * Transition subscription from past_due to restricted
 */
async function transitionToRestricted(sub: GraceExpiredSubscription): Promise<void> {
  const stateMachine = new BillingStateMachine(sub.status)
  const transitionResult = stateMachine.transition('GRACE_EXPIRED')
  
  if (!transitionResult.success) {
    throw new Error(transitionResult.error)
  }
  
  // Update subscription status
  const newGraceEnd = new Date()
  newGraceEnd.setDate(newGraceEnd.getDate() + GRACE_PERIOD_CONFIG.restrictedGraceDays)
  
  await supabase
    .from('subscriptions')
    .update({
      status: 'restricted',
      grace_period_end: newGraceEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)
  
  // Execute side effects
  await executeSideEffects(sub.org_id, transitionResult.sideEffects)
  
  // Log event
  await logBillingEvent({
    orgId: sub.org_id,
    subscriptionId: sub.id,
    eventType: 'grace.expired',
    eventSource: 'system',
    previousStatus: 'past_due',
    newStatus: 'restricted',
    description: 'Grace period expired, service restricted'
  })
}

/**
 * Transition subscription from restricted to suspended
 */
async function transitionToSuspended(sub: GraceExpiredSubscription): Promise<void> {
  const stateMachine = new BillingStateMachine(sub.status)
  const transitionResult = stateMachine.transition('SUSPEND')
  
  if (!transitionResult.success) {
    throw new Error(transitionResult.error)
  }
  
  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'suspended',
      grace_period_end: null, // Clear grace period
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)
  
  // Execute side effects (includes telephony suspension)
  await executeSideEffects(sub.org_id, transitionResult.sideEffects)
  
  // Log event
  await logBillingEvent({
    orgId: sub.org_id,
    subscriptionId: sub.id,
    eventType: 'service.suspended',
    eventSource: 'system',
    previousStatus: 'restricted',
    newStatus: 'suspended',
    description: 'Service suspended due to non-payment'
  })
}

// ============================================================================
// Warning Notifications
// ============================================================================

/**
 * Send grace period warning emails
 * Run daily to warn users before grace period expires
 */
export async function sendGraceWarnings(): Promise<WorkerResult> {
  const result: WorkerResult = {
    processed: 0,
    transitioned: 0,
    errors: 0,
    details: []
  }
  
  // Warning thresholds (days before expiry)
  const warningThresholds = [3, 1] // 3 days and 1 day warnings
  
  for (const daysBeforeExpiry of warningThresholds) {
    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() + daysBeforeExpiry)
    const warningDateStart = new Date(warningDate)
    warningDateStart.setHours(0, 0, 0, 0)
    const warningDateEnd = new Date(warningDate)
    warningDateEnd.setHours(23, 59, 59, 999)
    
    // Find subscriptions with grace period ending on warning date
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select(`
        id, 
        org_id, 
        status, 
        grace_period_end,
        organizations (
          id,
          name,
          profiles (
            email
          )
        )
      `)
      .in('status', ['past_due', 'restricted'])
      .gte('grace_period_end', warningDateStart.toISOString())
      .lte('grace_period_end', warningDateEnd.toISOString())
      
    if (error) {
      console.error('Error fetching subscriptions for warning:', error)
      continue
    }
    
    for (const sub of subs || []) {
      result.processed++
      
      try {
        await sendGraceWarningEmail(sub, daysBeforeExpiry)
        result.transitioned++
        result.details.push({
          orgId: sub.org_id,
          action: `${daysBeforeExpiry}-day warning sent`,
          success: true
        })
      } catch (error) {
        result.errors++
        result.details.push({
          orgId: sub.org_id,
          action: `${daysBeforeExpiry}-day warning`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }
  
  return result
}

/**
 * Send a grace period warning email
 */
async function sendGraceWarningEmail(
  subscription: {
    org_id: string
    status: string
    grace_period_end: string
    organizations: unknown
  },
  daysRemaining: number
): Promise<void> {
  // Handle both array and object responses from Supabase join
  const orgs = subscription.organizations as unknown
  const orgRaw = Array.isArray(orgs) ? orgs[0] : orgs
  const org = orgRaw as { name?: string; profiles?: Array<{ email: string }> } | null
  
  // Get notification template
  const { data: template } = await supabase
    .from('notification_templates')
    .select('subject, body')
    .eq('code', 'grace_period_ending')
    .single()
    
  if (!template) {
    console.warn('Grace period warning template not found')
    return
  }
  
  // TODO: Actually send email via notification provider
  // For now, just log it
  console.log(`[NOTIFICATION] Grace warning for ${org?.name || 'Unknown Org'}:`, {
    to: org?.profiles?.[0]?.email,
    subject: template.subject,
    daysRemaining,
    status: subscription.status,
  })
  
  // Log notification event
  await supabase
    .from('billing_events')
    .insert({
      org_id: subscription.org_id,
      event_type: 'notification.grace_warning',
      event_source: 'system',
      description: `${daysRemaining}-day grace period warning sent`,
      processed: true,
      processed_at: new Date().toISOString(),
    })
}

// ============================================================================
// Retry Payment
// ============================================================================

/**
 * Attempt to retry failed payments
 * Run periodically to attempt collection on past_due subscriptions
 */
export async function retryFailedPayments(): Promise<WorkerResult> {
  const result: WorkerResult = {
    processed: 0,
    transitioned: 0,
    errors: 0,
    details: []
  }
  
  // Only retry once per day, and only if not too many failures
  const retryThreshold = 3 // Max retry attempts before giving up
  
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, org_id, stripe_subscription_id, payment_failure_count, last_payment_attempt')
    .eq('status', 'past_due')
    .lt('payment_failure_count', retryThreshold)
    
  if (error) {
    console.error('Error fetching subscriptions for retry:', error)
    return result
  }
  
  for (const sub of subs || []) {
    // Check if we should retry (at least 24 hours since last attempt)
    if (sub.last_payment_attempt) {
      const lastAttempt = new Date(sub.last_payment_attempt)
      const hoursSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastAttempt < 24) {
        continue
      }
    }
    
    result.processed++
    
    try {
      // Stripe will automatically retry payments based on Smart Retries
      // We just need to log that we're tracking it
      await supabase
        .from('subscriptions')
        .update({
          last_payment_attempt: new Date().toISOString(),
        })
        .eq('id', sub.id)
        
      result.details.push({
        orgId: sub.org_id,
        action: 'payment retry tracked',
        success: true
      })
    } catch (error) {
      result.errors++
      result.details.push({
        orgId: sub.org_id,
        action: 'payment retry',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return result
}

// ============================================================================
// Usage Threshold Alerts
// ============================================================================

/**
 * Check usage thresholds and send alerts
 */
export async function checkUsageThresholds(): Promise<WorkerResult> {
  const result: WorkerResult = {
    processed: 0,
    transitioned: 0,
    errors: 0,
    details: []
  }
  
  // Get all active subscriptions with their usage and limits
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      org_id,
      plans (
        included_minutes
      ),
      entitlements (
        max_minutes,
        current_month_spend_cents,
        soft_spend_limit_cents
      )
    `)
    .eq('status', 'active')
    
  if (error) {
    console.error('Error fetching subscriptions for usage check:', error)
    return result
  }
  
  // Get current month start
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  for (const sub of subs || []) {
    result.processed++
    
    // Handle both array and object responses from Supabase join
    const plansRaw = sub.plans as unknown
    const plan = (Array.isArray(plansRaw) ? plansRaw[0] : plansRaw) as { included_minutes: number } | null
    const entsRaw = sub.entitlements as unknown
    const entitlements = (Array.isArray(entsRaw) ? entsRaw[0] : entsRaw) as { 
      max_minutes: number
      current_month_spend_cents: number
      soft_spend_limit_cents: number | null 
    } | null
    
    if (!plan || !entitlements) continue
    
    // Get current usage
    const { data: usage } = await supabase
      .from('usage_records')
      .select('total_minutes')
      .eq('org_id', sub.org_id)
      .gte('period_start', monthStart.toISOString())
      .single()
      
    const currentMinutes = usage?.total_minutes || 0
    const usagePercent = (currentMinutes / plan.included_minutes) * 100
    
    // Check 80% threshold
    if (usagePercent >= 80 && usagePercent < 100) {
      try {
        await sendUsageAlert(sub.org_id, 80, currentMinutes, plan.included_minutes)
        result.transitioned++
        result.details.push({
          orgId: sub.org_id,
          action: '80% usage alert sent',
          success: true
        })
      } catch (error) {
        result.errors++
      }
    }
    
    // Check 100% threshold
    if (usagePercent >= 100) {
      try {
        await sendUsageAlert(sub.org_id, 100, currentMinutes, plan.included_minutes)
        result.transitioned++
        result.details.push({
          orgId: sub.org_id,
          action: '100% usage alert sent',
          success: true
        })
      } catch (error) {
        result.errors++
      }
    }
  }
  
  return result
}

async function sendUsageAlert(
  orgId: string,
  threshold: number,
  usedMinutes: number,
  includedMinutes: number
): Promise<void> {
  const templateCode = threshold === 100 
    ? 'usage_threshold_100' 
    : 'usage_threshold_80'
  
  // Check if we already sent this alert this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const { data: existingAlert } = await supabase
    .from('billing_events')
    .select('id')
    .eq('org_id', orgId)
    .eq('event_type', `notification.${templateCode}`)
    .gte('created_at', monthStart.toISOString())
    .single()
    
  if (existingAlert) {
    // Already sent this month
    return
  }
  
  // TODO: Send actual notification
  console.log(`[USAGE ALERT] ${orgId}: ${threshold}% threshold (${usedMinutes}/${includedMinutes})`)
  
  // Log the alert
  await supabase
    .from('billing_events')
    .insert({
      org_id: orgId,
      event_type: `notification.${templateCode}`,
      event_source: 'system',
      description: `Usage alert: ${threshold}% threshold reached`,
      metadata: { usedMinutes, includedMinutes, threshold },
      processed: true,
      processed_at: new Date().toISOString(),
    })
}

// ============================================================================
// Worker Run Logging
// ============================================================================

async function logWorkerRun(result: WorkerResult): Promise<void> {
  await supabase
    .from('cron_jobs')
    .insert({
      job_name: 'grace_period_worker',
      status: result.errors > 0 ? 'completed_with_errors' : 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      result: result,
    })
}

// ============================================================================
// Cron Handler (for API route)
// ============================================================================

/**
 * Main entry point for cron job
 * Can be called via: GET /api/cron/grace-periods
 */
export async function handleGracePeriodCron(): Promise<{
  graceResults: WorkerResult
  warningResults: WorkerResult
  retryResults: WorkerResult
  usageResults: WorkerResult
}> {
  console.log('Starting grace period worker...')
  
  const [graceResults, warningResults, retryResults, usageResults] = await Promise.all([
    processExpiredGracePeriods(),
    sendGraceWarnings(),
    retryFailedPayments(),
    checkUsageThresholds(),
  ])
  
  console.log('Grace period worker completed:', {
    graceResults: { processed: graceResults.processed, errors: graceResults.errors },
    warningResults: { processed: warningResults.processed, errors: warningResults.errors },
    retryResults: { processed: retryResults.processed, errors: retryResults.errors },
    usageResults: { processed: usageResults.processed, errors: usageResults.errors },
  })
  
  return { graceResults, warningResults, retryResults, usageResults }
}
