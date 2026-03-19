'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Agent } from '@/types/database'
import { PlusIcon, SearchIcon, AgentIcon, SettingsIcon } from '@/components/ui/Icons'

// Microphone/Voice icon for agents
const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
)

export default function AgentsPage() {
  const router = useRouter()
  const { agents, refreshAgents } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    refreshAgents()
  }, [])

  const handleToggleStatus = async (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation()
    const supabase = createClient()
    const { error } = await supabase
      .from('agents')
      .update({ is_active: !agent.is_active })
      .eq('id', agent.id)

    if (error) {
      toast.error('Failed to update agent status')
    } else {
      toast.success(`Agent ${agent.is_active ? 'paused' : 'activated'}`)
      refreshAgents()
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && agent.is_active) ||
      (filter === 'inactive' && !agent.is_active)
    return matchesSearch && matchesFilter
  })

  const formatLastActive = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Your AI Agents
          </h1>
          <p className="text-white/50 mt-1">
            Manage and monitor your voice agents
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button rightIcon={<PlusIcon className="w-4 h-4" />}>
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#262720] border border-[#474b37] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#e7f69e]"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#262720] text-[#e7f69e] border border-[#474b37]'
                  : 'bg-[#1a1b18] text-white/60 border border-[#3a3d32] hover:border-[#474b37]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-[#262720] border border-[#474b37] rounded-2xl overflow-hidden">
        {filteredAgents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3a3d32]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/50">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/50">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/50 hidden md:table-cell">Last active</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-white/50"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3d32]">
                {filteredAgents.map((agent) => (
                  <tr 
                    key={agent.id}
                    onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                    className="hover:bg-[#2d3127] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center group-hover:border-[#474b37] transition-colors">
                          <MicIcon className="w-5 h-5 text-[#e7f69e]/70" />
                        </div>
                        <span className="text-white font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleToggleStatus(e, agent)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          agent.is_active 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.is_active ? 'bg-emerald-400' : 'bg-white/40'}`} />
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-white/50 text-sm hidden md:table-cell">
                      {formatLastActive(agent.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/agents/${agent.id}`)
                        }}
                        className="inline-flex items-center gap-2 text-[#e7f69e]/70 hover:text-[#e7f69e] transition-colors text-sm"
                      >
                        Configuration
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center mx-auto mb-4">
              <AgentIcon className="w-8 h-8 text-[#e7f69e]" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-2">
              {searchQuery || filter !== 'all' ? 'No agents found' : 'No agents yet'}
            </h3>
            <p className="text-white/50 mb-6">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first AI agent to start handling calls'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Link href="/dashboard/agents/new">
                <Button rightIcon={<PlusIcon className="w-4 h-4" />}>
                  Create Agent
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
