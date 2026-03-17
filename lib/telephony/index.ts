/**
 * OPCALLS Phase 3: Telephony Module
 * 
 * Central export for all telephony functionality
 */

// Types
export * from './types'

// Provider
export {
  TwilioProvider,
  getTwilioProvider,
  createTwilioProvider,
} from './twilio-provider'

// Number Service
export {
  searchAvailableNumbers,
  purchaseNumber,
  releaseNumber,
  suspendNumber,
  resumeNumber,
  getOrgPhoneNumbers,
  getPhoneNumber,
  getPhoneNumberByE164,
  formatPhoneNumber,
  isValidE164,
  type SearchNumbersRequest,
  type PurchaseNumberRequest,
  type NumberSearchResult,
  type PurchaseResult,
  type ReleaseResult,
} from './number-service'

// Subaccount Service
export {
  createSubaccountForOrg,
  getOrgSubaccount,
  suspendOrgSubaccount,
  resumeOrgSubaccount,
  createSipTrunkForOrg,
  getOrgSipTrunk,
  attachNumberToOrgTrunk,
  provisionOrgTelephony,
  isOrgTelephonyProvisioned,
  verifyOrgTelephonyHealth,
  type CreateSubaccountResult,
  type CreateTrunkResult,
  type ProvisionResult,
} from './subaccount-service'
