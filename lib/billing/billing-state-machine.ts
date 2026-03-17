/**
 * OPCALLS Phase 2: Billing State Machine
 * 
 * Implements a finite state machine for subscription billing states
 * with validated transitions and side-effect triggers.
 */

// ============================================================================
// Types
// ============================================================================

export type SubscriptionStatus = 
  | 'draft'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'restricted'
  | 'suspended'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'

export type BillingTransition =
  | 'START_TRIAL'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'GRACE_EXPIRED'
  | 'SUSPEND'
  | 'RESUME'
  | 'CANCEL'
  | 'REACTIVATE'
  | 'CHECKOUT_EXPIRED'
  | 'TRIAL_ENDED'

export interface StateTransition {
  from: SubscriptionStatus
  to: SubscriptionStatus
  transition: BillingTransition
  sideEffects: SideEffect[]
}

export type SideEffect = 
  | 'RECALCULATE_ENTITLEMENTS'
  | 'START_GRACE_PERIOD'
  | 'SEND_PAYMENT_FAILED_EMAIL'
  | 'SEND_GRACE_WARNING_EMAIL'
  | 'SEND_SUSPENDED_EMAIL'
  | 'SEND_RESUMED_EMAIL'
  | 'SEND_CANCELED_EMAIL'
  | 'SUSPEND_TELEPHONY'
  | 'RESUME_TELEPHONY'
  | 'RUN_HEALTH_CHECK'
  | 'LOG_AUDIT_EVENT'
  | 'CLEAR_GRACE_PERIOD'
  | 'SCHEDULE_DATA_RETENTION'

export interface TransitionResult {
  success: boolean
  previousStatus: SubscriptionStatus
  newStatus: SubscriptionStatus
  sideEffects: SideEffect[]
  error?: string
}

// ============================================================================
// State Machine Definition
// ============================================================================

/**
 * Valid state transitions with their side effects
 * 
 * State Diagram:
 * 
 *   draft ─────────────────────────────────┐
 *     │                                    │
 *     ├─ START_TRIAL ──► trialing          │
 *     │                     │              │
 *     │                     ├─ PAYMENT_SUCCESS ──► active
 *     │                     │                        │
 *     └─ PAYMENT_SUCCESS ───┘                        │
 *                                                    │
 *     ┌──────────────────────────────────────────────┘
 *     │
 *     ▼
 *   active ◄──────────────────────────────────────────┐
 *     │                                               │
 *     ├─ PAYMENT_FAILED ──► past_due                  │
 *     │                        │                      │
 *     │                        ├─ PAYMENT_SUCCESS ────┤
 *     │                        │                      │
 *     │                        ├─ GRACE_EXPIRED ──► restricted
 *     │                        │                      │
 *     │                        └─ CANCEL ──► canceled │
 *     │                                               │
 *     │                    restricted                 │
 *     │                        │                      │
 *     │                        ├─ PAYMENT_SUCCESS ────┤
 *     │                        │                      │
 *     │                        └─ SUSPEND ──► suspended
 *     │                                          │
 *     │                                          ├─ PAYMENT_SUCCESS ──┘
 *     │                                          │
 *     │                                          └─ CANCEL ──► canceled
 *     │
 *     └─ CANCEL ──► canceled
 */

