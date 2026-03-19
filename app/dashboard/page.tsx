'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { PhoneIcon, ClockIcon, TrendingUpIcon, UsersIcon, PlusIcon, ArrowRightIcon, ChartIcon, AgentIcon } from '@/components/ui/Icons'

export default function DashboardPage() {
  const { profile, organization, agents } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  const stats = {
    totalCalls: agents.reduce((sum, a) => sum + (a.total_calls || 0), 0),
    totalMinutes: agents.reduce((sum, a) => sum + (a.total_minutes || 0), 0),
    activeAgents: agents.filter(a => a.is_active).length,
    conversionRate: 67.5,
  }

  useEffect(() => {
    setIsLoading(false)
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
            Welcome back, {profile?.first_name || 'there'}
          </h1>
          <p className="text-white/50 mt-1">Here is what is happening with your AI agents today.</p>
        </div>
        <Link 
          href="/dashboard/agents/new" 
          className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#1a1b18] border-2 border-[#474b37] text-[#e7f69e] font-medium text-sm rounded-full hover:bg-[#262720] hover:border-[#5c6147] transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Create Agent
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls', value: stats.totalCalls, change: '+12%', Icon: PhoneIcon, positive: true },
          { label: 'Total Minutes', value: `${Math.round(stats.totalMinutes)}m`, change: '+8%', Icon: ClockIcon, positive: true },
          { label: 'Conversion Rate', value: `${stats.conversionRate}%`, change: '+3.2%', Icon: TrendingUpIcon, positive: true },
          { label: 'Active Agents', value: stats.activeAgents, change: null, Icon: UsersIcon, positive: true },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-[#262720] rounded-xl p-5 border border-[#474b37] hover:border-[#5c6147] transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center">
                <stat.Icon className="w-5 h-5 text-[#e7f69e]" />
              </div>
              {stat.change && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  stat.positive 
                    ? "bg-[#262720] border border-[#474b37] text-[#e7f69e]" 
                    : "bg-red-500/10 text-red-400"
                )}>
                  {stat.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-semibold text-white">{stat.value}</div>
            <div className="text-sm text-white/50 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Agents</h2>
            <Link 
              href="/dashboard/agents" 
              className="text-sm text-[#e7f69e]/70 hover:text-[#e7f69e] flex items-center gap-1 transition-colors"
            >
              View all 
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {agents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {agents.slice(0, 4).map((agent) => (
                <Link 
                  key={agent.id} 
                  href={`/dashboard/agents/${agent.id}`}
                  className="bg-[#262720] rounded-xl p-5 border border-[#474b37] hover:border-[#5c6147] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-lg bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center text-[#e7f69e]/60 group-hover:text-[#e7f69e] transition-colors">
                      <AgentIcon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full border",
                      agent.is_active 
                        ? 'bg-[#262720] border-[#474b37] text-[#e7f69e]' 
                        : 'bg-white/5 border-white/10 text-white/50'
                    )}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="font-medium text-white mb-1 group-hover:text-[#e7f69e] transition-colors">{agent.name}</h3>
                  <p className="text-sm text-white/50 line-clamp-2 capitalize">
                    {agent.industry || agent.type || 'AI Agent'}
                  </p>
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#3a3d32]">
                    <div>
                      <div className="text-sm font-medium text-white">{agent.total_calls || 0}</div>
                      <div className="text-xs text-white/50">Calls</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{Math.round(agent.total_minutes || 0)}m</div>
                      <div className="text-xs text-white/50">Minutes</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-[#262720] rounded-xl p-8 border border-[#474b37] text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center">
                <AgentIcon className="w-7 h-7 text-[#e7f69e]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create your first AI agent</h3>
              <p className="text-white/50 mb-6 max-w-sm mx-auto text-sm">
                Get started in minutes. Your AI agent will handle calls, book appointments, and never miss a lead.
              </p>
              <Link 
                href="/dashboard/agents/new" 
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#1a1b18] border-2 border-[#474b37] text-[#e7f69e] font-medium text-sm rounded-full hover:bg-[#262720] hover:border-[#5c6147] transition-all"
              >
                Create Agent 
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent Calls */}
          <div className="bg-[#262720] rounded-xl border border-[#474b37] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3a3d32]">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Recent Calls</h2>
                <Link 
                  href="/dashboard/calls" 
                  className="text-sm text-[#e7f69e]/70 hover:text-[#e7f69e] transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-8 text-center">
              <PhoneIcon className="w-8 h-8 text-[#e7f69e]/30 mx-auto mb-3" />
              <p className="text-sm text-white/50">No calls yet</p>
              <p className="text-xs text-white/30 mt-1">Calls will appear here once your agents start handling them</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#262720] rounded-xl p-5 border border-[#474b37]">
            <div className="flex items-center gap-3 mb-4">
              <ChartIcon className="w-5 h-5 text-[#e7f69e]" />
              <h3 className="font-semibold text-white">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Avg. Call Duration', value: '3m 24s' },
                { label: 'Peak Hours', value: '10am - 2pm' },
                { label: 'Success Rate', value: '94%', highlight: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-white/50">{item.label}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    item.highlight ? "text-[#e7f69e]" : "text-white"
                  )}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
