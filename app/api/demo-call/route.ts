import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const retellApiKey = process.env.RETELL_API_KEY!

// Demo agent IDs configured in Retell
const DEMO_AGENTS: Record<string, string> = {
  sarah: process.env.DEMO_AGENT_RECEPTIONIST || '',
  michael: process.env.DEMO_AGENT_BOOKING || '',
  alex: process.env.DEMO_AGENT_SUPPORT || '',
  emma: process.env.DEMO_AGENT_FOLLOWUP || '',
}

const DEMO_FROM_NUMBER = process.env.DEMO_FROM_NUMBER || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, agentType, consent } = body

    // Validate input
    if (!phoneNumber || !agentType || !consent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate phone number format
    const cleanNumber = phoneNumber.replace(/\D/g, '')
    if (cleanNumber.length < 10 || cleanNumber.length > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Get agent ID
    const agentId = DEMO_AGENTS[agentType]
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Invalid agent type' },
        { status: 400 }
      )
    }

    // Check if Retell API key is configured
    if (!retellApiKey) {
      console.error('RETELL_API_KEY not configured')
      return NextResponse.json(
        { success: false, error: 'Demo calls not configured' },
        { status: 500 }
      )
    }

    // Create Supabase client for logging
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log demo call for compliance
    const { data: demoCall, error: logError } = await supabase
      .from('demo_calls')
      .insert({
        phone_number: phoneNumber,
        agent_type: mapAgentType(agentType),
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
        consent_text: 'I consent to receive a demo call from OPCalls AI.',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        call_status: 'registered',
      })
      .select()
      .single()

    if (logError) {
      console.error('Error logging demo call:', logError)
    }

    // Create outbound call via Retell AI
    const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_number: DEMO_FROM_NUMBER,
        to_number: phoneNumber,
        agent_id: agentId,
        metadata: {
          demo_call_id: demoCall?.id,
          source: 'landing_page',
        },
      }),
    })

    if (!retellResponse.ok) {
      const errorData = await retellResponse.json()
      console.error('Retell API error:', errorData)
      
      // Update call status to error
      if (demoCall?.id) {
        await supabase
          .from('demo_calls')
          .update({ call_status: 'error' })
          .eq('id', demoCall.id)
      }

      return NextResponse.json(
        { success: false, error: 'Failed to initiate call' },
        { status: 500 }
      )
    }

    const retellData = await retellResponse.json()

    // Update demo call with Retell call ID
    if (demoCall?.id) {
      await supabase
        .from('demo_calls')
        .update({
          retell_call_id: retellData.call_id,
          call_status: 'ongoing',
        })
        .eq('id', demoCall.id)
    }

    return NextResponse.json({
      success: true,
      callId: retellData.call_id,
      message: 'Call initiated successfully',
    })

  } catch (error) {
    console.error('Demo call error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Map UI agent types to database enum values
function mapAgentType(type: string): string {
  const mapping: Record<string, string> = {
    sarah: 'receptionist',
    michael: 'booking',
    alex: 'support',
    emma: 'followup',
  }
  return mapping[type] || 'receptionist'
}
