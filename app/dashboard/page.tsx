'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Phone, Users, Clock, TrendingUp, ArrowRight, Plus, Zap, BarChart2 } from 'lucide-react'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { StatCard } from '@/components/dashboard/StatCard'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { Button } from '@/components/ui/Button'
import { formatNumber, formatMinutes, getRelativeTime, getOutcomeLabel } from '@/lib/utils'
import type { Call } from '@/types/database'

export default function DashboardPage() {
  const { profile, organization, agents, refreshAgents } = useAuthStore()
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalMinutes: 0,
    conversionRate: 0,
    activeAgents: 0,
    callsChange: 0,
    minutesChange: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const headerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )

      // Stats stagger animation
      gsap.fromTo(
        '.stat-card',
        { opacity: 0, y: 30, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.5, 
          stagger: 0.1, 
          delay: 0.2,
          ease: 'power3.out' 
        }
      )
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.org_id) {
        setIsLoading(false)
        return
      }

      const supabase = createClient()

      // Fetch recent calls
      const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (calls) {
        setRecentCalls(calls)
      }

      // Calculate stats from agents
      const totalCalls = agents.reduce((sum, a) => sum + (a.total_calls || 0), 0)
      const totalMinutes = agents.reduce((sum, a) => sum + (a.total_minutes || 0), 0)
      const totalBookings = agents.reduce((sum, a) => sum + (a.total_bookings || 0), 0)
      const activeAgents = agents.filter(a => a.is_active).length
      const conversionRate = totalCalls > 0 ? (totalBookings / totalCalls) * 100 : 0

      setStats({
        totalCalls,
        totalMinutes,
        conversionRate,
        activeAgents,
        callsChange: 12, // Placeholder - would calculate from daily stats
        minutesChange: 8,
      })

      setIsLoading(false)
    }

    fetchData()
  }, [profile, agents])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Welcome back, {profile?.first_name || 'there'} 👋
          </h1>
          <p className="text-white/60 mt-1">
            Here's what's happening with your AI agents today.
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button rightIcon={<Plus className="w-4 h-4" />}>
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stat-card">
          <StatCard
            title="Total Calls"
            value={stats.totalCalls}
            change={stats.callsChange}
            changeLabel="vs last week"
            icon={<Phone className="w-5 h-5" />}
            index={0}
          />
        </div>
        <div className="stat-card">
          <StatCard
            title="Total Minutes"
            value={formatMinutes(stats.totalMinutes)}
            change={stats.minutesChange}
            changeLabel="vs last week"
            icon={<Clock className="w-5 h-5" />}
            gradient="from-olive to-lime-200"
            index={1}
          />
        </div>
        <div className="stat-card">
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            change={3.2}
            changeLabel="vs last week"
            icon={<TrendingUp className="w-5 h-5" />}
            gradient="from-lime-300 to-olive"
            index={2}
          />
        </div>
        <div className="stat-card">
          <StatCard
            title="Active Agents"
            value={stats.activeAgents}
            icon={<Users className="w-5 h-5" />}
            gradient="from-lime-200 to-lime-300"
            index={3}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Agents Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-white">Your Agents</h2>
            <Link href="/dashboard/agents" className="text-sm text-lime-200 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {agents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {agents.slice(0, 4).map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  index={index}
                  onEdit={(a) => console.log('Edit', a)}
                  onToggleStatus={(a) => console.log('Toggle', a)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-lime-200/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-lime-200" />
              </div>
              <h3 className="text-lg font-display font-semibold text-white mb-2">
                Create your first AI agent
              </h3>
              <p className="text-white/60 mb-6 max-w-sm mx-auto">
                Get started in minutes. Your AI agent will handle calls, book appointments, and never miss a lead.
              </p>
              <Link href="/dashboard/agents/new">
                <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Agent
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-white">Recent Calls</h2>
            <Link href="/dashboard/calls" className="text-sm text-lime-200 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            {recentCalls.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentCalls.map((call) => (
                  <div key={call.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-lime-200/10 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-lime-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {call.caller_name || call.from_number || 'Unknown Caller'}
                        </div>
                        <div className="text-xs text-lime-200/80">
                          {call.outcome ? getOutcomeLabel(call.outcome) : 'Completed'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/50">
                          {getRelativeTime(call.created_at)}
                        </div>
                        <div className="text-xs text-white/40">
                          {call.duration_ms ? formatMinutes(call.duration_ms / 60000) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Phone className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No calls yet</p>
                <p className="text-xs text-white/30 mt-1">
                  Calls will appear here once your agents start handling them
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart2 className="w-5 h-5 text-lime-200" />
              <h3 className="font-medium text-white">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Avg. Call Duration</span>
                <span className="text-sm font-medium text-white">3m 24s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Peak Hours</span>
                <span className="text-sm font-medium text-white">10am - 2pm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Success Rate</span>
                <span className="text-sm font-medium text-lime-200">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
