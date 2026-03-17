/**
 * OPCALLS Phase 2: Suspend/Resume Flow
 * 
 * Handles service suspension and resumption:
 * - Telephony suspension (Twilio subaccount)
 * - AI agent unbinding
 * - Health checks after resume
 * - Notification dispatch
 */

import { createClient } from '@supabase/supabase-js'
import { SideEffect, BillingStateMachine } from './billing-state-machine'
import { recalculateEntitlements } from './entitlements'
import { logBillingEvent } from './utils'
import { 
  suspendOrgSubaccount, 
  resumeOrgSubaccount,
  verifyOrgTelephonyHealth 
} from '@/lib/telephony'
import { suspendOrgBindings, resumeOrgBindings } from '@/lib/ai'

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

interface HealthCheckResult {
  passed: boolean
  checks: Array<{
    name: string
    status: 'passed' | 'failed' | 'warning'
    message?: string
  }>
  timestamp: string
}

interface SuspendResult {
  success: boolean
  actions: string[]
  errors: string[]
}

interface ResumeResult {
  success: boolean
  actions: string[]
  errors: string[]
  healthCheck?: HealthCheckResult
}

// ============================================================================
// Side Effect Executor
// ============================================================================

/**
 * Execute side effects from state machine transitions
 */
export async function executeSideEffects(
  orgId: string,
  sideEffects: SideEffect[]
): Promise<void> {
  for (const effect of sideEffects) {
    try {
      switch (effect) {
        case 'RECALCULATE_ENTITLEMENTS':
          await recalculateEntitlements(orgId)
          break
          
        case 'START_GRACE_PERIOD':
          await startGracePeriod(orgId)
          break
          
        case 'CLEAR_GRACE_PERIOD':
          await clearGracePeriod(orgId)
          break
          
        case 'SUSPEND_TELEPHONY':
          await suspendTelephony(orgId)
          break
          
        case 'RESUME_TELEPHONY':
          await resumeTelephony(orgId)
          break
          
        case 'RUN_HEALTH_CHECK':
          await runHealthCheck(orgId)
          break
          
        case 'SEND_PAYMENT_FAILED_EMAIL':
          await sendNotification(orgId, 'payment_failed')
          break
          
        case 'SEND_GRACE_WARNING_EMAIL':
          await sendNotification(orgId, 'grace_period_ending')
          break
          
        case 'SEND_SUSPENDED_EMAIL':
          await sendNotification(orgId, 'service_suspended')
          break
          
        case 'SEND_RESUMED_EMAIL':
          await sendNotification(orgId, 'service_resumed')
          break
          
        case 'SEND_CANCELED_EMAIL':
          await sendNotification(orgId, 'subscription_canceled')
          break
          
        case 'SCHEDULE_DATA_RETENTION':
          await scheduleDataRetention(orgId)
          break
          
        case 'LOG_AUDIT_EVENT':
          // Already logged by the caller
          break
          
        default:
          console.warn(`Unknown side effect: ${effect}`)
      }
    } catch (error) {
      console.error(`Error executing side effect ${effect}:`, error)
      // Continue with other side effects
    }
  }
}

// ============================================================================
// Grace Period Management
// ============================================================================

async function startGracePeriod(orgId: string): Promise<void> {
  const gracePeriodEnd = new Date()
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7) // 7 day grace
  
  await supabase
    .from('subscriptions')
    .update({
      grace_period_start: new Date().toISOString(),
      grace_period_end: gracePeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
}

async function clearGracePeriod(orgId: string): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      grace_period_start: null,
      grace_period_end: null,
      payment_failure_count: 0,
      last_payment_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
}

// ============================================================================
// Telephony Suspension
// ============================================================================

/**
 * Suspend telephony services for an organization
 */