const STATE_TRANSITIONS: StateTransition[] = [
  // From DRAFT
  {
    from: 'draft',
    to: 'trialing',
    transition: 'START_TRIAL',
    sideEffects: ['RECALCULATE_ENTITLEMENTS', 'LOG_AUDIT_EVENT']
  },
  {
    from: 'draft',
    to: 'active',
    transition: 'PAYMENT_SUCCESS',
    sideEffects: ['RECALCULATE_ENTITLEMENTS', 'LOG_AUDIT_EVENT']
  },
  {
    from: 'draft',
    to: 'incomplete_expired',
    transition: 'CHECKOUT_EXPIRED',
    sideEffects: ['LOG_AUDIT_EVENT']
  },

  // From INCOMPLETE
  {
    from: 'incomplete',
    to: 'active',
    transition: 'PAYMENT_SUCCESS',
    sideEffects: ['RECALCULATE_ENTITLEMENTS', 'LOG_AUDIT_EVENT']
  },
  {
    from: 'incomplete',
    to: 'incomplete_expired',
    transition: 'CHECKOUT_EXPIRED',
    sideEffects: ['LOG_AUDIT_EVENT']
  },

  // From TRIALING
  {
    from: 'trialing',
    to: 'active',
    transition: 'PAYMENT_SUCCESS',
    sideEffects: ['RECALCULATE_ENTITLEMENTS', 'LOG_AUDIT_EVENT']
  },
  {
    from: 'trialing',
    to: 'past_due',
    transition: 'TRIAL_ENDED',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'START_GRACE_PERIOD',
      'SEND_PAYMENT_FAILED_EMAIL',
      'LOG_AUDIT_EVENT'
    ]
  },
  {
    from: 'trialing',
    to: 'canceled',
    transition: 'CANCEL',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'SEND_CANCELED_EMAIL',
      'SCHEDULE_DATA_RETENTION',
      'LOG_AUDIT_EVENT'
    ]
  },

  // From ACTIVE
  {
    from: 'active',
    to: 'past_due',
    transition: 'PAYMENT_FAILED',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'START_GRACE_PERIOD',
      'SEND_PAYMENT_FAILED_EMAIL',
      'LOG_AUDIT_EVENT'
    ]
  },
  {
    from: 'active',
    to: 'canceled',
    transition: 'CANCEL',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'SEND_CANCELED_EMAIL',
      'SCHEDULE_DATA_RETENTION',
      'LOG_AUDIT_EVENT'
    ]
  },

  // From PAST_DUE
  {
    from: 'past_due',
    to: 'active',
    transition: 'PAYMENT_SUCCESS',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'CLEAR_GRACE_PERIOD',
      'SEND_RESUMED_EMAIL',
      'LOG_AUDIT_EVENT'
    ]
  },
  {
    from: 'past_due',
    to: 'restricted',
    transition: 'GRACE_EXPIRED',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'SEND_GRACE_WARNING_EMAIL',
      'LOG_AUDIT_EVENT'
    ]
  },
  {
    from: 'past_due',
    to: 'canceled',
    transition: 'CANCEL',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'SEND_CANCELED_EMAIL',
      'SCHEDULE_DATA_RETENTION',
      'LOG_AUDIT_EVENT'
    ]
  },

  // From RESTRICTED
  {
    from: 'restricted',
    to: 'active',
    transition: 'PAYMENT_SUCCESS',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'CLEAR_GRACE_PERIOD',
      'SEND_RESUMED_EMAIL',
      'LOG_AUDIT_EVENT'
    ]
  },
  {
    from: 'restricted',
    to: 'suspended',
    transition: 'SUSPEND',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'SUSPEND_TELEPHONY',
      'SEND_SUSPENDED_EMAIL',
      'LOG_AUDIT_EVENT'
    ]
  },
  {
    from: 'restricted',
    to: 'canceled',
    transition: 'CANCEL',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'SUSPEND_TELEPHONY',
      'SEND_CANCELED_EMAIL',
      'SCHEDULE_DATA_RETENTION',
      'LOG_AUDIT_EVENT'
    ]
  },

  // From SUSPENDED
  {
    from: 'suspended',
    to: 'active',
    transition: 'PAYMENT_SUCCESS',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'RESUME_TELEPHONY',
      'RUN_HEALTH_CHECK',
      'CLEAR_GRACE_PERIOD',
      'SEND_RESUMED_EMAIL',
      'LOG_AUDIT_EVENT'
    ]
  },
  {
    from: 'suspended',
    to: 'canceled',
    transition: 'CANCEL',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'SEND_CANCELED_EMAIL',
      'SCHEDULE_DATA_RETENTION',
      'LOG_AUDIT_EVENT'
    ]
  },

  // From CANCELED (reactivation)
  {
    from: 'canceled',
    to: 'active',
    transition: 'REACTIVATE',
    sideEffects: [
      'RECALCULATE_ENTITLEMENTS',
      'RESUME_TELEPHONY',
      'RUN_HEALTH_CHECK',
      'LOG_AUDIT_EVENT'
    ]
  },
]

// ============================================================================
// State Machine Class
// ============================================================================

export class BillingStateMachine {
  private currentStatus: SubscriptionStatus

  constructor(initialStatus: SubscriptionStatus = 'draft') {
    this.currentStatus = initialStatus
  }

  /**
   * Get the current status
   */
  getStatus(): SubscriptionStatus {
    return this.currentStatus
  }

  /**
   * Check if a transition is valid from current state
   */
  canTransition(transition: BillingTransition): boolean {
    return STATE_TRANSITIONS.some(
      t => t.from === this.currentStatus && t.transition === transition
    )
  }

  /**
   * Get all valid transitions from current state
   */
  getValidTransitions(): BillingTransition[] {
    return STATE_TRANSITIONS
      .filter(t => t.from === this.currentStatus)
      .map(t => t.transition)
  }

  /**
   * Get the target state for a transition
   */
  getTargetState(transition: BillingTransition): SubscriptionStatus | null {
    const stateTransition = STATE_TRANSITIONS.find(
      t => t.from === this.currentStatus && t.transition === transition
    )
    return stateTransition?.to || null
  }

