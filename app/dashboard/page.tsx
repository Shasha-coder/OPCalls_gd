'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">
            Welcome back, {profile?.first_name || 'there'}
          </h1>
          <p className="text-muted-foreground mt-1">Here is what is happening with your AI agents today.</p>
        </div>
        <Link 
          href="/dashboard/agents/new" 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Agent
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls', value: stats.totalCalls, change: '+12%', icon: 'phone', positive: true },
          { label: 'Total Minutes', value: `${Math.round(stats.totalMinutes)}m`, change: '+8%', icon: 'clock', positive: true },
          { label: 'Conversion Rate', value: `${stats.conversionRate}%`, change: '+3.2%', icon: 'trending', positive: true },
          { label: 'Active Agents', value: stats.activeAgents, change: null, icon: 'users', positive: true },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <StatIcon type={stat.icon} />
              </div>
              {stat.change && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  stat.positive 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-red-500/10 text-red-500"
                )}>
                  {stat.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Agents</h2>
            <Link 
              href="/dashboard/agents" 
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all 
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {agents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {agents.slice(0, 4).map((agent) => (
                <Link 
                  key={agent.id} 
                  href={`/dashboard/agents/${agent.id}`}
                  className="bg-card rounded-xl p-5 border border-border hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="11" width="18" height="10" rx="2"/>
                        <circle cx="12" cy="5" r="2"/>
                        <path d="M12 7v4"/>
                      </svg>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      agent.is_active 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.prompt?.slice(0, 60) || 'No description'}...
                  </p>
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                    <div>
                      <div className="text-sm font-medium text-foreground">{agent.total_calls || 0}</div>
                      <div className="text-xs text-muted-foreground">Calls</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{Math.round(agent.total_minutes || 0)}m</div>
                      <div className="text-xs text-muted-foreground">Minutes</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-8 border border-border text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary flex items-center justify-center">
                <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Create your first AI agent</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
                Get started in minutes. Your AI agent will handle calls, book appointments, and never miss a lead.
              </p>
              <Link 
                href="/dashboard/agents/new" 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Agent 
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent Calls */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Recent Calls</h2>
                <Link 
                  href="/dashboard/calls" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-8 text-center">
              <svg className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              <p className="text-sm text-muted-foreground">No calls yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Calls will appear here once your agents start handling them</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <h3 className="font-semibold text-foreground">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Avg. Call Duration', value: '3m 24s' },
                { label: 'Peak Hours', value: '10am - 2pm' },
                { label: 'Success Rate', value: '94%', highlight: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    item.highlight ? "text-emerald-500" : "text-foreground"
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

function StatIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    phone: <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/></svg>,
    clock: <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    trending: <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    users: <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  }
  return icons[type] || null
}
