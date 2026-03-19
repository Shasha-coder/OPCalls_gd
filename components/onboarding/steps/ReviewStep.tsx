'use client'

import { OnboardingData } from '../OnboardingWizard'

interface Props {
  data: OnboardingData
  onConfirm: () => void
  onBack: () => void
  saving: boolean
  error?: string | null
}

const INDUSTRY_LABELS: Record<string, string> = {
  clinic: 'Medical Clinic',
  dental: 'Dental Practice',
  medspa: 'Medical Spa',
  salon: 'Hair Salon',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  legal: 'Law Office',
  realty: 'Real Estate',
  fitness: 'Fitness',
  restaurant: 'Restaurant',
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
  const dayNames: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
  const openDays = Object.entries(hours).filter(([_, s]) => s.enabled).map(([day]) => dayNames[day])
  if (openDays.length === 0) return 'No hours set'
  if (openDays.length === 7) return 'Open every day'
  return openDays.join(', ')
}

export function ReviewStep({ data, onConfirm, onBack, saving, error }: Props) {
  const industryLabel = data.businessInfo?.industry === 'other' 
    ? data.businessInfo?.industryOther || 'Other'
    : INDUSTRY_LABELS[data.businessInfo?.industry || ''] || 'Not set'

  return (
    <div className="space-y-5">
      <p className="text-white/50 text-sm mb-6">
        Review your setup before we create everything for you.
      </p>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-red-400 font-medium">Setup Error</p>
            <p className="text-sm text-white/60 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      {/* Business Info */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">Business Information</h3>
          <span className="text-xs text-white/40">Step 1</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Name</span>
            <span className="text-white">{data.businessInfo?.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Industry</span>
            <span className="text-white">{industryLabel}</span>
          </div>
          {data.businessInfo?.phone && (
            <div className="flex justify-between">
              <span className="text-white/50">Phone</span>
              <span className="text-white">{data.businessInfo.phone}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Business Hours */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">Business Hours</h3>
          <span className="text-xs text-white/40">Step 2</span>
        </div>
        <div className="text-sm text-white">{formatBusinessHours(data.businessHours)}</div>
      </div>
      
      {/* AI Agent */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">AI Agent</h3>
          <span className="text-xs text-white/40">Step 3</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Name</span>
            <span className="text-white">{data.agentConfig?.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Type</span>
            <span className="text-white">{AGENT_TYPE_LABELS[data.agentConfig?.type || ''] || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Voice</span>
            <span className="text-white">{data.agentConfig?.voiceId?.replace('11labs-', '') || 'Not set'}</span>
          </div>
        </div>
      </div>
      
      {/* Phone Number */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">Phone Number</h3>
          <span className="text-xs text-white/40">Step 4</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Type</span>
            <span className="text-white capitalize">{data.phoneConfig?.type || 'local'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Number</span>
            <span className="text-white font-mono">{formatPhoneNumber(data.phoneConfig?.selectedNumber)}</span>
          </div>
        </div>
      </div>
      
      {/* What happens next */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="font-medium text-white mb-3">What happens next?</h3>
        <ul className="text-sm text-white/60 space-y-2">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7"/></svg>
            Create your organization and dashboard
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7"/></svg>
            Set up your AI voice agent with your preferences
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7"/></svg>
            Provision your phone number (if purchased)
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7"/></svg>
            Your AI receptionist will be ready in ~30 seconds
          </li>
        </ul>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="px-6 py-3.5 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={saving}
          className="flex-1 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Setting up...
            </>
          ) : (
            'Start Setup'
          )}
        </button>
      </div>
    </div>
  )
}
