/**
 * OPCALLS: International Telephony Compliance
 * 
 * Handles regulatory requirements for phone number provisioning
 * across different countries worldwide.
 */

// ============================================================================
// Country Regulatory Requirements
// ============================================================================

export interface CountryRegulation {
  country: string
  countryCode: string
  dialCode: string
  requirements: {
    localAddress: boolean
    businessRegistration: boolean
    identityVerification: boolean
    regulatoryBundle: boolean
    localPresence: boolean
    consentRecording: boolean // Call recording consent
    dataResidency?: string // Where data must be stored
  }
  numberTypes: ('local' | 'toll_free' | 'mobile' | 'national')[]
  restrictions: string[]
  twilioSupported: boolean
  tier: 1 | 2 | 3 // 1 = easy, 2 = moderate, 3 = complex
}

export const COUNTRY_REGULATIONS: Record<string, CountryRegulation> = {
  // ===== TIER 1: Easy - Minimal Requirements =====
  US: {
    country: 'United States',
    countryCode: 'US',
    dialCode: '+1',
    requirements: {
      localAddress: false,
      businessRegistration: false,
      identityVerification: false,
      regulatoryBundle: false,
      localPresence: false,
      consentRecording: true, // One-party consent varies by state
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: [],
    twilioSupported: true,
    tier: 1,
  },
  CA: {
    country: 'Canada',
    countryCode: 'CA',
    dialCode: '+1',
    requirements: {
      localAddress: false,
      businessRegistration: false,
      identityVerification: false,
      regulatoryBundle: false,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: [],
    twilioSupported: true,
    tier: 1,
  },
  GB: {
    country: 'United Kingdom',
    countryCode: 'GB',
    dialCode: '+44',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: false,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile', 'national'],
    restrictions: [],
    twilioSupported: true,
    tier: 1,
  },
  AU: {
    country: 'Australia',
    countryCode: 'AU',
    dialCode: '+61',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: false,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: [],
    twilioSupported: true,
    tier: 1,
  },
  
  // ===== TIER 2: Moderate - Address/Identity Required =====
  DE: {
    country: 'Germany',
    countryCode: 'DE',
    dialCode: '+49',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true, // Two-party consent required
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile', 'national'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  FR: {
    country: 'France',
    countryCode: 'FR',
    dialCode: '+33',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required', 'ARCEP regulations'],
    twilioSupported: true,
    tier: 2,
  },
  NL: {
    country: 'Netherlands',
    countryCode: 'NL',
    dialCode: '+31',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  ES: {
    country: 'Spain',
    countryCode: 'ES',
    dialCode: '+34',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  IT: {
    country: 'Italy',
    countryCode: 'IT',
    dialCode: '+39',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  JP: {
    country: 'Japan',
    countryCode: 'JP',
    dialCode: '+81',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['Local presence required for most number types'],
    twilioSupported: true,
    tier: 2,
  },
  SG: {
    country: 'Singapore',
    countryCode: 'SG',
    dialCode: '+65',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['IMDA registration required'],
    twilioSupported: true,
    tier: 2,
  },
  MX: {
    country: 'Mexico',
    countryCode: 'MX',
    dialCode: '+52',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['IFT registration may be required'],
    twilioSupported: true,
    tier: 2,
  },
  BR: {
    country: 'Brazil',
    countryCode: 'BR',
    dialCode: '+55',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
      dataResidency: 'BR',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['ANATEL registration required', 'Local entity required'],
    twilioSupported: true,
    tier: 2,
  },
  
  // ===== TIER 3: Complex - Full Local Presence/Registration =====
  IN: {
    country: 'India',
    countryCode: 'IN',
    dialCode: '+91',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
      dataResidency: 'IN',
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: [
      'DOT license required',
      'Local entity mandatory',
      'Data localization required',
      'No mobile numbers for foreign entities',
    ],
    twilioSupported: true,
    tier: 3,
  },
  CN: {
    country: 'China',
    countryCode: 'CN',
    dialCode: '+86',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
      dataResidency: 'CN',
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: [
      'MIIT license required',
      'Local entity mandatory',
      'Strict data localization',
      'Government approval needed',
    ],
    twilioSupported: false, // Limited support
    tier: 3,
  },
  RU: {
    country: 'Russia',
    countryCode: 'RU',
    dialCode: '+7',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
      dataResidency: 'RU',
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: [
      'Roskomnadzor registration',
      'Data localization law',
      'Local entity may be required',
    ],
    twilioSupported: false, // Limited/no support
    tier: 3,
  },
  AE: {
    country: 'United Arab Emirates',
    countryCode: 'AE',
    dialCode: '+971',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['TRA license required', 'Local presence mandatory'],
    twilioSupported: true,
    tier: 3,
  },
  SA: {
    country: 'Saudi Arabia',
    countryCode: 'SA',
    dialCode: '+966',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['CITC license required', 'Local entity mandatory'],
    twilioSupported: true,
    tier: 3,
  },
  ZA: {
    country: 'South Africa',
    countryCode: 'ZA',
    dialCode: '+27',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['ICASA registration required'],
    twilioSupported: true,
    tier: 2,
  },
  
  // ===== Additional Countries (Tier 1-2) =====
  NZ: {
    country: 'New Zealand',
    countryCode: 'NZ',
    dialCode: '+64',
    requirements: {
      localAddress: false,
      businessRegistration: false,
      identityVerification: false,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: [],
    twilioSupported: true,
    tier: 1,
  },
  IE: {
    country: 'Ireland',
    countryCode: 'IE',
    dialCode: '+353',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  SE: {
    country: 'Sweden',
    countryCode: 'SE',
    dialCode: '+46',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  CH: {
    country: 'Switzerland',
    countryCode: 'CH',
    dialCode: '+41',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['OFCOM registration'],
    twilioSupported: true,
    tier: 2,
  },
  BE: {
    country: 'Belgium',
    countryCode: 'BE',
    dialCode: '+32',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  AT: {
    country: 'Austria',
    countryCode: 'AT',
    dialCode: '+43',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  PL: {
    country: 'Poland',
    countryCode: 'PL',
    dialCode: '+48',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  PT: {
    country: 'Portugal',
    countryCode: 'PT',
    dialCode: '+351',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
      dataResidency: 'EU',
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['GDPR compliance required'],
    twilioSupported: true,
    tier: 2,
  },
  HK: {
    country: 'Hong Kong',
    countryCode: 'HK',
    dialCode: '+852',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['OFCA registration'],
    twilioSupported: true,
    tier: 2,
  },
  KR: {
    country: 'South Korea',
    countryCode: 'KR',
    dialCode: '+82',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
      dataResidency: 'KR',
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['KCC registration', 'Local presence required'],
    twilioSupported: true,
    tier: 3,
  },
  IL: {
    country: 'Israel',
    countryCode: 'IL',
    dialCode: '+972',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['MOC registration'],
    twilioSupported: true,
    tier: 2,
  },
  PH: {
    country: 'Philippines',
    countryCode: 'PH',
    dialCode: '+63',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['NTC registration'],
    twilioSupported: true,
    tier: 2,
  },
  TH: {
    country: 'Thailand',
    countryCode: 'TH',
    dialCode: '+66',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['NBTC registration', 'Local presence may be required'],
    twilioSupported: true,
    tier: 2,
  },
  MY: {
    country: 'Malaysia',
    countryCode: 'MY',
    dialCode: '+60',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['MCMC registration'],
    twilioSupported: true,
    tier: 2,
  },
  ID: {
    country: 'Indonesia',
    countryCode: 'ID',
    dialCode: '+62',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
      dataResidency: 'ID',
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['Kominfo registration', 'Local entity required'],
    twilioSupported: true,
    tier: 3,
  },
  CO: {
    country: 'Colombia',
    countryCode: 'CO',
    dialCode: '+57',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['CRC registration'],
    twilioSupported: true,
    tier: 2,
  },
  CL: {
    country: 'Chile',
    countryCode: 'CL',
    dialCode: '+56',
    requirements: {
      localAddress: true,
      businessRegistration: false,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: [],
    twilioSupported: true,
    tier: 2,
  },
  AR: {
    country: 'Argentina',
    countryCode: 'AR',
    dialCode: '+54',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['ENACOM registration'],
    twilioSupported: true,
    tier: 2,
  },
  PE: {
    country: 'Peru',
    countryCode: 'PE',
    dialCode: '+51',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['OSIPTEL registration'],
    twilioSupported: true,
    tier: 2,
  },
  NG: {
    country: 'Nigeria',
    countryCode: 'NG',
    dialCode: '+234',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['NCC registration', 'Local entity may be required'],
    twilioSupported: true,
    tier: 3,
  },
  EG: {
    country: 'Egypt',
    countryCode: 'EG',
    dialCode: '+20',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: true,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free'],
    restrictions: ['NTRA registration', 'Local entity required'],
    twilioSupported: true,
    tier: 3,
  },
  KE: {
    country: 'Kenya',
    countryCode: 'KE',
    dialCode: '+254',
    requirements: {
      localAddress: true,
      businessRegistration: true,
      identityVerification: true,
      regulatoryBundle: true,
      localPresence: false,
      consentRecording: true,
    },
    numberTypes: ['local', 'toll_free', 'mobile'],
    restrictions: ['CAK registration'],
    twilioSupported: true,
    tier: 2,
  },
}

// ============================================================================
// Compliance Check Functions
// ============================================================================

export interface ComplianceCheckResult {
  allowed: boolean
  country: CountryRegulation
  missingRequirements: string[]
  warnings: string[]
  estimatedSetupTime: string
  additionalCosts?: string
}

/**
 * Check if a country is supported and what requirements are needed
 */
export function checkCountryCompliance(
  countryCode: string,
  orgData?: {
    hasLocalAddress?: boolean
    hasBusinessRegistration?: boolean
    hasIdentityVerification?: boolean
    hasRegulatoryBundle?: boolean
    hasLocalPresence?: boolean
  }
): ComplianceCheckResult {
  const regulation = COUNTRY_REGULATIONS[countryCode]
  
  if (!regulation) {
    return {
      allowed: false,
      country: {
        country: 'Unknown',
        countryCode,
        dialCode: '',
        requirements: {
          localAddress: true,
          businessRegistration: true,
          identityVerification: true,
          regulatoryBundle: true,
          localPresence: true,
          consentRecording: true,
        },
        numberTypes: [],
        restrictions: ['Country not supported'],
        twilioSupported: false,
        tier: 3,
      },
      missingRequirements: ['Country not in supported list'],
      warnings: ['Contact support for availability'],
      estimatedSetupTime: 'Unknown',
    }
  }
  
  if (!regulation.twilioSupported) {
    return {
      allowed: false,
      country: regulation,
      missingRequirements: ['Twilio does not support this country'],
      warnings: regulation.restrictions,
      estimatedSetupTime: 'Not available',
    }
  }
  
  const missingRequirements: string[] = []
  const warnings: string[] = []
  
  // Check each requirement
  if (regulation.requirements.localAddress && !orgData?.hasLocalAddress) {
    missingRequirements.push('Local address verification required')
  }
  if (regulation.requirements.businessRegistration && !orgData?.hasBusinessRegistration) {
    missingRequirements.push('Business registration documents required')
  }
  if (regulation.requirements.identityVerification && !orgData?.hasIdentityVerification) {
    missingRequirements.push('Identity verification (ID/passport) required')
  }
  if (regulation.requirements.regulatoryBundle && !orgData?.hasRegulatoryBundle) {
    missingRequirements.push('Regulatory bundle submission required')
  }
  if (regulation.requirements.localPresence && !orgData?.hasLocalPresence) {
    missingRequirements.push('Local business presence/entity required')
  }
  
  // Add warnings for restrictions
  warnings.push(...regulation.restrictions)
  
  if (regulation.requirements.consentRecording) {
    warnings.push('Call recording consent may be required in this jurisdiction')
  }
  
  if (regulation.requirements.dataResidency) {
    warnings.push(`Data must be stored in ${regulation.requirements.dataResidency}`)
  }
  
  // Estimate setup time based on tier
  let estimatedSetupTime: string
  switch (regulation.tier) {
    case 1:
      estimatedSetupTime = 'Instant - 24 hours'
      break
    case 2:
      estimatedSetupTime = '2-7 business days'
      break
    case 3:
      estimatedSetupTime = '2-6 weeks'
      break
  }
  
  return {
    allowed: missingRequirements.length === 0,
    country: regulation,
    missingRequirements,
    warnings,
    estimatedSetupTime,
    additionalCosts: regulation.tier === 3 ? 'Additional setup fees may apply' : undefined,
  }
}

/**
 * Get all supported countries
 */
export function getSupportedCountries(): CountryRegulation[] {
  return Object.values(COUNTRY_REGULATIONS)
    .filter(c => c.twilioSupported)
    .sort((a, b) => a.tier - b.tier || a.country.localeCompare(b.country))
}

/**
 * Get countries by tier
 */
export function getCountriesByTier(tier: 1 | 2 | 3): CountryRegulation[] {
  return Object.values(COUNTRY_REGULATIONS)
    .filter(c => c.tier === tier && c.twilioSupported)
    .sort((a, b) => a.country.localeCompare(b.country))
}

/**
 * Get easy countries (Tier 1) for quick setup
 */
export function getEasyCountries(): CountryRegulation[] {
  return getCountriesByTier(1)
}

/**
 * Check if recording consent is required
 */
export function requiresRecordingConsent(countryCode: string): boolean {
  const regulation = COUNTRY_REGULATIONS[countryCode]
  return regulation?.requirements.consentRecording ?? true
}

/**
 * Check if GDPR applies
 */
export function requiresGDPR(countryCode: string): boolean {
  const regulation = COUNTRY_REGULATIONS[countryCode]
  return regulation?.requirements.dataResidency === 'EU'
}

/**
 * Get data residency requirement
 */
export function getDataResidency(countryCode: string): string | null {
  const regulation = COUNTRY_REGULATIONS[countryCode]
  return regulation?.requirements.dataResidency ?? null
}
