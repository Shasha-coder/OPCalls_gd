/**
 * OPCALLS Phase 3: Twilio Provider
 * 
 * Twilio implementation of the TelephonyProvider interface.
 * This is the concrete implementation that can be swapped for
 * Telnyx, Vonage, etc. by implementing the same interface.
 */

import twilio from 'twilio'
import {
  TelephonyProvider,
  CreateSubaccountParams,
  SubaccountResult,
  Subaccount,
  NumberSearchParams,
  AvailableNumber,
  PurchaseNumberParams,
  PurchasedNumber,
  PhoneNumber,
  UpdateNumberParams,
  CreateTrunkParams,
  SipTrunk,
  UpdateTrunkParams,
  ProviderHealthStatus,
  TelephonyError,
  TELEPHONY_ERRORS,
} from './types'

// ============================================================================
// Twilio Client Configuration
// ============================================================================

interface TwilioConfig {
  accountSid: string
  authToken: string
}

// ============================================================================
// Twilio Provider Implementation
// ============================================================================

export class TwilioProvider implements TelephonyProvider {
  readonly name = 'twilio'
  readonly type: 'twilio' | 'telnyx' | 'bandwidth' | 'signalwire' = 'twilio'
  readonly supportsSubaccounts = true
  readonly supportsSipTrunks = true
  
  private client: twilio.Twilio
  private config: TwilioConfig
  
  constructor(config?: Partial<TwilioConfig>) {
    this.config = {
      accountSid: config?.accountSid || process.env.TWILIO_ACCOUNT_SID!,
      authToken: config?.authToken || process.env.TWILIO_AUTH_TOKEN!,
    }
    
    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error('Twilio credentials not configured')
    }
    
