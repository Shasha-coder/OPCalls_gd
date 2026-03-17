/**
 * Review Step
 */

'use client'

import { OnboardingData } from '../OnboardingWizard'

interface Props {
  data: OnboardingData
  onConfirm: () => void
  onBack: () => void
  saving: boolean
}

const INDUSTRY_LABELS: Record<string, string> = {
  clinic: 'Medical Clinic / Healthcare',
  dental: 'Dental Practice',
  medspa: 'Medical Spa / Aesthetics',
  salon: 'Hair Salon / Beauty',
  hvac: 'HVAC / Home Services',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  legal: 'Law Office / Legal',
  realty: 'Real Estate',
  fitness: 'Fitness / Gym',
  restaurant: 'Restaurant / Food Service',
  auto: 'Auto Services',
  other: 'Other',
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  receptionist: 'Receptionist',
  booking: 'Booking Agent',
  support: 'Support Agent',
  afterhours: 'After Hours',
}

const formatPhoneNumber = (number?: string) => {
  if (!number) return 'Auto-assigned'
  if (number.startsWith('+1') && number.length === 12) {
    return `(${number.slice(2, 5)}) ${number.slice(5, 8)}-${number.slice(8)}`
  }
  return number
}

const formatBusinessHours = (hours?: Record<string, { open: string; close: string; enabled: boolean }>) => {
  if (!hours) return 'Not set'
  
  const dayNames: Record<string, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
  }
  
  const openDays = Object.entries(hours)
    .filter(([_, schedule]) => schedule.enabled)
    .map(([day]) => dayNames[day])
  
  if (openDays.length === 0) return 'No hours set'
  if (openDays.length === 7) return 'Open every day'
  
  return openDays.join(', ')
}

export function ReviewStep({ data, onConfirm, onBack, saving }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 mb-6">
        Review your setup before we create everything for you.
      </p>
      
      {/* Business Info */}
      <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white flex items-center gap-2">
            <span className="text-blue-400">🏢</span>
            Business Information
          </h3>
          <span className="text-xs text-slate-500">Step 1</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Name</span>
            <span className="text-white">{data.businessInfo?.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Industry</span>
            <span className="text-white">
              {INDUSTRY_LABELS[data.businessInfo?.industry || ''] || data.businessInfo?.industry || 'Not set'}
            </span>
          </div>
          {data.businessInfo?.phone && (
            <div className="flex justify-between">
              <span className="text-slate-400">Phone</span>
              <span className="text-white">{data.businessInfo.phone}</span>
            </div>
          )}
          {data.businessInfo?.address && (
            <div className="flex justify-between">
              <span className="text-slate-400">Address</span>
              <span className="text-white text-right max-w-[60%]">{data.businessInfo.address}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Business Hours */}
      <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white flex items-center gap-2">
            <span className="text-blue-400">🕐</span>
            Business Hours
          </h3>
          <span className="text-xs text-slate-500">Step 2</span>
        </div>
        <div className="text-sm">
          <span className="text-white">{formatBusinessHours(data.businessHours)}</span>
        </div>
      </div>
      
      {/* AI Agent */}
      <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white flex items-center gap-2">
            <span className="text-blue-400">🤖</span>
            AI Agent
          </h3>
          <span className="text-xs text-slate-500">Step 3</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Name</span>
            <span className="text-white">{data.agentConfig?.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Type</span>
            <span className="text-white">
              {AGENT_TYPE_LABELS[data.agentConfig?.type || ''] || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Voice</span>
            <span className="text-white">{data.agentConfig?.voiceId?.replace('11labs-', '') || 'Not set'}</span>
          </div>
          {data.agentConfig?.customInstructions && (
            <div className="pt-2 border-t border-slate-700 mt-2">
              <span className="text-slate-400 block mb-1">Custom Instructions:</span>
              <span className="text-slate-300 text-xs">{data.agentConfig.customInstructions}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Phone Number */}
      <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white flex items-center gap-2">
            <span className="text-blue-400">📞</span>
            Phone Number
          </h3>
          <span className="text-xs text-slate-500">Step 4</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Type</span>
            <span className="text-white capitalize">{data.phoneConfig?.type || 'local'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Number</span>
            <span className="text-white font-mono">
              {formatPhoneNumber(data.phoneConfig?.selectedNumber)}
            </span>
          </div>
          {data.phoneConfig?.areaCode && !data.phoneConfig?.selectedNumber && (
            <div className="flex justify-between">
              <span className="text-slate-400">Area Code</span>
              <span className="text-white">{data.phoneConfig.areaCode}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* What happens next */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-5">
        <h3 className="font-medium text-blue-400 mb-2">What happens next?</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>✓ We'll create your Twilio account and phone system</li>
          <li>✓ Set up your AI voice agent with your preferences</li>
          <li>✓ Connect your phone number to your agent</li>
          <li>✓ Your AI receptionist will be ready in ~30 seconds</li>
        </ul>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={saving}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Starting...
            </>
          ) : (
            <>
              🚀 Start Setup
            </>
          )}
        </button>
      </div>
    </div>
  )
}
