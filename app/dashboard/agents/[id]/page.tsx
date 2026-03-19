'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, Trash2, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import type { Agent } from '@/types/database'

export default function AgentConfigPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string
  const { profile, organization } = useAuthStore()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoProvisioning, setIsAutoProvisioning] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    knowledgeBase: '',
    language: 'en-US',
    personality: 'professional' as 'professional' | 'friendly' | 'energetic' | 'calm',
    maxCallDuration: 30,
    voiceSpeed: 1,
  })

  useEffect(() => {
    loadAgent()
  }, [agentId])

  const loadAgent = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (error || !data) {
      toast.error('Failed to load agent')
      router.push('/dashboard/agents')
      return
    }

    setAgent(data)
    setFormData({
      name: data.name || '',
      prompt: data.prompt || '',
      knowledgeBase: data.knowledge_base || '',
      language: data.primary_language || 'en-US',
      personality: data.personality || 'professional',
      maxCallDuration: data.max_call_duration || 30,
      voiceSpeed: data.voice_speed || 1,
    })
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('agents')
      .update({
        name: formData.name,
        prompt: formData.prompt,
        knowledge_base: formData.knowledgeBase,
        primary_language: formData.language,
        personality: formData.personality,
        max_call_duration: formData.maxCallDuration,
        voice_speed: formData.voiceSpeed,
      })
      .eq('id', agentId)

    if (error) {
      toast.error('Failed to save agent')
    } else {
      toast.success('Agent configuration saved!')
      loadAgent()
    }
    setIsSaving(false)
  }

  const handleAutoProvisionContext = async () => {
    if (!organization) {
      toast.error('Organization information not found')
      return
    }

    setIsAutoProvisioning(true)
    try {
      // Build business context from organization data
      const businessContext = `Organization: ${organization.name}
Website: ${organization.website || 'Not provided'}
Phone: ${organization.phone_number || 'Not provided'}
Industry: ${organization.industry || 'Not specified'}
Subscription: ${organization.subscription_tier}

This agent represents the above organization and should use this context when:
- Introducing itself to callers
- Answering questions about the business
- Taking messages or booking appointments
- Escalating to human representatives
- Identifying the business in any communication`

      // Auto-populate the system prompt with business context
      const enhancedPrompt = `${formData.prompt || 'You are a helpful AI assistant.'}\n\nBusiness Context:\n${businessContext}`

      setFormData(prev => ({
        ...prev,
        prompt: enhancedPrompt,
        knowledgeBase: prev.knowledgeBase ? `${prev.knowledgeBase}\n\n---\n\n${businessContext}` : businessContext
      }))

      toast.success('Business context auto-provisioned!')
    } catch (error) {
      toast.error('Failed to auto-provision context')
    }
    setIsAutoProvisioning(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/60">Loading agent...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/dashboard/agents"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agents
        </Link>
        
        <h1 className="text-3xl font-bold text-white mb-2">Configure Agent</h1>
        <p className="text-white/60">Customize your agent's behavior and knowledge</p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-6">Basic Settings</h2>
          
          <div className="space-y-4">
            <Input
              label="Agent Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sarah - Support Agent"
            />

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Agent Type
              </label>
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 capitalize">
                {agent?.type || 'Inbound'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Primary Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-lime-200/50"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="pt-BR">Portuguese</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Personality
                </label>
                <select
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-lime-200/50"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-6">System Prompt</h2>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Agent Instructions
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="You are a helpful customer support agent. Be professional and empathetic..."
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-lime-200/50 resize-none"
            />
            <p className="text-xs text-white/50 mt-2">
              Define how your agent should behave, what it should prioritize, and any specific guidelines.
            </p>
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Knowledge Base</h2>
            <button
              onClick={handleAutoProvisionContext}
              disabled={isAutoProvisioning}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-lime-200/10 hover:bg-lime-200/20 text-lime-200 rounded-lg transition-colors border border-lime-200/30 disabled:opacity-50"
              title="Auto-populate with organization context"
            >
              <Zap className="w-3.5 h-3.5" />
              {isAutoProvisioning ? 'Provisioning...' : 'Auto-Provision'}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
              <p className="text-white/60 text-sm">Drop your knowledge base file here or click to browse</p>
              <p className="text-white/40 text-xs mt-1">Supports PDF, TXT, or JSON format</p>
              <input type="file" className="hidden" />
            </div>

            <textarea
              value={formData.knowledgeBase}
              onChange={(e) => setFormData({ ...formData, knowledgeBase: e.target.value })}
              placeholder="Or paste your knowledge base content directly here...&#10;&#10;Your business info, FAQs, policies, etc."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-lime-200/50 resize-none"
            />
            <p className="text-xs text-white/50">
              This content will be used to answer questions and handle customer inquiries accurately.
            </p>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-6">Advanced Settings</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Max Call Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.maxCallDuration}
                onChange={(e) => setFormData({ ...formData, maxCallDuration: parseInt(e.target.value) })}
                min="1"
                max="120"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-lime-200/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Voice Speed
              </label>
              <input
                type="range"
                value={formData.voiceSpeed}
                onChange={(e) => setFormData({ ...formData, voiceSpeed: parseFloat(e.target.value) })}
                min="0.5"
                max="2"
                step="0.1"
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">{formData.voiceSpeed.toFixed(1)}x speed</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button 
            onClick={handleSave} 
            isLoading={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
          <button className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete agent">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
