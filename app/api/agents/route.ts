import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const retellApiKey = process.env.RETELL_API_KEY!

// Agent type prompts
const AGENT_PROMPTS: Record<string, string> = {
  receptionist: `You are a professional receptionist for {business_name}. Your role is to:
- Greet callers warmly and professionally
- Answer common questions about the business
- Schedule appointments when requested
- Take messages for staff members
- Transfer urgent calls appropriately

Business Info:
{business_info}

Always be polite, helpful, and efficient. If you don't know something, offer to take a message or transfer to someone who can help.`,

  booking: `You are an appointment booking specialist for {business_name}. Your role is to:
- Help callers schedule new appointments
- Confirm appointment details (date, time, service)
- Handle rescheduling and cancellation requests
- Provide information about services and availability

Business Info:
{business_info}

Be efficient and confirm all details before ending the call.`,

  support: `You are a customer support specialist for {business_name}. Your role is to:
- Help resolve customer issues and concerns
- Answer product/service questions
- Process simple requests
- Escalate complex issues to human support

Business Info:
{business_info}

Be empathetic, patient, and solution-oriented.`,

  followup: `You are a follow-up specialist for {business_name}. Your role is to:
- Check on customer satisfaction after service
- Remind customers about upcoming appointments
- Collect feedback
- Offer additional services when appropriate

Business Info:
{business_info}

Be friendly and non-pushy. Focus on customer care.`,

  afterhours: `You are the after-hours answering service for {business_name}. Your role is to:
- Inform callers of business hours
- Take messages for urgent matters
- Provide emergency contact information if available
- Schedule callbacks for the next business day

Business Info:
{business_info}

Be professional and reassuring. Ensure callers feel heard even outside business hours.`,
}

// Voice options
const VOICE_OPTIONS = {
  female_professional: '11labs-Adrian',
  male_professional: '11labs-Michael',
  female_friendly: '11labs-Paola',
  male_friendly: '11labs-Jason',
}

export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and org
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Get org details
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.org_id)
      .single()

    const body = await request.json()
    const {
      name,
      type,
      industry,
      voice = 'female_professional',
      languages = ['en'],
      businessInfo = '',
    } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    // Build the prompt
    const basePrompt = AGENT_PROMPTS[type] || AGENT_PROMPTS.receptionist
    const prompt = basePrompt
      .replace('{business_name}', org.name)
      .replace('{business_info}', businessInfo || `Industry: ${industry || org.industry}`)

    // Create agent in Retell AI
    const retellResponse = await fetch('https://api.retellai.com/v2/create-agent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_name: `${org.name} - ${name}`,
        voice_id: VOICE_OPTIONS[voice as keyof typeof VOICE_OPTIONS] || VOICE_OPTIONS.female_professional,
        language: languages[0] || 'en',
        response_engine: {
          type: 'retell-llm',
          llm_id: 'gpt-4o-mini',
        },
        begin_message: `Hello, thank you for calling ${org.name}. How may I help you today?`,
        general_prompt: prompt,
        enable_transcription_formatting: true,
        normalize_for_speech: true,
        ambient_sound: 'office',
        responsiveness: 0.8,
        interruption_sensitivity: 0.7,
        enable_backchannel: true,
        post_call_analysis_data: [
          { name: 'caller_name', description: "The caller's name if mentioned" },
          { name: 'appointment_booked', type: 'boolean', description: 'Whether an appointment was scheduled' },
          { name: 'support_requested', type: 'boolean', description: 'Whether customer support was requested' },
          { name: 'transfer_requested', type: 'boolean', description: 'Whether a transfer was requested' },
        ],
      }),
    })

    if (!retellResponse.ok) {
      const errorData = await retellResponse.json()
      console.error('Retell API error:', errorData)
      return NextResponse.json({ error: 'Failed to create agent in Retell' }, { status: 500 })
    }

    const retellData = await retellResponse.json()

    // Save agent to database
    const { data: agent, error: dbError } = await supabase
      .from('agents')
      .insert({
        org_id: profile.org_id,
        name,
        type,
        industry: industry || org.industry,
        retell_agent_id: retellData.agent_id,
        retell_voice_id: VOICE_OPTIONS[voice as keyof typeof VOICE_OPTIONS],
        prompt,
        languages,
        primary_language: languages[0] || 'en',
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save agent' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        retellAgentId: agent.retell_agent_id,
      },
    })

  } catch (error) {
    console.error('Agent creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List agents
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { data: agents } = await supabase
      .from('agents')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ agents: agents || [] })

  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
