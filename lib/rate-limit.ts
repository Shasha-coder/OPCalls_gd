/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API routes.
 * For production at scale, use Redis or similar.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (use Redis for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

interface RateLimitOptions {
  /** Maximum number of requests in the window */
  limit?: number
  /** Window duration in milliseconds */
  windowMs?: number
  /** Prefix for the key (e.g., 'api:', 'auth:') */
  prefix?: string
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Remaining requests in the window */
  remaining: number
  /** Time (in ms) until the window resets */
  resetIn: number
  /** Total limit for this window */
  limit: number
}

/**
 * Check if a request is rate limited
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    limit = 100,
    windowMs = 60 * 1000, // 1 minute default
    prefix = '',
  } = options

  const key = `${prefix}${identifier}`
  const now = Date.now()
  const record = rateLimitStore.get(key)

  // No existing record or expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetIn: windowMs,
      limit,
    }
  }

  // Check if over limit
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
      limit,
    }
  }

  // Increment and allow
  record.count++
  return {
    allowed: true,
    remaining: limit - record.count,
    resetIn: record.resetTime - now,
    limit,
  }
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
  }
}

/**
 * Extract identifier from request
 */
export function getIdentifier(request: Request): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fall back to a hash of the user agent + accept headers
  const ua = request.headers.get('user-agent') || ''
  const accept = request.headers.get('accept') || ''
  return `anonymous-${hashCode(ua + accept)}`
}

/**
 * Simple hash function for fallback identifiers
 */
function hashCode(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // Standard API calls
  api: { limit: 100, windowMs: 60 * 1000 }, // 100/min
  
  // Authentication attempts
  auth: { limit: 5, windowMs: 60 * 1000 }, // 5/min
  
  // Form submissions
  form: { limit: 3, windowMs: 60 * 1000 }, // 3/min
  
  // Search/query endpoints
  search: { limit: 30, windowMs: 60 * 1000 }, // 30/min
  
  // File uploads
  upload: { limit: 10, windowMs: 60 * 1000 }, // 10/min
  
  // Webhooks (external services)
  webhook: { limit: 1000, windowMs: 60 * 1000 }, // 1000/min
  
  // Expensive operations
  expensive: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5/5min
}