export async function suspendTelephony(orgId: string): Promise<SuspendResult> {
  const result: SuspendResult = {
    success: true,
    actions: [],
    errors: []
  }
  
  try {
    // 1. Get Twilio subaccount
    const { data: twilioAccount } = await supabase
      .from('twilio_accounts')
      .select('twilio_subaccount_sid')
      .eq('org_id', orgId)
      .single()
    
    if (twilioAccount?.twilio_subaccount_sid) {
      // Suspend Twilio subaccount
      await suspendTwilioSubaccount(twilioAccount.twilio_subaccount_sid)
      result.actions.push('Twilio subaccount suspended')
      
      // Update status
      await supabase
        .from('twilio_accounts')
        .update({ 
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId)
    }
    
    // 2. Update phone numbers
    await supabase
      .from('phone_numbers')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('status', 'active')
    
    result.actions.push('Phone numbers suspended')
    
    // 3. Suspend AI agent bindings at org level
    const bindingSuspendResult = await suspendOrgBindings(orgId)
    if (bindingSuspendResult.suspended > 0) {
      result.actions.push(`Suspended ${bindingSuspendResult.suspended} agent bindings`)
    }
    
    // Update agents status
    await supabase
      .from('agents')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('is_active', true)
    
    // 4. Log suspension
    await logBillingEvent({
      orgId,
      eventType: 'telephony.suspended',
      eventSource: 'system',
      description: 'Telephony services suspended',
      metadata: { actions: result.actions, errors: result.errors }
    })
    
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }
  
  return result
}

/**
 * Resume telephony services for an organization
 */
export async function resumeTelephony(orgId: string): Promise<ResumeResult> {
  const result: ResumeResult = {
    success: true,
    actions: [],
    errors: []
  }
  
  try {
    // 1. Resume Twilio subaccount
    const { data: twilioAccount } = await supabase
      .from('twilio_accounts')
      .select('twilio_subaccount_sid')
      .eq('org_id', orgId)
      .single()
    
    if (twilioAccount?.twilio_subaccount_sid) {
      await resumeTwilioSubaccount(twilioAccount.twilio_subaccount_sid)
      result.actions.push('Twilio subaccount resumed')
      
      await supabase
        .from('twilio_accounts')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId)
    }
    
    // 2. Resume phone numbers
    await supabase
      .from('phone_numbers')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('status', 'suspended')
    
    result.actions.push('Phone numbers resumed')
    
    // 3. Resume AI agent bindings at org level
    const bindingResumeResult = await resumeOrgBindings(orgId)
    if (bindingResumeResult.resumed > 0) {
      result.actions.push(`Resumed ${bindingResumeResult.resumed} agent bindings`)
    }
    
    // Update agents status
    await supabase
      .from('agents')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('is_active', false)
    
    // 4. Run health check
    result.healthCheck = await runHealthCheck(orgId)
    
    // 5. Log resumption
    await logBillingEvent({
      orgId,
      eventType: 'telephony.resumed',
      eventSource: 'system',
      description: 'Telephony services resumed',
      metadata: { 
        actions: result.actions, 
        errors: result.errors,
        healthCheck: result.healthCheck
      }
    })
    
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }
  
  return result
}

// ============================================================================
// Twilio Integration (Provider Abstraction)
// ============================================================================

/**
 * Suspend a Twilio subaccount
 */
async function suspendTwilioSubaccount(subaccountSid: string): Promise<void> {
  // TODO: Implement actual Twilio API call
  // For now, this is a placeholder
  console.log(`[TWILIO] Suspending subaccount: ${subaccountSid}`)
  
  // Use the real telephony provider
  const { getTwilioProvider } = await import('@/lib/telephony')
  const provider = getTwilioProvider()
  await provider.suspendSubaccount(subaccountSid)
}

/**
 * Resume a Twilio subaccount
 */
async function resumeTwilioSubaccount(subaccountSid: string): Promise<void> {
  console.log(`[TWILIO] Resuming subaccount: ${subaccountSid}`)
  
  // Use the real telephony provider
  const { getTwilioProvider } = await import('@/lib/telephony')
  const provider = getTwilioProvider()
  await provider.resumeSubaccount(subaccountSid)
}

// ============================================================================
// Retell Integration (Provider Abstraction)
// ============================================================================

/**
 * Unbind agent from phone numbers
 */
async function unbindAgentNumbers(_agentId: string): Promise<void> {
  // This is now handled by suspendOrgBindings at the org level
  // Individual agent unbinding is done through the binding service
  console.log(`[RETELL] Agent unbinding handled by suspendOrgBindings`)
}

/**
 * Rebind agent to phone numbers
 */