    this.client = twilio(this.config.accountSid, this.config.authToken)
  }
  
  // ==========================================================================
  // Subaccount Operations
  // ==========================================================================
  
  async createSubaccount(params: CreateSubaccountParams): Promise<SubaccountResult> {
    try {
      const account = await this.client.api.accounts.create({
        friendlyName: params.friendlyName,
      })
      
      return {
        sid: account.sid,
        authToken: account.authToken,
        friendlyName: account.friendlyName,
        status: this.mapAccountStatus(account.status),
        dateCreated: new Date(account.dateCreated),
      }
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.SUBACCOUNT_CREATE_FAILED,
        `Failed to create Twilio subaccount: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async getSubaccount(subaccountSid: string): Promise<Subaccount | null> {
    try {
      const account = await this.client.api.accounts(subaccountSid).fetch()
      
      return {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: this.mapAccountStatus(account.status),
        dateCreated: new Date(account.dateCreated),
        dateUpdated: new Date(account.dateUpdated),
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null
      }
      throw error
    }
  }
  
  async suspendSubaccount(subaccountSid: string): Promise<void> {
    try {
      await this.client.api.accounts(subaccountSid).update({
        status: 'suspended',
      })
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.SUBACCOUNT_NOT_FOUND,
        `Failed to suspend subaccount: ${this.getErrorMessage(error)}`,
        'twilio',
        false,
        error
      )
    }
  }
  
  async resumeSubaccount(subaccountSid: string): Promise<void> {
    try {
      await this.client.api.accounts(subaccountSid).update({
        status: 'active',
      })
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.SUBACCOUNT_NOT_FOUND,
        `Failed to resume subaccount: ${this.getErrorMessage(error)}`,
        'twilio',
        false,
        error
      )
    }
  }
  
  async closeSubaccount(subaccountSid: string): Promise<void> {
    try {
      await this.client.api.accounts(subaccountSid).update({
        status: 'closed',
      })
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.SUBACCOUNT_NOT_FOUND,
        `Failed to close subaccount: ${this.getErrorMessage(error)}`,
        'twilio',
        false,
        error
      )
    }
  }
  
  // ==========================================================================
  // Number Operations
  // ==========================================================================
  
  async searchNumbers(params: NumberSearchParams): Promise<AvailableNumber[]> {
    try {
      const client = params.subaccountSid 
        ? twilio(params.subaccountSid, process.env.TWILIO_AUTH_TOKEN!)
        : this.client
      
      let searchRequest
      
      // Choose the right endpoint based on number type
      switch (params.type) {
        case 'toll_free':
          searchRequest = client.availablePhoneNumbers(params.country).tollFree
          break
        case 'mobile':
          searchRequest = client.availablePhoneNumbers(params.country).mobile
          break
        case 'local':
        default:
          searchRequest = client.availablePhoneNumbers(params.country).local
      }
      
      // Build search parameters
      const searchParams: Record<string, unknown> = {}
      
      if (params.areaCode) searchParams.areaCode = params.areaCode
      if (params.contains) searchParams.contains = params.contains
      if (params.locality) searchParams.inLocality = params.locality
      if (params.region) searchParams.inRegion = params.region
      if (params.postalCode) searchParams.inPostalCode = params.postalCode
      
      const numbers = await searchRequest.list({
        ...searchParams,
        limit: params.limit || 20,
      })
      
      return numbers.map(n => ({
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName,
        locality: n.locality,
        region: n.region,
        postalCode: n.postalCode,
        country: params.country,
        capabilities: {
          voice: n.capabilities.voice,
          sms: n.capabilities.sms,
          mms: n.capabilities.mms,
        },
        type: params.type || 'local',
        addressRequirements: n.addressRequirements as 'none' | 'local' | 'foreign' | 'any',
        monthlyPriceCents: 100, // $1.00 - fetch actual pricing in production
      }))
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.NUMBER_SEARCH_FAILED,
        `Number search failed: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async purchaseNumber(params: PurchaseNumberParams): Promise<PurchasedNumber> {
    try {
      const client = params.subaccountSid
        ? twilio(params.subaccountSid, process.env.TWILIO_AUTH_TOKEN!)
        : this.client
      
      const purchaseParams: Record<string, string> = {
        phoneNumber: params.phoneNumber,
      }
      
      if (params.friendlyName) purchaseParams.friendlyName = params.friendlyName
      if (params.voiceUrl) purchaseParams.voiceUrl = params.voiceUrl
      if (params.voiceMethod) purchaseParams.voiceMethod = params.voiceMethod
      if (params.smsUrl) purchaseParams.smsUrl = params.smsUrl
      if (params.smsMethod) purchaseParams.smsMethod = params.smsMethod
      if (params.statusCallback) purchaseParams.statusCallback = params.statusCallback
      
      const number = await client.incomingPhoneNumbers.create(purchaseParams)
      
      return {
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: {
          voice: number.capabilities.voice,
          sms: number.capabilities.sms,
          mms: number.capabilities.mms,
        },
        status: 'active',
        dateCreated: new Date(number.dateCreated),
      }
    } catch (error) {
      // Check for specific error types
      const errorMessage = this.getErrorMessage(error)
      
      if (errorMessage.includes('not available')) {
        throw new TelephonyError(
          TELEPHONY_ERRORS.NUMBER_NOT_AVAILABLE,
          `Number ${params.phoneNumber} is not available for purchase`,
          'twilio',
          false,
          error
        )
      }
      
      throw new TelephonyError(
        TELEPHONY_ERRORS.NUMBER_PURCHASE_FAILED,
        `Failed to purchase number: ${errorMessage}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async releaseNumber(numberSid: string, subaccountSid?: string): Promise<void> {
    try {
      const client = subaccountSid
        ? twilio(subaccountSid, process.env.TWILIO_AUTH_TOKEN!)
        : this.client
      
      await client.incomingPhoneNumbers(numberSid).remove()
    } catch (error) {
      if (this.isNotFoundError(error)) {
        // Already released, consider success
        return
      }
      
      throw new TelephonyError(
        TELEPHONY_ERRORS.NUMBER_RELEASE_FAILED,
        `Failed to release number: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async getNumber(numberSid: string, subaccountSid?: string): Promise<PhoneNumber | null> {
    try {
      const client = subaccountSid
        ? twilio(subaccountSid, process.env.TWILIO_AUTH_TOKEN!)
        : this.client
      
      const number = await client.incomingPhoneNumbers(numberSid).fetch()
      
      return {
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: {
          voice: number.capabilities.voice,
          sms: number.capabilities.sms,
          mms: number.capabilities.mms,
        },
        status: 'active',
        voiceUrl: number.voiceUrl,
        smsUrl: number.smsUrl,
        trunkSid: number.trunkSid,
        dateCreated: new Date(number.dateCreated),
        dateUpdated: new Date(number.dateUpdated),
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null
      }
      throw error
    }
  }
  
  async updateNumber(numberSid: string, params: UpdateNumberParams): Promise<PhoneNumber> {
    try {
      const updateParams: Record<string, string> = {}
      
      if (params.friendlyName) updateParams.friendlyName = params.friendlyName
      if (params.voiceUrl) updateParams.voiceUrl = params.voiceUrl
      if (params.voiceMethod) updateParams.voiceMethod = params.voiceMethod
      if (params.voiceFallbackUrl) updateParams.voiceFallbackUrl = params.voiceFallbackUrl
      if (params.smsUrl) updateParams.smsUrl = params.smsUrl
      if (params.smsMethod) updateParams.smsMethod = params.smsMethod
      if (params.statusCallback) updateParams.statusCallback = params.statusCallback
      
      const number = await this.client.incomingPhoneNumbers(numberSid).update(updateParams)
      
      return {
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: {
          voice: number.capabilities.voice,
          sms: number.capabilities.sms,
          mms: number.capabilities.mms,
        },
        status: 'active',
        voiceUrl: number.voiceUrl,
        smsUrl: number.smsUrl,
        trunkSid: number.trunkSid,
        dateCreated: new Date(number.dateCreated),
        dateUpdated: new Date(number.dateUpdated),
      }
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.NUMBER_NOT_FOUND,
        `Failed to update number: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async listNumbers(subaccountSid?: string): Promise<PhoneNumber[]> {
    const client = subaccountSid
      ? twilio(subaccountSid, process.env.TWILIO_AUTH_TOKEN!)
      : this.client
    
    const numbers = await client.incomingPhoneNumbers.list()
    
    return numbers.map(n => ({
      sid: n.sid,
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      capabilities: {
        voice: n.capabilities.voice,
        sms: n.capabilities.sms,
        mms: n.capabilities.mms,
      },
      status: 'active' as const,
      voiceUrl: n.voiceUrl,
      smsUrl: n.smsUrl,
      trunkSid: n.trunkSid,
      dateCreated: new Date(n.dateCreated),
      dateUpdated: new Date(n.dateUpdated),
    }))
  }
  
  // ==========================================================================
  // SIP Trunk Operations
  // ==========================================================================
  
  async createTrunk(params: CreateTrunkParams): Promise<SipTrunk> {
    try {
      const client = params.subaccountSid
        ? twilio(params.subaccountSid, process.env.TWILIO_AUTH_TOKEN!)
        : this.client
      
      const trunk = await client.trunking.v1.trunks.create({
        friendlyName: params.friendlyName,
        domainName: params.domainName,
        secure: params.secure ?? true,
        cnamLookupEnabled: params.cnamLookupEnabled ?? false,
        disasterRecoveryUrl: params.disasterRecoveryUrl,
        disasterRecoveryMethod: params.disasterRecoveryMethod,
      })
      
      // Get termination URI
      const terminationUri = `${trunk.sid}.pstn.twilio.com`
      
      return {
        sid: trunk.sid,
        friendlyName: trunk.friendlyName,
        domainName: trunk.domainName,
        terminationUri,
        originationUris: [],
        secure: trunk.secure,
        cnamLookupEnabled: trunk.cnamLookupEnabled,
        status: 'active',
        dateCreated: new Date(trunk.dateCreated),
        dateUpdated: new Date(trunk.dateUpdated),
      }
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.TRUNK_CREATE_FAILED,
        `Failed to create SIP trunk: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async getTrunk(trunkSid: string): Promise<SipTrunk | null> {
    try {
      const trunk = await this.client.trunking.v1.trunks(trunkSid).fetch()
      
      // Get origination URIs
      const originationUris = await this.client.trunking.v1
        .trunks(trunkSid)
        .originationUrls.list()
      
      return {
        sid: trunk.sid,
        friendlyName: trunk.friendlyName,
        domainName: trunk.domainName,
        terminationUri: `${trunk.sid}.pstn.twilio.com`,
        originationUris: originationUris.map(o => o.sipUrl),
        secure: trunk.secure,
        cnamLookupEnabled: trunk.cnamLookupEnabled,
        status: 'active',
        dateCreated: new Date(trunk.dateCreated),
        dateUpdated: new Date(trunk.dateUpdated),
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null
      }
      throw error
    }
  }
  
  async updateTrunk(trunkSid: string, params: UpdateTrunkParams): Promise<SipTrunk> {
    try {
      const updateParams: Record<string, unknown> = {}
      
      if (params.friendlyName) updateParams.friendlyName = params.friendlyName
      if (params.secure !== undefined) updateParams.secure = params.secure
      if (params.cnamLookupEnabled !== undefined) updateParams.cnamLookupEnabled = params.cnamLookupEnabled
      if (params.disasterRecoveryUrl) updateParams.disasterRecoveryUrl = params.disasterRecoveryUrl
      if (params.disasterRecoveryMethod) updateParams.disasterRecoveryMethod = params.disasterRecoveryMethod
      
      const trunk = await this.client.trunking.v1.trunks(trunkSid).update(updateParams)
      
      return {
        sid: trunk.sid,
        friendlyName: trunk.friendlyName,
        domainName: trunk.domainName,
        terminationUri: `${trunk.sid}.pstn.twilio.com`,
        originationUris: [],
        secure: trunk.secure,
        cnamLookupEnabled: trunk.cnamLookupEnabled,
        status: 'active',
        dateCreated: new Date(trunk.dateCreated),
        dateUpdated: new Date(trunk.dateUpdated),
      }
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.TRUNK_NOT_FOUND,
        `Failed to update trunk: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async deleteTrunk(trunkSid: string): Promise<void> {
    try {
      await this.client.trunking.v1.trunks(trunkSid).remove()
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return
      }
      throw new TelephonyError(
        TELEPHONY_ERRORS.TRUNK_NOT_FOUND,
        `Failed to delete trunk: ${this.getErrorMessage(error)}`,
        'twilio',
        false,
        error
      )
    }
  }
  
  async attachNumberToTrunk(trunkSid: string, numberSid: string): Promise<void> {
    try {
      await this.client.trunking.v1
        .trunks(trunkSid)
        .phoneNumbers.create({ phoneNumberSid: numberSid })
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.TRUNK_BINDING_FAILED,
        `Failed to attach number to trunk: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async detachNumberFromTrunk(trunkSid: string, numberSid: string): Promise<void> {
    try {
      await this.client.trunking.v1
        .trunks(trunkSid)
        .phoneNumbers(numberSid)
        .remove()
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return
      }
      throw new TelephonyError(
        TELEPHONY_ERRORS.TRUNK_BINDING_FAILED,
        `Failed to detach number from trunk: ${this.getErrorMessage(error)}`,
        'twilio',
        false,
        error
      )
    }
  }
  
  // ==========================================================================
  // Webhook Validation
  // ==========================================================================
  
  validateWebhook(payload: string, signature: string, url: string): boolean {
    try {
      return twilio.validateRequest(
        this.config.authToken,
        signature,
        url,
        JSON.parse(payload)
      )
    } catch {
      return false
    }
  }
  
  // ==========================================================================
  // SIP Endpoint Operations
  // ==========================================================================
  
  async createSipEndpoint(params: { friendlyName: string; terminationUri: string; originationUri?: string }): Promise<{ id: string; friendlyName: string; terminationUri: string; originationUri?: string }> {
    try {
      const sip = await this.client.sip.domains.create({
        domainName: params.friendlyName.toLowerCase().replace(/\s+/g, '-'),
        friendlyName: params.friendlyName,
      })
      
      return {
        id: sip.sid,
        friendlyName: sip.friendlyName,
        terminationUri: params.terminationUri,
        originationUri: params.originationUri,
      }
    } catch (error) {
      throw new TelephonyError(
        TELEPHONY_ERRORS.ENDPOINT_CREATE_FAILED,
        `Failed to create SIP endpoint: ${this.getErrorMessage(error)}`,
        'twilio',
        this.isRetryable(error),
        error
      )
    }
  }
  
  async deleteSipEndpoint(endpointId: string): Promise<void> {
    try {
      await this.client.sip.domains(endpointId).remove()
    } catch (error) {
      if (!this.isNotFoundError(error)) {
        throw new TelephonyError(
          TELEPHONY_ERRORS.ENDPOINT_DELETE_FAILED,
          `Failed to delete SIP endpoint: ${this.getErrorMessage(error)}`,
          'twilio',
          this.isRetryable(error),
          error
        )
      }
    }
  }
  
  // ==========================================================================
  // Health Check
  // ==========================================================================
  
  async healthCheck(): Promise<ProviderHealthStatus> {
    const startTime = Date.now()
    
    try {
      // Try to fetch account info as a health check
      await this.client.api.accounts(this.config.accountSid).fetch()
      
      return {
        provider: 'twilio',
        healthy: true,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
      }
    } catch (error) {
      return {
        provider: 'twilio',
        healthy: false,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
        details: {
          error: this.getErrorMessage(error),
        },
      }
    }
  }
  
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  
  private mapAccountStatus(status: string): 'active' | 'suspended' | 'closed' {
    switch (status) {
      case 'active':
        return 'active'
      case 'suspended':
        return 'suspended'
      case 'closed':
        return 'closed'
      default:
        return 'active'
    }
  }
  
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }
  
  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      return (error as { code: number }).code === 20404
    }
    return false
  }
  
  private isRetryable(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: number }).code
      // 5xx errors and rate limiting are retryable
      return code >= 50000 || code === 20429
    }
    return false
  }
}

// ============================================================================
// Factory
// ============================================================================

let providerInstance: TwilioProvider | null = null

export function getTwilioProvider(): TwilioProvider {
  if (!providerInstance) {
    providerInstance = new TwilioProvider()
  }
  return providerInstance
}

// For testing with custom config
export function createTwilioProvider(config: Partial<TwilioConfig>): TwilioProvider {
  return new TwilioProvider(config)
}
