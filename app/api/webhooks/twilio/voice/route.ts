/**
 * POST /api/webhooks/twilio/voice
 * 
 * Handle Twilio voice webhooks:
 * - Incoming calls
 * - Call status updates
 * - Recording notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

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

function validateTwilioSignature(
  request: NextRequest,
  body: Record<string, string>
): boolean {
  const signature = request.headers.get('x-twilio-signature')
  const authToken = process.env.TWILIO_AUTH_TOKEN
  
  if (!signature || !authToken) {
    return false
  }
  
  // Get the full URL
  const url = request.url
  
  try {
    return twilio.validateRequest(authToken, signature, url, body)
  } catch {
    return false
  }
}

// ============================================================================
// Parse Form Data
// ============================================================================

async function parseFormData(request: NextRequest): Promise<Record<string, string>> {
  const formData = await request.formData()
  const body: Record<string, string> = {}
  
  formData.forEach((value, key) => {
    body[key] = value.toString()
  })
  
  return body
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const body = await parseFormData(request)
    
    // Validate signature (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const isValid = validateTwilioSignature(request, body)
      
      if (!isValid) {
        console.error('Invalid Twilio webhook signature')
        
        // Log invalid signature attempt
        await supabase.from('telephony_events').insert({
          event_type: 'webhook.invalid_signature',
          event_source: 'twilio',
          signature_verified: false,
          metadata: { 
            call_sid: body.CallSid,
            account_sid: body.AccountSid,
          },
        })
        
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        )
      }
    }
    
    // Log the webhook event
    await supabase.from('telephony_events').insert({
      event_type: `call.${body.CallStatus || 'received'}`,
      event_source: 'twilio',
      twilio_sid: body.CallSid,
      twilio_request_id: request.headers.get('x-twilio-requestid'),
      signature_verified: true,
      metadata: body,
    })
    
    // Route based on call status
    const callStatus = body.CallStatus?.toLowerCase()
    
    switch (callStatus) {
      case 'ringing':
        return handleIncomingCall(body)
      case 'in-progress':
        return handleCallInProgress(body)
      case 'completed':
        return handleCallCompleted(body)
      case 'busy':
      case 'failed':
      case 'no-answer':
      case 'canceled':
        return handleCallFailed(body, callStatus)
      default:
        // For incoming calls without status, return TwiML
        return handleIncomingCall(body)
    }
    
  } catch (error) {
    console.error('Twilio webhook error:', error)
    
    // Return TwiML that says something went wrong
    const twiml = new twilio.twiml.VoiceResponse()
    twiml.say('We are experiencing technical difficulties. Please try again later.')
    twiml.hangup()
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

// ============================================================================
// Call Handlers
// ============================================================================

/**
 * Handle incoming call - return TwiML to route to AI agent
 */
async function handleIncomingCall(body: Record<string, string>): Promise<NextResponse> {
  const toNumber = body.To
  const fromNumber = body.From
  const callSid = body.CallSid
  
  // Look up phone number to find the agent
  const { data: phoneNumber } = await supabase
    .from('phone_numbers')
    .select(`
      *,
      agents (
        id,
        retell_agent_id,
        is_active
      )
    `)
    .or(`e164.eq.${toNumber},retell_phone_number.eq.${toNumber}`)
    .eq('status', 'active')
    .single()
  
  const twiml = new twilio.twiml.VoiceResponse()
  
  if (!phoneNumber) {
    console.warn('Incoming call to unknown number:', toNumber)
    twiml.say('This number is not configured. Goodbye.')
    twiml.hangup()
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
  
  const agent = phoneNumber.agents as { 
    id: string
    retell_agent_id: string
    is_active: boolean 
  } | null
  
  if (!agent?.retell_agent_id || !agent.is_active) {
    console.warn('No active agent for number:', toNumber)
    twiml.say('This line is currently unavailable. Please try again later.')
    twiml.hangup()
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
  
  // Create call record
  await supabase.from('calls').insert({
    org_id: phoneNumber.org_id,
    agent_id: agent.id,
    phone_number_id: phoneNumber.id,
    retell_call_id: callSid, // Will be updated with Retell call ID
    direction: 'inbound',
    status: 'registered',
    from_number: fromNumber,
    to_number: toNumber,
  })
  
  // Connect to Retell AI via SIP
  // The actual Retell integration happens at the SIP trunk level
  // Here we just acknowledge the call
  
  // If using Retell's direct integration, the call would be handled by Retell
  // If using SIP trunk, forward to Retell's termination URI
  
  const retellTerminationUri = process.env.RETELL_TERMINATION_URI
  
  if (retellTerminationUri) {
    // Forward to Retell via SIP
    const dial = twiml.dial({
      callerId: body.To,
    })
    dial.sip(
      `sip:${agent.retell_agent_id}@${retellTerminationUri}`
    )
  } else {
    // Fallback: simple greeting
    twiml.say('Hello! Thank you for calling. Our AI assistant will be with you shortly.')
    twiml.pause({ length: 2 })
    twiml.say('We apologize, but our AI assistant is currently unavailable. Please try again later.')
    twiml.hangup()
  }
  
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  })
}

/**
 * Handle call in progress
 */
async function handleCallInProgress(body: Record<string, string>): Promise<NextResponse> {
  const callSid = body.CallSid
  
  // Update call status
  await supabase
    .from('calls')
    .update({
      status: 'ongoing',
      started_at: new Date().toISOString(),
    })
    .eq('retell_call_id', callSid)
  
  // Return empty TwiML
  const twiml = new twilio.twiml.VoiceResponse()
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  })
}

/**
 * Handle call completed
 */
async function handleCallCompleted(body: Record<string, string>): Promise<NextResponse> {
  const callSid = body.CallSid
  const duration = parseInt(body.CallDuration || '0', 10)
  const recordingUrl = body.RecordingUrl
  
  // Update call record
  await supabase
    .from('calls')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      duration_ms: duration * 1000,
      recording_url: recordingUrl,
    })
    .eq('retell_call_id', callSid)
  
  // Update agent stats
  const { data: call } = await supabase
    .from('calls')
    .select('agent_id, org_id')
    .eq('retell_call_id', callSid)
    .single()
  
  if (call?.agent_id) {
    // Increment call count and minutes
    await supabase.rpc('increment_agent_calls', { agent_uuid: call.agent_id })
    await supabase.rpc('increment_agent_minutes', { 
      agent_uuid: call.agent_id,
      minutes_to_add: Math.ceil(duration / 60)
    })
  }
  
  // Update org minutes used
  if (call?.org_id) {
    await supabase
      .from('organizations')
      .update({
        minutes_used: supabase.rpc('increment', { x: Math.ceil(duration / 60) })
      })
      .eq('id', call.org_id)
  }
  
  // Return empty TwiML
  const twiml = new twilio.twiml.VoiceResponse()
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  })
}

/**
 * Handle call failure
 */
async function handleCallFailed(
  body: Record<string, string>,
  status: string
): Promise<NextResponse> {
  const callSid = body.CallSid
  
  // Update call record
  await supabase
    .from('calls')
    .update({
      status: 'error',
      ended_at: new Date().toISOString(),
      outcome: status === 'busy' ? 'missed' : 'error',
      metadata: { failure_reason: status },
    })
    .eq('retell_call_id', callSid)
  
  // Return empty TwiML
  const twiml = new twilio.twiml.VoiceResponse()
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  })
}
