/**
 * Agent Configuration Step - Matching Landing Page Design
 */

'use client'

import { useState, useEffect } from 'react'
import { useVoices } from '@/hooks/useAI'

interface AgentConfigData {
  name: string
  type: string
  voiceId: string
  customInstructions?: string
}

interface Props {
  data?: AgentConfigData
  businessName?: string
  industry?: string
  onComplete: (data: AgentConfigData) => void
  onBack: () => void
  saving: boolean
}

const AGENT_TYPES = [
  { value: 'receptionist', label: 'Receptionist', description: 'Answers calls, takes messages' },
  { value: 'booking', label: 'Booking Agent', description: 'Schedules appointments' },
  { value: 'support', label: 'Support Agent', description: 'Handles customer questions' },
  { value: 'afterhours', label: 'After Hours', description: 'Takes messages when closed' },
]

export function AgentConfigStep({ data, businessName, industry, onComplete, onBack, saving }: Props) {
  const { voices, loading: voicesLoading } = useVoices()
  
  const [formData, setFormData] = useState<AgentConfigData>({
    name: data?.name || '',
    type: data?.type || 'receptionist',
    voiceId: data?.voiceId || '11labs-Rachel',
    customInstructions: data?.customInstructions || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCustom, setShowCustom] = useState(!!data?.customInstructions)
  
  useEffect(() => {
    if (!data?.name && businessName) {
      const typeLabel = AGENT_TYPES.find(t => t.value === formData.type)?.label || 'Receptionist'
      setFormData(prev => ({ ...prev, name: `${businessName} ${typeLabel}` }))
    }
  }, [businessName, formData.type, data?.name])
  
  const handleChange = (field: keyof AgentConfigData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrors({ name: 'Agent name is required' })
      return
    }
    onComplete(formData)
  }

  const defaultVoices = [
    { id: '11labs-Rachel', name: 'Rachel', description: 'Friendly, caring' },
    { id: '11labs-Adrian', name: 'Adrian', description: 'Professional, warm' },
    { id: '11labs-Sarah', name: 'Sarah', description: 'Upbeat, cheerful' },
    { id: '11labs-Josh', name: 'Josh', description: 'Casual, energetic' },
    { id: '11labs-Emily', name: 'Emily', description: 'Professional, British' },
    { id: '11labs-Adam', name: 'Adam', description: 'Authoritative' },
  ]
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-white/50 text-sm mb-6">
        Configure your AI voice agent. We will use your industry to customize its behavior.
      </p>
      
      {/* Agent Type */}
      <div>
        <label className="block text-sm text-white/60 mb-3">Agent Type</label>
        <div className="grid grid-cols-2 gap-3">
          {AGENT_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleChange('type', type.value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                formData.type === type.value
                  ? 'border-white bg-white/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <span className="font-medium text-white block">{type.label}</span>
              <span className="text-xs text-white/50">{type.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Agent Name */}
      <div>
        <label className="block text-sm text-white/60 mb-2">
          Agent Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="My AI Receptionist"
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 ${
            errors.name ? 'border-red-500/50' : 'border-white/10'
          }`}
        />
        {errors.name && <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>}
      </div>
      
      {/* Voice Selection */}
      <div>
        <label className="block text-sm text-white/60 mb-3">Voice</label>
        {voicesLoading ? (
          <div className="py-3 text-white/40">Loading voices...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {(voices.length > 0 ? voices : defaultVoices).map(voice => (
              <button
                key={voice.id}
                type="button"
                onClick={() => handleChange('voiceId', voice.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.voiceId === voice.id
                    ? 'border-white bg-white/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <span className="font-medium text-white text-sm block">{voice.name}</span>
                <span className="text-xs text-white/50">{voice.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom Instructions */}
      <div>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm text-white/50 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span className="text-lg leading-none">{showCustom ? '−' : '+'}</span> Custom Instructions
        </button>
        
        {showCustom && (
          <div className="mt-3">
            <textarea
              value={formData.customInstructions}
              onChange={(e) => handleChange('customInstructions', e.target.value)}
              placeholder="Add any specific instructions for your AI agent..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
            />
            <p className="mt-2 text-xs text-white/40">
              Examples: "Always ask for patient's date of birth", "Mention we offer free estimates"
            </p>
          </div>
        )}
      </div>
      
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
