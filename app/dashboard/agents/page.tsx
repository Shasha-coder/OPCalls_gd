'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useAuthStore } from '@/store/auth'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Agent } from '@/types/database'
import { PlusIcon, SearchIcon, AgentIcon } from '@/components/ui/Icons'

export default function AgentsPage() {
  const { agents, refreshAgents, profile } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('[v0] AgentsPage mounted, agents in store:', agents.length)
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
    console.log('[v0] Refreshing agents on page load/focus')
    refreshAgents()
  }, [])

  const handleToggleStatus = async (agent: Agent) => {
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

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"?`)) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agent.id)

    if (error) {
      toast.error('Failed to delete agent')
    } else {
      toast.success('Agent deleted')
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Your AI Agents
          </h1>
          <p className="text-white/60 mt-1">
            Manage and monitor your voice agents
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button rightIcon={<PlusIcon className="w-4 h-4" />}>
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Filters */}
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
                  : 'bg-[#262720] text-white/60 border border-[#3a3d32] hover:border-[#474b37]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#262720] border border-[#474b37] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center mx-auto mb-4">
            <AgentIcon className="w-8 h-8 text-[#e7f69e]" />
          </div>
          <h3 className="text-lg font-display font-semibold text-white mb-2">
            {searchQuery || filter !== 'all' ? 'No agents found' : 'No agents yet'}
          </h3>
          <p className="text-white/60 mb-6">
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
  )
}
