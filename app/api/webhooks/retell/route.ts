/**
 * POST /api/webhooks/retell
 * 
 * Handle Retell AI webhooks:
 * - call_started
 * - call_ended
 * - call_analyzed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processCallAnalysis } from '@/lib/ai/call-analysis'
import { RetellWebhookEvent, RetellCallData } from '@/lib/ai/types'
import crypto from 'crypto'

// ============================================================================
// Initialize
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// Webhook Signature Validation
// ============================================================================

function validateRetellSignature(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.RETELL_WEBHOOK_SECRET
  
  if (!secret || !signature) {
    // In development, allow unsigned requests
    return process.env.NODE_ENV !== 'production'
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return signature === expectedSignature
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-retell-signature')
    
    // Validate signature
    if (!validateRetellSignature(payload, signature)) {
      console.error('Invalid Retell webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      )
    }
    
    const event: RetellWebhookEvent = JSON.parse(payload)
    
    console.log(`Retell webhook: ${event.event}`, { call_id: event.call?.call_id })
    
    // Route by event type
    switch (event.event) {
      case 'call_started':
        await handleCallStarted(event.call)
        break
        
      case 'call_ended':
        await handleCallEnded(event.call)
        break
        
      case 'call_analyzed':
        await handleCallAnalyzed(event.call)
        break
        
      default:
        console.log(`Unknown Retell event: ${event.event}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Retell webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle call_started event
 */
async function handleCallStarted(callData: RetellCallData): Promise<void> {
  // Find agent by Retell agent ID
  const { data: retellAgent } = await supabase
    .from('retell_agents')
    .select('agent_id, org_id')
    .eq('retell_agent_id', callData.agent_id)
    .single()
  
  if (!retellAgent) {
    console.warn('Unknown agent for call:', callData.agent_id)
    return
  }
  
  // Find phone number
  let phoneNumberId = null
  if (callData.to_number) {
    const { data: phoneNumber } = await supabase
      .from('phone_numbers')
      .select('id')
      .or(`e164.eq.${callData.to_number},retell_phone_number.eq.${callData.to_number}`)
      .single()
    
    phoneNumberId = phoneNumber?.id
  }
  
  // Check for existing call record (might have been created by Twilio webhook)
  const { data: existingCall } = await supabase
    .from('calls')
    .select('id')
    .eq('retell_call_id', callData.call_id)
    .single()
  
  if (existingCall) {
    // Update existing record
    await supabase
      .from('calls')
      .update({
        status: 'ongoing',
        started_at: callData.start_timestamp 
          ? new Date(callData.start_timestamp).toISOString()
          : new Date().toISOString(),
      })
      .eq('id', existingCall.id)
  } else {
    // Create new call record
    await supabase.from('calls').insert({
      org_id: retellAgent.org_id,
      agent_id: retellAgent.agent_id,
      phone_number_id: phoneNumberId,
      retell_call_id: callData.call_id,
      direction: callData.direction || 'inbound',
      status: 'ongoing',
      from_number: callData.from_number || '',
      to_number: callData.to_number || '',
      started_at: callData.start_timestamp
        ? new Date(callData.start_timestamp).toISOString()
        : new Date().toISOString(),
    })
  }
}

/**
 * Handle call_ended event
 */
async function handleCallEnded(callData: RetellCallData): Promise<void> {
  // Find the call record
  const { data: call, error } = await supabase
    .from('calls')
    .select('id, agent_id, org_id')
    .eq('retell_call_id', callData.call_id)
    .single()
  
  if (error || !call) {
    console.warn('Call not found for call_ended:', callData.call_id)
    return
  }
  
  // Calculate duration
  const durationMs = callData.duration_ms || (
    callData.end_timestamp && callData.start_timestamp
      ? callData.end_timestamp - callData.start_timestamp
      : 0
  )
  const durationMinutes = Math.ceil(durationMs / 60000)
  
  // Update call record
  await supabase
    .from('calls')
    .update({
      status: 'ended',
      ended_at: callData.end_timestamp
        ? new Date(callData.end_timestamp).toISOString()
        : new Date().toISOString(),
      duration_ms: durationMs,
      transcript: callData.transcript,
      transcript_object: callData.transcript_object,
      recording_url: callData.recording_url,
      metadata: callData.metadata,
    })
    .eq('id', call.id)
  
  // Update agent stats
  if (call.agent_id) {
    await supabase
      .from('agents')
      .update({
        total_calls: supabase.rpc('increment_agent_calls'),
        total_minutes: supabase.rpc('increment_agent_minutes', { minutes_to_add: durationMinutes }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', call.agent_id)
    
    // Alternative: use raw SQL increment
    await supabase.rpc('exec_sql', {
      query: `
        UPDATE agents 
        SET total_calls = total_calls + 1,
            total_minutes = total_minutes + ${durationMinutes},
            updated_at = NOW()
        WHERE id = '${call.agent_id}'
      `
    }).catch(() => {
      // Fallback if rpc doesn't exist
      supabase
        .from('agents')
        .select('total_calls, total_minutes')
        .eq('id', call.agent_id)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase
              .from('agents')
              .update({
                total_calls: (data.total_calls || 0) + 1,
                total_minutes: (data.total_minutes || 0) + durationMinutes,
                updated_at: new Date().toISOString(),
              })
              .eq('id', call.agent_id)
          }
        })
    })
  }
  
  // Update org minutes
  if (call.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('minutes_used')
      .eq('id', call.org_id)
      .single()
    
    if (org) {
      await supabase
        .from('organizations')
        .update({
          minutes_used: (org.minutes_used || 0) + durationMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', call.org_id)
    }
  }
}

/**
 * Handle call_analyzed event
 */
async function handleCallAnalyzed(callData: RetellCallData): Promise<void> {
  // Process call analysis
  const result = await processCallAnalysis(callData)
  
  if (!result.success) {
    console.error('Failed to process call analysis:', result.error)
  }
}

// ============================================================================
// GET - Health Check
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'retell',
    timestamp: new Date().toISOString(),
  })
}