  /**
   * Execute a transition and return the result with side effects
   */
  transition(transition: BillingTransition): TransitionResult {
    const stateTransition = STATE_TRANSITIONS.find(
      t => t.from === this.currentStatus && t.transition === transition
    )

    if (!stateTransition) {
      return {
        success: false,
        previousStatus: this.currentStatus,
        newStatus: this.currentStatus,
        sideEffects: [],
        error: `Invalid transition: ${transition} from ${this.currentStatus}`
      }
    }

    const previousStatus = this.currentStatus
    this.currentStatus = stateTransition.to

    return {
      success: true,
      previousStatus,
      newStatus: this.currentStatus,
      sideEffects: stateTransition.sideEffects
    }
  }

  /**
   * Force set status (for recovery/admin operations)
   */
  forceSetStatus(status: SubscriptionStatus): void {
    this.currentStatus = status
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all possible states
 */
export function getAllStatuses(): SubscriptionStatus[] {
  return [
    'draft',
    'trialing',
    'active',
    'past_due',
    'restricted',
    'suspended',
    'canceled',
    'incomplete',
    'incomplete_expired'
  ]
}

/**
 * Check if a status allows service access
 */
export function isServiceEnabled(status: SubscriptionStatus): boolean {
  return ['trialing', 'active', 'past_due'].includes(status)
}

/**
 * Check if a status allows limited service access
 */
export function isServiceLimited(status: SubscriptionStatus): boolean {
  return status === 'restricted'
}

/**
 * Check if a status means service is fully blocked
 */
export function isServiceBlocked(status: SubscriptionStatus): boolean {
  return ['suspended', 'canceled', 'incomplete_expired'].includes(status)
}

/**
 * Check if status requires payment action
 */
export function requiresPaymentAction(status: SubscriptionStatus): boolean {
  return ['past_due', 'restricted', 'suspended', 'incomplete'].includes(status)
}

/**
 * Get status severity for UI display
 */
export function getStatusSeverity(status: SubscriptionStatus): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'success'
    case 'past_due':
    case 'incomplete':
      return 'warning'
    case 'restricted':
    case 'suspended':
    case 'canceled':
    case 'incomplete_expired':
      return 'error'
    case 'draft':
    default:
      return 'info'
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    draft: 'Draft',
    trialing: 'Trial',
    active: 'Active',
    past_due: 'Past Due',
    restricted: 'Restricted',
    suspended: 'Suspended',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired'
  }
  return labels[status]
}

/**
 * Get status description for UI
 */
export function getStatusDescription(status: SubscriptionStatus): string {
  const descriptions: Record<SubscriptionStatus, string> = {
    draft: 'Your account is being set up',
    trialing: 'You are in your free trial period',
    active: 'Your subscription is active',
    past_due: 'Payment failed - please update your payment method',
    restricted: 'Service limited due to payment issues',
    suspended: 'Service suspended - payment required to resume',
    canceled: 'Your subscription has been canceled',
    incomplete: 'Please complete your payment',
    incomplete_expired: 'Payment session expired'
  }
  return descriptions[status]
}

/**
 * Determine transition for a status change
 */
export function inferTransition(
  from: SubscriptionStatus, 
  to: SubscriptionStatus
): BillingTransition | null {
  const transition = STATE_TRANSITIONS.find(
    t => t.from === from && t.to === to
  )
  return transition?.transition || null
}

/**
 * Get side effects for a direct status change
 */
export function getSideEffects(
  from: SubscriptionStatus, 
  to: SubscriptionStatus
): SideEffect[] {
  const transition = STATE_TRANSITIONS.find(
    t => t.from === from && t.to === to
  )
  return transition?.sideEffects || []
}

// ============================================================================
// Grace Period Configuration
// ============================================================================

export const GRACE_PERIOD_CONFIG = {
  // Days before moving from past_due to restricted
  pastDueGraceDays: 7,
  
  // Days before moving from restricted to suspended
  restrictedGraceDays: 7,
  
  // Days to retain data after cancellation
  dataRetentionDays: 30,
  
  // Days to show reactivation option after cancellation
  reactivationWindowDays: 90,
}

/**
 * Calculate grace period end date
 */
export function calculateGracePeriodEnd(
  status: SubscriptionStatus, 
  startDate: Date = new Date()
): Date {
  const graceDays = status === 'past_due' 
    ? GRACE_PERIOD_CONFIG.pastDueGraceDays 
    : GRACE_PERIOD_CONFIG.restrictedGraceDays
    
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + graceDays)
  return endDate
}

/**
 * Check if grace period has expired
 */
export function isGracePeriodExpired(gracePeriodEnd: Date | null): boolean {
  if (!gracePeriodEnd) return false
  return new Date() > new Date(gracePeriodEnd)
}
