/**
 * GET /api/cron/grace-periods
 * 
 * Cron job to process grace period expirations and send warnings
 * Should be called periodically (e.g., every hour)
 * 
 * Security: Verify cron secret in production
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleGracePeriodCron } from '@/lib/billing/grace-period-worker'

// Verify cron secret to prevent unauthorized access
// Supports both Vercel cron (Authorization header) and custom x-cron-secret
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  
  // Check Vercel cron Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true
  
  // Check custom x-cron-secret header (for Netlify/custom crons)
  const customSecret = request.headers.get('x-cron-secret')
  if (customSecret === cronSecret) return true
  
  return false
}

export async function GET(request: NextRequest) {
  // Verify cron secret (skip in development)
  if (process.env.NODE_ENV === 'production' && !verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    console.log('Starting grace period cron job...')
    
    const results = await handleGracePeriodCron()
    
    console.log('Grace period cron completed:', results)
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('Grace period cron error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for webhook-style triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
