'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import type { Agent } from '@/types/database'
import { 
  ArrowLeftIcon, PhoneIcon, SaveIcon, TrashIcon, EditIcon, 
  GlobeIcon, MicIcon, BuildingIcon, SparklesIcon, CheckIcon,
  PhoneInboundIcon, PhoneOutboundIcon, SmsIcon, PlusIcon,
  VoiceProfessionalIcon, VoiceFriendlyIcon, VoiceEnergeticIcon, VoiceCalmIcon,
  PlayIcon, PauseIcon
} from '@/components/ui/Icons'

const voiceOptions = [
  { id: 'professional', name: 'Professional', description: 'Clear, business-like tone', Icon: VoiceProfessionalIcon },
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable', Icon: VoiceFriendlyIcon },
  { id: 'energetic', name: 'Energetic', description: 'Upbeat and enthusiastic', Icon: VoiceEnergeticIcon },
  { id: 'calm', name: 'Calm', description: 'Soothing and reassuring', Icon: VoiceCalmIcon },
]

const industryOptions = [
  'Healthcare', 'Real Estate', 'Legal', 'Home Services', 
  'Automotive', 'Hospitality', 'Retail', 'Other'
]

const languageOptions = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'pt-BR', name: 'Portuguese' },
]

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string
  const { profile, refreshAgents } = useAuthStore()
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [phoneNumber, setPhoneNumber] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    voice: 'professional',
    primaryLanguage: 'en-US',
    languages: ['en-US'],
    prompt: '',
    knowledgeBase: '',
    maxCallDuration: 30,
    isActive: false,
  })

  useEffect(() => {
    loadAgent()
  }, [agentId])

  const loadAgent = async () => {
    const supabase = createClient()
    
    // Load agent
    const { data: agentData, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (error || !agentData) {
      toast.error('Agent not found')
      router.push('/dashboard/agents')
      return
    }

    setAgent(agentData)
    setFormData({
      name: agentData.name || '',
      industry: agentData.industry || '',
      voice: agentData.voice || 'professional',
      primaryLanguage: agentData.primary_language || 'en-US',
      languages: agentData.languages || ['en-US'],
      prompt: agentData.prompt || '',
      knowledgeBase: agentData.knowledge_base || '',
      maxCallDuration: agentData.max_call_duration || 30,
      isActive: agentData.is_active || false,
    })

    // Load phone number linked to this agent
    const { data: phoneData } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('agent_id', agentId)
      .single()
    
    setPhoneNumber(phoneData)
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('agents')
      .update({
        name: formData.name,
        industry: formData.industry.toLowerCase(),
        voice: formData.voice,
        primary_language: formData.primaryLanguage,
        languages: formData.languages,
        prompt: formData.prompt,
        knowledge_base: formData.knowledgeBase,
        max_call_duration: formData.maxCallDuration,
        is_active: formData.isActive,
      })
      .eq('id', agentId)

    if (error) {
      toast.error('Failed to save changes')
    } else {
      toast.success('Agent updated successfully!')
      await refreshAgents()
      setEditingSection(null)
      loadAgent()
    }
    setIsSaving(false)
  }

  const handleToggleActive = async () => {
    const newStatus = !formData.isActive
    setFormData(prev => ({ ...prev, isActive: newStatus }))
    
    const supabase = createClient()
    const { error } = await supabase
      .from('agents')
      .update({ is_active: newStatus })
      .eq('id', agentId)

    if (error) {
      toast.error('Failed to update status')
      setFormData(prev => ({ ...prev, isActive: !newStatus }))
    } else {
      toast.success(newStatus ? 'Agent activated!' : 'Agent paused')
      await refreshAgents()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)

    if (error) {
      toast.error('Failed to delete agent')
    } else {
      toast.success('Agent deleted')
      await refreshAgents()
      router.push('/dashboard/agents')
    }
    setIsDeleting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#e7f69e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!agent) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            href="/dashboard/agents"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Agents
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#262720] border border-[#474b37] flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-[#e7f69e]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  formData.isActive 
                    ? 'bg-[#262720] border-[#474b37] text-[#e7f69e]' 
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${formData.isActive ? 'bg-[#e7f69e] animate-pulse' : 'bg-white/40'}`} />
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-white/50 capitalize">{agent.industry}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleToggleActive}
            leftIcon={formData.isActive ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          >
            {formData.isActive ? 'Pause' : 'Activate'}
          </Button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 rounded-xl bg-[#262720] border border-[#474b37] text-white/60 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Phone Number Section */}
      <div className="bg-[#262720] rounded-2xl border border-[#474b37] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <PhoneIcon className="w-5 h-5 text-[#e7f69e]" />
            Phone Number
          </h2>
        </div>
        
        {phoneNumber ? (
          <div className="flex items-center justify-between p-4 bg-[#1a1b18] rounded-xl border border-[#3a3d32]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#262720] border border-[#474b37] flex items-center justify-center">
                <PhoneIcon className="w-5 h-5 text-[#e7f69e]" />
              </div>
              <div>
                <div className="font-medium text-white">{phoneNumber.number}</div>
                <div className="text-sm text-white/50">
                  {phoneNumber.status === 'active' ? 'Active' : 'Pending'} • ${phoneNumber.monthly_cost}/mo
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#262720] border border-[#474b37] text-[#e7f69e] text-xs font-medium">
              Connected
            </span>
          </div>
        ) : (
          <div className="text-center py-6">
            <PhoneIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 mb-4">No phone number assigned</p>
            <Link href="/dashboard/phone">
              <Button leftIcon={<PhoneIcon className="w-4 h-4" />}>
                Get a Phone Number
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="bg-[#262720] rounded-2xl border border-[#474b37] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Capabilities</h2>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1b18] border border-[#3a3d32] text-[#e7f69e] text-sm font-medium">
            <PhoneInboundIcon className="w-4 h-4" /> Receive Calls
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1b18] border border-[#3a3d32] text-[#e7f69e] text-sm font-medium">
            <PhoneOutboundIcon className="w-4 h-4" /> Make Calls
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1b18] border border-[#3a3d32] text-[#e7f69e] text-sm font-medium">
            <SmsIcon className="w-4 h-4" /> Handle SMS
          </span>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-[#262720] rounded-2xl border border-[#474b37] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Basic Settings</h2>
          {editingSection !== 'basic' ? (
            <button 
              onClick={() => setEditingSection('basic')}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>Save</Button>
            </div>
          )}
        </div>
        
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Agent Name</label>
              {editingSection === 'basic' ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Agent name"
                />
              ) : (
                <div className="px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white">
                  {formData.name}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Industry</label>
              {editingSection === 'basic' ? (
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white focus:outline-none focus:border-[#e7f69e]"
                  style={{ colorScheme: 'dark' }}
                >
                  {industryOptions.map(ind => (
                    <option key={ind} value={ind.toLowerCase()}>{ind}</option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white capitalize">
                  {formData.industry || 'Not set'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Voice & Language */}
      <div className="bg-[#262720] rounded-2xl border border-[#474b37] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MicIcon className="w-5 h-5 text-[#e7f69e]" />
            Voice & Language
          </h2>
          {editingSection !== 'voice' ? (
            <button 
              onClick={() => setEditingSection('voice')}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>Save</Button>
            </div>
          )}
        </div>

        {editingSection === 'voice' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-3">Voice Style</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {voiceOptions.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setFormData({ ...formData, voice: voice.id })}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      formData.voice === voice.id
                        ? 'bg-[#1a1b18] border-[#474b37]'
                        : 'bg-[#1a1b18] border-[#3a3d32] hover:border-[#474b37]'
                    }`}
                  >
                    <voice.Icon className={`w-6 h-6 mx-auto mb-2 ${formData.voice === voice.id ? 'text-[#e7f69e]' : 'text-white/40'}`} />
                    <span className={`text-sm font-medium ${formData.voice === voice.id ? 'text-[#e7f69e]' : 'text-white/60'}`}>
                      {voice.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-3">Languages</label>
              <div className="space-y-2">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      const langs = formData.languages.includes(lang.code)
                        ? formData.languages.filter(l => l !== lang.code)
                        : [...formData.languages, lang.code]
                      setFormData({ 
                        ...formData, 
                        languages: langs,
                        primaryLanguage: langs[0] || 'en-US'
                      })
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      formData.languages.includes(lang.code)
                        ? 'bg-[#1a1b18] border-[#474b37]'
                        : 'bg-[#1a1b18] border-[#3a3d32] hover:border-[#474b37]'
                    }`}
                  >
                    <span className={formData.languages.includes(lang.code) ? 'text-[#e7f69e]' : 'text-white/60'}>
                      {lang.name}
                    </span>
                    {formData.languages.includes(lang.code) && (
                      <CheckIcon className="w-4 h-4 text-[#e7f69e]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Voice Style</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl">
                {voiceOptions.find(v => v.id === formData.voice)?.Icon && (
                  <span className="text-[#e7f69e]">
                    {(() => {
                      const VoiceIcon = voiceOptions.find(v => v.id === formData.voice)!.Icon
                      return <VoiceIcon className="w-5 h-5" />
                    })()}
                  </span>
                )}
                <span className="text-white capitalize">{formData.voice}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Languages</label>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map(lang => (
                  <span key={lang} className="px-3 py-1.5 bg-[#1a1b18] border border-[#3a3d32] rounded-lg text-white text-sm">
                    {languageOptions.find(l => l.code === lang)?.name || lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Prompt */}
      <div className="bg-[#262720] rounded-2xl border border-[#474b37] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">System Prompt</h2>
          {editingSection !== 'prompt' ? (
            <button 
              onClick={() => setEditingSection('prompt')}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>Save</Button>
            </div>
          )}
        </div>
        
        {editingSection === 'prompt' ? (
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            placeholder="You are a helpful customer support agent. Be professional and empathetic..."
            rows={6}
            className="w-full px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#e7f69e] resize-none"
          />
        ) : (
          <div className="px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white/70 min-h-[100px] whitespace-pre-wrap">
            {formData.prompt || 'No system prompt configured. Click edit to add instructions for your agent.'}
          </div>
        )}
      </div>

      {/* Knowledge Base */}
      <div className="bg-[#262720] rounded-2xl border border-[#474b37] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Knowledge Base</h2>
          {editingSection !== 'knowledge' ? (
            <button 
              onClick={() => setEditingSection('knowledge')}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>Save</Button>
            </div>
          )}
        </div>
        
        {editingSection === 'knowledge' ? (
          <textarea
            value={formData.knowledgeBase}
            onChange={(e) => setFormData({ ...formData, knowledgeBase: e.target.value })}
            placeholder="Add your business information, FAQs, policies, etc..."
            rows={6}
            className="w-full px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#e7f69e] resize-none"
          />
        ) : (
          <div className="px-4 py-3 bg-[#1a1b18] border border-[#3a3d32] rounded-xl text-white/70 min-h-[100px] whitespace-pre-wrap">
            {formData.knowledgeBase || 'No knowledge base added. Click edit to add business information, FAQs, and policies.'}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-[#262720] rounded-2xl border border-[#474b37] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Performance</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[#1a1b18] border border-[#3a3d32] rounded-xl">
            <div className="text-2xl font-bold text-white">{agent.total_calls || 0}</div>
            <div className="text-sm text-white/50">Total Calls</div>
          </div>
          <div className="p-4 bg-[#1a1b18] border border-[#3a3d32] rounded-xl">
            <div className="text-2xl font-bold text-white">{Math.round(agent.total_minutes || 0)}m</div>
            <div className="text-sm text-white/50">Total Minutes</div>
          </div>
          <div className="p-4 bg-[#1a1b18] border border-[#3a3d32] rounded-xl">
            <div className="text-2xl font-bold text-[#e7f69e]">{agent.conversion_rate || 0}%</div>
            <div className="text-sm text-white/50">Conversion</div>
          </div>
        </div>
      </div>
    </div>
  )
}
