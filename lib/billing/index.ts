/**
 * OPCALLS Phase 2: Billing Module
 * 
 * Central export for all billing functionality
 */

// State Machine
export {
  BillingStateMachine,
  type SubscriptionStatus,
  type BillingTransition,
  type SideEffect,
  type TransitionResult,
  getAllStatuses,
  isServiceEnabled,
  isServiceLimited,
  isServiceBlocked,
  requiresPaymentAction,
  getStatusSeverity,
  getStatusLabel,
  getStatusDescription,
  inferTransition,
  getSideEffects,
  GRACE_PERIOD_CONFIG,
  calculateGracePeriodEnd,
  isGracePeriodExpired,
} from './billing-state-machine'

// Entitlements
export {
  getEntitlements,
  recalculateEntitlements,
  checkCanReceiveCalls,
  checkCanMakeCalls,
  checkCanAddNumber,
  checkCanCreateAgent,
  checkCanAccessApi,
  checkMinutesAvailable,
  checkConcurrentCallLimit,
  getCurrentUsage,
  updateSpend,
  setAdminOverride,
  requireCanReceiveCalls,
  requireCanMakeCalls,
  requireCanAddNumber,
  requireCanCreateAgent,
  requireCanAccessApi,
  type Entitlements,
  type EntitlementCheck,
  type UsageStats,
} from './entitlements'

// Customer Portal
export {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionInfo,
  getInvoiceHistory,
  previewPlanChange,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
} from './customer-portal'

// Grace Period Worker
export {
  processExpiredGracePeriods,
  sendGraceWarnings,
  retryFailedPayments,
  checkUsageThresholds,
  handleGracePeriodCron,
} from './grace-period-worker'

// Suspend/Resume Flow
export {
  executeSideEffects,
  suspendTelephony,
  resumeTelephony,
  runHealthCheck,
  adminSuspend,
  adminResume,
} from './suspend-resume-flow'

// Utilities
export {
  logBillingEvent,
  formatCentsToDollars,
  formatDate,
  formatDateTime,
  formatBillingInterval,
  daysRemainingInPeriod,
  calculateUsagePercentage,
  calculateOverage,
  isValidPlanCode,
  BillingError,
  getErrorDetails,
  isEventProcessed,
  generateIdempotencyKey,
  checkSpendThreshold,
  recordSpend,
  comparePlans,
  getBillingDashboard,
  type BillingEventParams,
} from './utils'
