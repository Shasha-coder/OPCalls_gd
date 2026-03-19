/**
 * Phone Number Selection Step - Clean Design with Country Support
 */

'use client'

import { useState, useEffect } from 'react'
import { useNumberSearch } from '@/hooks/useTelephony'
import { createClient } from '@/lib/supabase/client'

interface PhoneConfigData {
  country?: string
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

interface SupportedCountry {
  code: string
  name: string
  dial_code: string
  flag_emoji: string
  supports_local: boolean
  supports_toll_free: boolean
}

const POPULAR_AREA_CODES = [
  { code: '212', city: 'New York' },
  { code: '310', city: 'Los Angeles' },
  { code: '312', city: 'Chicago' },
  { code: '415', city: 'San Francisco' },
  { code: '305', city: 'Miami' },
  { code: '214', city: 'Dallas' },
]

export function PhoneNumberStep({ data, onComplete, onBack }: Props) {
  const [countries, setCountries] = useState<SupportedCountry[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [formData, setFormData] = useState<PhoneConfigData>({
    country: data?.country || 'US',
    areaCode: data?.areaCode || '',
    type: data?.type || 'local',
    selectedNumber: data?.selectedNumber || '',
  })
  const [searchTriggered, setSearchTriggered] = useState(false)
  
  const { results: numbers, loading: searching, error: searchError, search } = useNumberSearch()
  
  // Fetch supported countries from database
  useEffect(() => {
    async function fetchCountries() {
      try {
        const supabase = createClient()
        const { data: countriesData, error } = await supabase
          .from('supported_countries')
          .select('code, name, dial_code, flag_emoji, supports_local, supports_toll_free')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        
        if (error) throw error
        setCountries(countriesData || [])
      } catch (err) {
        console.error('Failed to fetch countries:', err)
        // Fallback to default
        setCountries([
          { code: 'US', name: 'United States', dial_code: '+1', flag_emoji: '🇺🇸', supports_local: true, supports_toll_free: true },
          { code: 'CA', name: 'Canada', dial_code: '+1', flag_emoji: '🇨🇦', supports_local: true, supports_toll_free: true },
        ])
      } finally {
        setLoadingCountries(false)
      }
    }
    fetchCountries()
  }, [])
  
  const selectedCountry = countries.find(c => c.code === formData.country)
  
  const handleSearch = async () => {
    setSearchTriggered(true)
    await search({
      country: formData.country,
      type: formData.type,
      areaCode: formData.areaCode || undefined,
    })
  }
  
  const handleCountryChange = (code: string) => {
    const country = countries.find(c => c.code === code)
    setFormData(prev => ({ 
      ...prev, 
      country: code, 
      selectedNumber: '',
      // Reset type if not supported
      type: country?.supports_toll_free ? prev.type : 'local'
    }))
    setSearchTriggered(false)
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

  // Custom select styles
  const selectStyle = {
    background: '#161616',
    color: '#fff',
  }

  const optionStyle = {
    background: '#1a1a1a',
    color: '#fff',
    padding: '12px',
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-white/50 text-sm mb-6">
        Choose a phone number for your AI agent. Callers will dial this number to reach your AI receptionist.
      </p>
      
      {/* Country Selection */}
      <div>
        <label className="block text-sm text-white/50 mb-2 font-medium">Country</label>
        <div className="relative">
          <select
            value={formData.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={loadingCountries}
            className="w-full px-4 py-3.5 bg-[#161616] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20 focus:bg-[#1a1a1a] appearance-none cursor-pointer transition-all duration-200 pr-10"
            style={{ colorScheme: 'dark' }}
          >
            {loadingCountries ? (
              <option value="" style={optionStyle}>Loading countries...</option>
            ) : (
              countries.map(country => (
                <option key={country.code} value={country.code} style={optionStyle}>
                  {country.flag_emoji} {country.name} ({country.dial_code})
                </option>
              ))
            )}
          </select>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Number Type */}
      <div>
        <label className="block text-sm text-white/50 mb-3 font-medium">Number Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('local')}
            disabled={!selectedCountry?.supports_local}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              formData.type === 'local'
                ? 'border-white/30 bg-white/10'
                : 'border-white/[0.08] hover:border-white/15 bg-white/[0.03]'
            } ${!selectedCountry?.supports_local ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="font-medium text-white block">Local Number</span>
            <span className="text-xs text-white/40 mt-1 block">Choose your area code</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('toll_free')}
            disabled={!selectedCountry?.supports_toll_free}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              formData.type === 'toll_free'
                ? 'border-white/30 bg-white/10'
                : 'border-white/[0.08] hover:border-white/15 bg-white/[0.03]'
            } ${!selectedCountry?.supports_toll_free ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="font-medium text-white block">Toll-Free</span>
            <span className="text-xs text-white/40 mt-1 block">800, 888, 877, etc.</span>
          </button>
        </div>
      </div>
      
      {/* Area Code (for local) */}
      {formData.type === 'local' && (
        <div>
          <label className="block text-sm text-white/50 mb-2 font-medium">Area Code</label>
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
              className="w-24 px-4 py-3.5 bg-[#161616] border border-white/[0.08] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:bg-[#1a1a1a] text-center text-lg font-mono transition-all duration-200"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !formData.areaCode}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 disabled:bg-white/[0.03] disabled:text-white/25 text-white rounded-xl transition-all duration-200 font-medium"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {formData.country === 'US' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_AREA_CODES.map(ac => (
                <button
                  key={ac.code}
                  type="button"
                  onClick={() => handleAreaCodeChange(ac.code)}
                  className="text-xs px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-white/50 hover:text-white/80 transition-all duration-200"
                >
                  {ac.code} {ac.city}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Toll-Free Search */}
      {formData.type === 'toll_free' && !searchTriggered && (
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="w-full py-3.5 px-6 bg-white/10 hover:bg-white/15 disabled:bg-white/[0.03] text-white rounded-xl transition-all duration-200 font-medium"
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
          <label className="block text-sm text-white/50 mb-3 font-medium">Available Numbers</label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {numbers.map(num => (
              <button
                key={num.phoneNumber}
                type="button"
                onClick={() => handleSelectNumber(num.phoneNumber)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  formData.selectedNumber === num.phoneNumber
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/[0.08] hover:border-white/15 bg-white/[0.03]'
                }`}
              >
                <span className="font-mono text-white block">{formatNumber(num.phoneNumber)}</span>
                {num.locality && (
                  <span className="text-xs text-white/40 mt-1 block">{num.locality}{num.region ? `, ${num.region}` : ''}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Note */}
      {!searchTriggered && (
        <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <p className="text-sm text-white/40">
            We will find available numbers based on your preferences. You can search and select a specific number, or we will automatically assign one during setup.
          </p>
        </div>
      )}
      
      {/* Buttons */}
      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3.5 border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03] rounded-xl transition-all duration-200"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200"
        >
          Continue
        </button>
      </div>
    </form>
  )
}
