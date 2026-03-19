'use client'

import { useState } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'

interface BusinessInfoData {
  name: string
  industry: string
  industryOther?: string
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
  { value: 'other', label: 'Other (Specify below)' },
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

export function BusinessInfoStep({ data, onComplete }: Props) {
  const [formData, setFormData] = useState<BusinessInfoData>({
    name: data?.name || '',
    industry: data?.industry || '',
    industryOther: data?.industryOther || '',
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
    
    if (formData.industry === 'other' && !formData.industryOther?.trim()) {
      newErrors.industryOther = 'Please specify your industry'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    onComplete(formData)
  }
  
  const inputClasses = "w-full px-4 py-3.5 bg-[#1a1a1a] border border-white/[0.08] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:bg-[#1e1e1e] transition-all duration-200"
  const labelClasses = "block text-sm text-white/50 mb-2 font-medium"
  const errorInputClasses = "w-full px-4 py-3.5 bg-red-500/5 border border-red-500/30 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/50 transition-all duration-200"
  
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
        <Dropdown
          value={formData.industry}
          onChange={(value) => handleChange('industry', value)}
          options={INDUSTRIES}
          placeholder="Select your industry"
          error={!!errors.industry}
        />
        {errors.industry && (
          <p className="mt-1.5 text-sm text-red-400">{errors.industry}</p>
        )}
      </div>
      
      {/* Other Industry (shown when "Other" is selected) */}
      {formData.industry === 'other' && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label className={labelClasses}>
            Specify Your Industry <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.industryOther}
            onChange={(e) => handleChange('industryOther', e.target.value)}
            placeholder="e.g., Accounting, Consulting, etc."
            className={errors.industryOther ? errorInputClasses : inputClasses}
            autoFocus
          />
          {errors.industryOther && (
            <p className="mt-1.5 text-sm text-red-400">{errors.industryOther}</p>
          )}
        </div>
      )}
      
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
        <Dropdown
          value={formData.timezone || 'America/New_York'}
          onChange={(value) => handleChange('timezone', value)}
          options={TIMEZONES}
          placeholder="Select timezone"
        />
      </div>
      
      {/* Submit */}
      <button
        type="submit"
        className="w-full py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-white/90 active:scale-[0.98] transition-all duration-200 mt-6"
      >
        Continue
      </button>
    </form>
  )
}
