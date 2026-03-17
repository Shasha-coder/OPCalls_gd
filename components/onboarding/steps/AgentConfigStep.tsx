/**
 * Agent Configuration Step
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
  {
    value: 'receptionist',
    label: 'Receptionist',
    description: 'Answers calls, takes messages, provides info',
    icon: '📞',
  },
  {
    value: 'booking',
    label: 'Booking Agent',
    description: 'Schedules appointments and manages calendar',
    icon: '📅',
  },
  {
    value: 'support',
    label: 'Support Agent',
    description: 'Handles customer questions and issues',
    icon: '🛟',
  },
  {
    value: 'afterhours',
    label: 'After Hours',
    description: 'Takes messages when you\'re closed',
    icon: '🌙',
  },
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
  
  // Auto-generate agent name
  useEffect(() => {
    if (!data?.name && businessName) {
      const typeLabel = AGENT_TYPES.find(t => t.value === formData.type)?.label || 'Receptionist'
      setFormData(prev => ({
        ...prev,
        name: `${businessName} ${typeLabel}`,
      }))
    }
  }, [businessName, formData.type, data?.name])
  
  const handleChange = (field: keyof AgentConfigData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required'
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
        Configure your AI voice agent. We'll use your industry to customize its behavior.
      </p>
      
      {/* Agent Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Agent Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {AGENT_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleChange('type', type.value)}
              className={`p-4 rounded-lg border text-left transition-all ${
                formData.type === type.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <span className="text-2xl mb-2 block">{type.icon}</span>
              <span className="font-medium text-white block">{type.label}</span>
              <span className="text-xs text-slate-400">{type.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Agent Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Agent Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="My AI Receptionist"
          className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-slate-600'
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>
      
      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Voice
        </label>
        {voicesLoading ? (
          <div className="py-3 text-slate-400">Loading voices...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {(voices.length > 0 ? voices : [
              { id: '11labs-Rachel', name: 'Rachel', gender: 'female', description: 'Friendly, caring' },
              { id: '11labs-Adrian', name: 'Adrian', gender: 'male', description: 'Professional, warm' },
              { id: '11labs-Sarah', name: 'Sarah', gender: 'female', description: 'Upbeat, cheerful' },
              { id: '11labs-Josh', name: 'Josh', gender: 'male', description: 'Casual, energetic' },
              { id: '11labs-Emily', name: 'Emily', gender: 'female', description: 'Professional, British' },
              { id: '11labs-Adam', name: 'Adam', gender: 'male', description: 'Authoritative' },
            ]).map(voice => (
              <button
                key={voice.id}
                type="button"
                onClick={() => handleChange('voiceId', voice.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  formData.voiceId === voice.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className="font-medium text-white text-sm block">{voice.name}</span>
                <span className="text-xs text-slate-400">{voice.description || voice.gender}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom Instructions Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          {showCustom ? '−' : '+'} Custom Instructions
        </button>
        
        {showCustom && (
          <div className="mt-3">
            <textarea
              value={formData.customInstructions}
              onChange={(e) => handleChange('customInstructions', e.target.value)}
              placeholder="Add any specific instructions for your AI agent..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="mt-1 text-xs text-slate-500">
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
