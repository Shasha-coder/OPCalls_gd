/**
 * Phone Number Selection Step - Matching Landing Page Design
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
  { code: '212', city: 'New York' },
  { code: '310', city: 'Los Angeles' },
  { code: '312', city: 'Chicago' },
  { code: '415', city: 'San Francisco' },
  { code: '305', city: 'Miami' },
  { code: '214', city: 'Dallas' },
]

export function PhoneNumberStep({ data, onComplete, onBack, saving }: Props) {
  const [formData, setFormData] = useState<PhoneConfigData>({
    areaCode: data?.areaCode || '',
    type: data?.type || 'local',
    selectedNumber: data?.selectedNumber || '',
  })
  const [searchTriggered, setSearchTriggered] = useState(false)
  
  const { results: numbers, loading: searching, error: searchError, search } = useNumberSearch()
  
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
    if (!formData.selectedNumber && numbers.length > 0) {
      onComplete({ ...formData, selectedNumber: numbers[0].phoneNumber })
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
      <p className="text-white/50 text-sm mb-6">
        Choose a phone number for your AI agent. Callers will dial this number to reach your AI receptionist.
      </p>
      
      {/* Number Type */}
      <div>
        <label className="block text-sm text-white/60 mb-3">Number Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('local')}
            className={`p-4 rounded-xl border text-left transition-all ${
              formData.type === 'local'
                ? 'border-white bg-white/10'
                : 'border-white/10 hover:border-white/20 bg-white/5'
            }`}
          >
            <span className="font-medium text-white block">Local Number</span>
            <span className="text-xs text-white/50">Choose your area code</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('toll_free')}
            className={`p-4 rounded-xl border text-left transition-all ${
              formData.type === 'toll_free'
                ? 'border-white bg-white/10'
                : 'border-white/10 hover:border-white/20 bg-white/5'
            }`}
          >
            <span className="font-medium text-white block">Toll-Free</span>
            <span className="text-xs text-white/50">800, 888, 877, etc.</span>
          </button>
        </div>
      </div>
      
      {/* Area Code (for local) */}
      {formData.type === 'local' && (
        <div>
          <label className="block text-sm text-white/60 mb-2">Area Code</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={formData.areaCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 3)
                handleAreaCodeChange(val)
              }}
              placeholder="415"
              maxLength={3}
              className="w-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 text-center text-lg font-mono"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !formData.areaCode}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-xl transition-colors"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_AREA_CODES.map(ac => (
              <button
                key={ac.code}
                type="button"
                onClick={() => handleAreaCodeChange(ac.code)}
                className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                {ac.code} {ac.city}
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
          className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-xl transition-colors"
        >
          {searching ? 'Searching...' : 'Search Toll-Free Numbers'}
        </button>
      )}
      
      {/* Error */}
      {searchError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{searchError}</p>
        </div>
      )}
      
      {/* Results */}
      {numbers.length > 0 && (
        <div>
          <label className="block text-sm text-white/60 mb-3">Available Numbers</label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto hide-scrollbar">
            {numbers.map(num => (
              <button
                key={num.phoneNumber}
                type="button"
                onClick={() => handleSelectNumber(num.phoneNumber)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.selectedNumber === num.phoneNumber
                    ? 'border-white bg-white/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <span className="font-mono text-white block">{formatNumber(num.phoneNumber)}</span>
                {num.locality && (
                  <span className="text-xs text-white/50">{num.locality}{num.region ? `, ${num.region}` : ''}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Note */}
      {!searchTriggered && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-sm text-white/50">
            We will find available numbers based on your preferences. You can search and select a specific number, or we will automatically assign one during setup.
          </p>
        </div>
      )}
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3.5 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed transition-all"
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
      </div>
    </form>
  )
}
