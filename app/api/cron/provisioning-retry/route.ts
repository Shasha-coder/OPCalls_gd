/**
 * GET /api/cron/provisioning-retry
 * 
 * Process provisioning retry queue
 * Run every 5 minutes via cron
 */

import { NextRequest, NextResponse } from 'next/server'
import { processRetryQueue } from '@/lib/provisioning'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (supports Vercel Bearer token and custom header)
    const authHeader = request.headers.get('authorization')
    const customSecret = request.headers.get('x-cron-secret')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret) {
      const isVercelAuth = authHeader === `Bearer ${cronSecret}`
      const isCustomAuth = customSecret === cronSecret
      if (!isVercelAuth && !isCustomAuth) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
    
    console.log('[CRON] Processing provisioning retry queue...')
    
    const result = await processRetryQueue()
    
    console.log(`[CRON] Processed ${result.processed} jobs: ${result.succeeded} succeeded, ${result.failed} failed`)
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('[CRON] Provisioning retry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
