/**
 * POST /api/done-for-you
 * 
 * Handles Done-For-You service requests from the landing page modal
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rate limiting: simple in-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // max requests
const RATE_WINDOW = 60 * 60 * 1000 // per hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = requestCounts.get(ip)
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { name, email, business_name, agent_type } = body
    
    if (!name || !email || !business_name || !agent_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Insert request
    const { data, error } = await supabase
      .from('done_for_you_requests')
      .insert({
        name: body.name,
        email: body.email,
        phone_number: body.phone_number || null,
        business_name: body.business_name,
        agent_type: body.agent_type,
        country: body.country || 'United States',
        working_hours: body.working_hours || '9 AM - 6 PM',
        language: body.language || 'English',
        notes: body.notes || null,
        status: 'pending',
        metadata: {
          source: 'landing_page',
          ip: ip,
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to submit request' },
        { status: 500 }
      )
    }

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to customer
    
    return NextResponse.json({ 
      success: true, 
      message: 'Request submitted successfully',
      id: data.id 
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