async function rebindAgentNumbers(_orgId: string, _agentId: string): Promise<void> {
  // This is now handled by resumeOrgBindings at the org level
  // Individual agent rebinding is done through the binding service
  console.log(`[RETELL] Agent rebinding handled by resumeOrgBindings`)
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Run health check after resume
 */
export async function runHealthCheck(orgId: string): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = []
  const timestamp = new Date().toISOString()
  
  try {
    // 1. Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('org_id', orgId)
      .single()
    
    checks.push({
      name: 'subscription_status',
      status: subscription?.status === 'active' ? 'passed' : 'failed',
      message: `Subscription status: ${subscription?.status || 'not found'}`
    })
    
    // 2. Check entitlements
    const { data: entitlements } = await supabase
      .from('entitlements')
      .select('can_receive_calls, can_make_calls')
      .eq('org_id', orgId)
      .single()
    
    checks.push({
      name: 'entitlements',
      status: entitlements?.can_receive_calls ? 'passed' : 'failed',
      message: entitlements?.can_receive_calls 
        ? 'Entitlements allow service' 
        : 'Entitlements block service'
    })
    
    // 3. Check Twilio account
    const { data: twilioAccount } = await supabase
      .from('twilio_accounts')
      .select('status')
      .eq('org_id', orgId)
      .single()
    
    checks.push({
      name: 'twilio_account',
      status: twilioAccount?.status === 'active' ? 'passed' : 'failed',
      message: `Twilio status: ${twilioAccount?.status || 'not found'}`
    })
    
    // 4. Check phone numbers exist
    const { count: numberCount } = await supabase
      .from('phone_numbers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active')
    
    checks.push({
      name: 'phone_numbers',
      status: (numberCount || 0) > 0 ? 'passed' : 'failed',
      message: `Active numbers: ${numberCount || 0}`
    })
    
    // 5. Check agents exist
    const { count: agentCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active')
    
    checks.push({
      name: 'agents',
      status: (agentCount || 0) > 0 ? 'passed' : 'failed',
      message: `Active agents: ${agentCount || 0}`
    })
    
    // 6. Verify telephony health using real provider
    try {
      const telephonyHealth = await verifyOrgTelephonyHealth(orgId)
      for (const check of telephonyHealth.checks) {
        checks.push({
          name: `telephony_${check.name}`,
          status: check.status,
          message: check.message
        })
      }
    } catch (error) {
      checks.push({
        name: 'telephony_verification',
        status: 'failed',
        message: `Telephony verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
    
    // 7. Verify Retell bindings exist
    const { count: bindingCount } = await supabase
      .from('retell_bindings')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active')
    
    checks.push({
      name: 'retell_bindings',
      status: (bindingCount || 0) > 0 ? 'passed' : 'warning',
      message: `Active bindings: ${bindingCount || 0}`
    })
    
    // Store health check result
    const passed = checks.every(c => c.status === 'passed')
    
    await supabase
      .from('health_checks')
      .insert({
        org_id: orgId,
        check_type: 'resume',
        status: passed ? 'passed' : 'failed',
        checks_performed: checks,
        failed_checks: checks.filter(c => c.status === 'failed'),
        triggered_by: 'system',
      })
    
    return {
      passed,
      checks,
      timestamp
    }
    
  } catch (error) {
    console.error('Health check error:', error)
    return {
      passed: false,
      checks: [{
        name: 'health_check_error',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      timestamp
    }
  }
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Send notification using template
 */
async function sendNotification(
  orgId: string,
  templateCode: string
): Promise<void> {
  try {
    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select(`
        name,
        profiles (
          email,
          full_name
        )
      `)
      .eq('id', orgId)
      .single()
    
    // Get template
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('code', templateCode)
      .eq('is_active', true)
      .single()
    
    if (!template || !org) {
      console.warn(`Cannot send notification: ${templateCode} for ${orgId}`)
      return
    }
    
    // Get portal URL for payment updates
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
    
    // Prepare template variables
    const variables: Record<string, string> = {
      business_name: org.name,
      portal_url: portalUrl,
      // Add more variables as needed
    }
    
    // Replace variables in template
    let body = template.body
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    
    // TODO: Actually send email via notification provider (SendGrid, etc.)
    console.log(`[NOTIFICATION] Sending ${templateCode} to ${org.name}:`, {
      template: templateCode,
      to: (org.profiles as Array<{ email: string }>)?.[0]?.email,
      subject: template.subject,
      body: body.substring(0, 100) + '...'
    })
    
    // Log notification
    await supabase
      .from('billing_events')
      .insert({
        org_id: orgId,
        event_type: `notification.${templateCode}`,
        event_source: 'system',
        description: `Notification sent: ${templateCode}`,
        processed: true,
        processed_at: new Date().toISOString(),
      })
    
  } catch (error) {
    console.error(`Error sending notification ${templateCode}:`, error)
  }
}

// ============================================================================
// Data Retention
// ============================================================================

/**
 * Schedule data retention/cleanup after cancellation
 */
async function scheduleDataRetention(orgId: string): Promise<void> {
  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() + 30) // 30 day retention
  
  // Create a scheduled job for data cleanup
  await supabase
    .from('cron_jobs')
    .insert({
      job_name: 'data_retention_cleanup',
      status: 'scheduled',
      scheduled_for: retentionDate.toISOString(),
      payload: { org_id: orgId },
    })
  
  // Log the scheduled retention
  await logBillingEvent({
    orgId,
    eventType: 'data_retention.scheduled',
    eventSource: 'system',
    description: `Data retention scheduled for ${retentionDate.toISOString()}`,
  })
}

// ============================================================================
// Admin Actions
// ============================================================================

/**
 * Admin force suspend an organization
 */
export async function adminSuspend(
  orgId: string,
  adminUserId: string,
  reason: string
): Promise<SuspendResult> {
  // Log admin action
  await supabase
    .from('admin_audit_log')
    .insert({
      action: 'ADMIN_SUSPEND',
      actor_id: adminUserId,
      target_org_id: orgId,
      details: { reason },
    })
  
  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString(),
      metadata: { admin_suspended: true, admin_reason: reason }
    })
    .eq('org_id', orgId)
  
  // Suspend telephony
  const result = await suspendTelephony(orgId)
  
  // Recalculate entitlements
  await recalculateEntitlements(orgId)
  
  return result
}

/**
 * Admin force resume an organization
 */
export async function adminResume(
  orgId: string,
  adminUserId: string,
  reason: string
): Promise<ResumeResult> {
  // Log admin action
  await supabase
    .from('admin_audit_log')
    .insert({
      action: 'ADMIN_RESUME',
      actor_id: adminUserId,
      target_org_id: orgId,
      details: { reason },
    })
  
  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
      metadata: { admin_resumed: true, admin_reason: reason }
    })
    .eq('org_id', orgId)
  
  // Resume telephony
  const result = await resumeTelephony(orgId)
  
  // Recalculate entitlements
  await recalculateEntitlements(orgId)
  
  return result
}
