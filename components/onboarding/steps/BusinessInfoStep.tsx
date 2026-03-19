/**
 * Business Info Step - Matching Landing Page Design
 */

'use client'

import { useState } from 'react'

interface BusinessInfoData {
  name: string
  industry: string
  phone?: string
  address?: string
  website?: string
  timezone?: string
}

interface Props {
  data?: BusinessInfoData
  onComplete: (data: BusinessInfoData) => void
  saving: boolean
}

const INDUSTRIES = [
  { value: 'clinic', label: 'Medical Clinic / Healthcare' },
  { value: 'dental', label: 'Dental Practice' },
  { value: 'medspa', label: 'Medical Spa / Aesthetics' },
  { value: 'salon', label: 'Hair Salon / Beauty' },
  { value: 'hvac', label: 'HVAC / Home Services' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'legal', label: 'Law Office / Legal' },
  { value: 'realty', label: 'Real Estate' },
  { value: 'fitness', label: 'Fitness / Gym' },
  { value: 'restaurant', label: 'Restaurant / Food Service' },
  { value: 'auto', label: 'Auto Services' },
  { value: 'other', label: 'Other' },
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
]

export function BusinessInfoStep({ data, onComplete, saving }: Props) {
  const [formData, setFormData] = useState<BusinessInfoData>({
    name: data?.name || '',
    industry: data?.industry || '',
    phone: data?.phone || '',
    address: data?.address || '',
    website: data?.website || '',
    timezone: data?.timezone || 'America/New_York',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleChange = (field: keyof BusinessInfoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required'
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Please select an industry'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    onComplete(formData)
  }
  
  const inputClasses = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
  const selectClasses = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer transition-all"
  const labelClasses = "block text-sm text-white/60 mb-2"
  const errorInputClasses = "w-full px-4 py-3 bg-white/5 border border-red-500/50 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-white/50 text-sm mb-6">
        Tell us about your business so we can customize your AI receptionist.
      </p>
      
      {/* Business Name */}
      <div>
        <label className={labelClasses}>
          Business Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Acme Dental Clinic"
          className={errors.name ? errorInputClasses : inputClasses}
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
        )}
      </div>
      
      {/* Industry */}
      <div>
        <label className={labelClasses}>
          Industry <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            className={errors.industry ? errorInputClasses : selectClasses}
            style={{ colorScheme: 'dark' }}
          >
            <option value="" className="bg-[#0a0a0a]">Select your industry</option>
            {INDUSTRIES.map(ind => (
              <option key={ind.value} value={ind.value} className="bg-[#0a0a0a]">{ind.label}</option>
            ))}
          </select>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {errors.industry && (
          <p className="mt-1.5 text-sm text-red-400">{errors.industry}</p>
        )}
      </div>
      
      {/* Phone */}
      <div>
        <label className={labelClasses}>Business Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(555) 123-4567"
          className={inputClasses}
        />
      </div>
      
      {/* Address */}
      <div>
        <label className={labelClasses}>Business Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Main St, City, State ZIP"
          className={inputClasses}
        />
      </div>
      
      {/* Timezone */}
      <div>
        <label className={labelClasses}>Timezone</label>
        <div className="relative">
          <select
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className={selectClasses}
            style={{ colorScheme: 'dark' }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value} className="bg-[#0a0a0a]">{tz.label}</option>
            ))}
          </select>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed transition-all mt-4"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full" />
            Saving...
          </span>
        ) : (
          'Continue'
        )}
      </button>
    </form>
  )
}
