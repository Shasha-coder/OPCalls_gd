/**
 * Business Info Step
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-slate-400 mb-6">
        Tell us about your business so we can customize your AI receptionist.
      </p>
      
      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Business Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Acme Dental Clinic"
          className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-slate-600'
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>
      
      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Industry *
        </label>
        <select
          value={formData.industry}
          onChange={(e) => handleChange('industry', e.target.value)}
          className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.industry ? 'border-red-500' : 'border-slate-600'
          }`}
        >
          <option value="">Select your industry</option>
          {INDUSTRIES.map(ind => (
            <option key={ind.value} value={ind.value}>{ind.label}</option>
          ))}
        </select>
        {errors.industry && (
          <p className="mt-1 text-sm text-red-400">{errors.industry}</p>
        )}
      </div>
      
      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Business Phone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(555) 123-4567"
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Business Address
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Main St, City, State ZIP"
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => handleChange('timezone', e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>
      
      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Saving...
          </>
        ) : (
          'Continue'
        )}
      </button>
    </form>
  )
}
