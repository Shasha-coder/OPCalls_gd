/**
 * Phone Number Selection Step
 */

'use client'

import { useState, useEffect } from 'react'
import { useNumberSearch } from '@/hooks/useTelephony'

interface PhoneConfigData {
  areaCode?: string
  type: 'local' | 'toll_free'
  selectedNumber?: string
}

interface Props {
  data?: PhoneConfigData
  onComplete: (data: PhoneConfigData) => void
  onBack: () => void
  saving: boolean
}

const POPULAR_AREA_CODES = [
  { code: '212', city: 'New York, NY' },
  { code: '310', city: 'Los Angeles, CA' },
  { code: '312', city: 'Chicago, IL' },
  { code: '415', city: 'San Francisco, CA' },
  { code: '305', city: 'Miami, FL' },
  { code: '214', city: 'Dallas, TX' },
  { code: '404', city: 'Atlanta, GA' },
  { code: '617', city: 'Boston, MA' },
]

export function PhoneNumberStep({ data, onComplete, onBack, saving }: Props) {
  const [formData, setFormData] = useState<PhoneConfigData>({
    areaCode: data?.areaCode || '',
    type: data?.type || 'local',
    selectedNumber: data?.selectedNumber || '',
  })
  const [searchTriggered, setSearchTriggered] = useState(false)
  
  const { numbers, loading: searching, error: searchError, search } = useNumberSearch()
  
  // Auto-search when area code is entered
  useEffect(() => {
    if (formData.areaCode?.length === 3 && !searchTriggered) {
      handleSearch()
    }
  }, [formData.areaCode])
  
  const handleSearch = async () => {
    setSearchTriggered(true)
    await search({
      country: 'US',
      type: formData.type,
      areaCode: formData.areaCode || undefined,
    })
  }
  
  const handleTypeChange = (type: 'local' | 'toll_free') => {
    setFormData(prev => ({ ...prev, type, selectedNumber: '' }))
    setSearchTriggered(false)
  }
  
  const handleAreaCodeChange = (code: string) => {
    setFormData(prev => ({ ...prev, areaCode: code, selectedNumber: '' }))
    setSearchTriggered(false)
  }
  
  const handleSelectNumber = (number: string) => {
    setFormData(prev => ({ ...prev, selectedNumber: number }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // If no number selected but we have results, select the first one
    if (!formData.selectedNumber && numbers.length > 0) {
      const firstNumber = numbers[0].phoneNumber
      onComplete({ ...formData, selectedNumber: firstNumber })
    } else {
      onComplete(formData)
    }
  }
  
  const formatNumber = (number: string) => {
    if (number.startsWith('+1') && number.length === 12) {
      return `(${number.slice(2, 5)}) ${number.slice(5, 8)}-${number.slice(8)}`
    }
    return number
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-slate-400 mb-6">
        Choose a phone number for your AI agent. Callers will dial this number to reach your AI receptionist.
      </p>
      
      {/* Number Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Number Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('local')}
            className={`p-4 rounded-lg border text-left transition-all ${
              formData.type === 'local'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <span className="font-medium text-white block">Local Number</span>
            <span className="text-xs text-slate-400">Choose your area code</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('toll_free')}
            className={`p-4 rounded-lg border text-left transition-all ${
              formData.type === 'toll_free'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <span className="font-medium text-white block">Toll-Free</span>
            <span className="text-xs text-slate-400">800, 888, 877, etc.</span>
          </button>
        </div>
      </div>
      
      {/* Area Code (for local) */}
      {formData.type === 'local' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Area Code
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={formData.areaCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 3)
                handleAreaCodeChange(val)
              }}
              placeholder="e.g. 415"
              maxLength={3}
              className="w-24 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !formData.areaCode}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg transition-colors"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Popular Area Codes */}
          <div className="mt-3">
            <span className="text-xs text-slate-500">Popular: </span>
            {POPULAR_AREA_CODES.map(ac => (
              <button
                key={ac.code}
                type="button"
                onClick={() => handleAreaCodeChange(ac.code)}
                className="text-xs text-blue-400 hover:text-blue-300 ml-2"
              >
                {ac.code}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Toll-Free Search */}
      {formData.type === 'toll_free' && !searchTriggered && (
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg transition-colors"
        >
          {searching ? 'Searching...' : 'Search Toll-Free Numbers'}
        </button>
      )}
      
      {/* Search Error */}
      {searchError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{searchError}</p>
        </div>
      )}
      
      {/* Number Results */}
      {numbers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Available Numbers
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {numbers.map(num => (
              <button
                key={num.phoneNumber}
                type="button"
                onClick={() => handleSelectNumber(num.phoneNumber)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  formData.selectedNumber === num.phoneNumber
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className="font-mono text-white block">
                  {formatNumber(num.phoneNumber)}
                </span>
                {num.locality && (
                  <span className="text-xs text-slate-400">
                    {num.locality}{num.region ? `, ${num.region}` : ''}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Note about number selection */}
      {!searchTriggered && (
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400">
            💡 We'll find available numbers based on your preferences. You can search and select a specific number, or we'll automatically assign one during setup.
          </p>
        </div>
      )}
      
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
          type="submit"
          disabled={saving}
          className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
      </div>
    </form>
  )
}
