import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const webhookSecret = process.env.RETELL_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-retell-signature')

    // Verify webhook signature
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Retell webhook event:', event.event_type)

    switch (event.event_type) {
      case 'call_started':
        await handleCallStarted(supabase, event)
        break

      case 'call_ended':
        await handleCallEnded(supabase, event)
        break

      case 'call_analyzed':
        await handleCallAnalyzed(supabase, event)
        break

      default:
        console.log('Unhandled event type:', event.event_type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleCallStarted(supabase: any, event: any) {
  const { call_id, agent_id, from_number, to_number, direction } = event.data

  // Find the agent in our database
  const { data: agent } = await supabase
    .from('agents')
    .select('id, org_id')
    .eq('retell_agent_id', agent_id)
    .single()

  if (!agent) {
    // Check if this is a demo call
    await supabase
      .from('demo_calls')
      .update({ call_status: 'ongoing' })
      .eq('retell_call_id', call_id)
    return
  }

  // Create call record
  await supabase.from('calls').insert({
    org_id: agent.org_id,
    agent_id: agent.id,
    retell_call_id: call_id,
    direction: direction || 'inbound',
    status: 'ongoing',
    from_number,
    to_number,
    started_at: new Date().toISOString(),
  })

  // Update agent stats
  await supabase.rpc('increment_agent_calls', { agent_uuid: agent.id })
}

async function handleCallEnded(supabase: any, event: any) {
  const { call_id, duration_ms, transcript, recording_url, call_successful } = event.data

  // Update call record
  const { data: call } = await supabase
    .from('calls')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      duration_ms,
      transcript,
      recording_url,
      call_successful,
    })
    .eq('retell_call_id', call_id)
    .select('agent_id')
    .single()

  // Update demo call if exists
  await supabase
    .from('demo_calls')
    .update({
      call_status: 'ended',
      duration_ms,
    })
    .eq('retell_call_id', call_id)

  // Update agent total minutes
  if (call?.agent_id && duration_ms) {
    const minutes = Math.ceil(duration_ms / 60000)
    await supabase.rpc('increment_agent_minutes', {
      agent_uuid: call.agent_id,
      minutes_to_add: minutes,
    })
  }
}

async function handleCallAnalyzed(supabase: any, event: any) {
  const {
    call_id,
    call_summary,
    custom_analysis_data,
    user_sentiment,
    call_successful,
  } = event.data

  // Determine call outcome from analysis
  let outcome = 'faq'
  if (custom_analysis_data?.appointment_booked) {
    outcome = 'booked'
  } else if (custom_analysis_data?.support_requested) {
    outcome = 'support'
  } else if (custom_analysis_data?.transfer_requested) {
    outcome = 'transferred'
  }

  // Update call with analysis
  const { data: call } = await supabase
    .from('calls')
    .update({
      summary: call_summary,
      custom_analysis: custom_analysis_data,
      user_sentiment,
      call_successful,
      outcome,
      caller_name: custom_analysis_data?.caller_name,
    })
    .eq('retell_call_id', call_id)
    .select('agent_id, outcome')
    .single()

  // Update booking count if appointment was booked
  if (call?.agent_id && outcome === 'booked') {
    await supabase.rpc('increment_agent_bookings', { agent_uuid: call.agent_id })
  }
}
