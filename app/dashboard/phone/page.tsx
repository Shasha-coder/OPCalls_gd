'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { PlusIcon, SearchIcon, PhoneIcon, AgentIcon } from '@/components/ui/Icons'

interface PhoneNumber {
  id: string
  number: string
  country: string
  status: 'active' | 'pending_agent' | 'inactive'
  agent_id: string | null
  monthly_cost: number
  created_at: string
}

export default function PhoneNumbersPage() {
  const router = useRouter()
  const { profile, agents, refreshAgents } = useAuthStore()
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'unassigned'>('all')
  const [isLoading, setIsLoading] = useState(true)
  
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
    fetchNumbers()
  }, [])

  const fetchNumbers = async () => {
    if (!profile?.org_id) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNumbers(data)
    }
    setIsLoading(false)
  }

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Unassigned'
    const agent = agents.find(a => a.id === agentId)
    return agent?.name || 'Unknown Agent'
  }

  const filteredNumbers = numbers.filter(num => {
    const matchesSearch = num.number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && num.status === 'active') ||
      (filter === 'unassigned' && !num.agent_id)
    return matchesSearch && matchesFilter
  })

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Phone Numbers
          </h1>
          <p className="text-white/50 mt-1">
            Manage your dedicated phone numbers
          </p>
        </div>
        <Link href="/dashboard/phone/new">
          <Button leftIcon={<PhoneIcon className="w-4 h-4" />}>
            Get a Phone Number
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#262720] border border-[#474b37] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#e7f69e]"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'unassigned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#262720] text-[#e7f69e] border border-[#474b37]'
                  : 'bg-[#1a1b18] text-white/60 border border-[#3a3d32] hover:border-[#474b37]'
              }`}
            >
              {f === 'unassigned' ? 'Unassigned' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Numbers Table */}
      <div className="bg-[#262720] border border-[#474b37] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#e7f69e]/30 border-t-[#e7f69e] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading numbers...</p>
          </div>
        ) : filteredNumbers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3a3d32]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/50">Number</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/50">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/50 hidden md:table-cell">Assigned Agent</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/50 hidden lg:table-cell">Added</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-white/50"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3d32]">
                {filteredNumbers.map((num) => (
                  <tr 
                    key={num.id}
                    className="hover:bg-[#2d3127] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center group-hover:border-[#474b37] transition-colors">
                          <PhoneIcon className="w-5 h-5 text-[#e7f69e]/70" />
                        </div>
                        <span className="text-white font-mono">{num.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                        num.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : num.status === 'pending_agent'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          num.status === 'active' ? 'bg-emerald-400' : 
                          num.status === 'pending_agent' ? 'bg-amber-400' : 'bg-white/40'
                        }`} />
                        {num.status === 'pending_agent' ? 'Needs Agent' : num.status.charAt(0).toUpperCase() + num.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {num.agent_id ? (
                          <>
                            <AgentIcon className="w-4 h-4 text-[#e7f69e]/50" />
                            <span className="text-white/70">{getAgentName(num.agent_id)}</span>
                          </>
                        ) : (
                          <span className="text-white/40">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/50 text-sm hidden lg:table-cell">
                      {formatDate(num.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {/* TODO: Open settings modal */}}
                        className="inline-flex items-center gap-2 text-[#e7f69e]/70 hover:text-[#e7f69e] transition-colors text-sm"
                      >
                        Settings
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
              <PhoneIcon className="w-8 h-8 text-[#e7f69e]" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-2">
              {searchQuery || filter !== 'all' ? 'No numbers found' : 'No phone numbers yet'}
            </h3>
            <p className="text-white/50 mb-6">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get a dedicated phone number for your AI agents'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Link href="/dashboard/phone/new">
                <Button leftIcon={<PhoneIcon className="w-4 h-4" />}>
                  Get a Phone Number
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
