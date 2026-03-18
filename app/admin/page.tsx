'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    totalAgents: 0,
    totalCalls: 0,
    activeSubscriptions: 45,
    monthlyRevenue: 28450,
  })
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      gsap.fromTo('.admin-stat-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, delay: 0.2, ease: 'power3.out' })
      gsap.fromTo('.admin-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.5, ease: 'power3.out' })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      try {
        const [profilesRes, orgsRes, agentsRes, callsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('agents').select('id', { count: 'exact', head: true }),
          supabase.from('calls').select('id', { count: 'exact', head: true }),
        ])
        setStats(prev => ({
          ...prev,
          totalUsers: profilesRes.count || 0,
          totalOrganizations: orgsRes.count || 0,
          totalAgents: agentsRes.count || 0,
          totalCalls: callsRes.count || 0,
        }))
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, change: 12, color: '#3B82F6' },
    { title: 'Organizations', value: stats.totalOrganizations, change: 5, color: '#8B5CF6' },
    { title: 'AI Agents', value: stats.totalAgents, change: 18, color: '#10B981' },
    { title: 'Total Calls', value: stats.totalCalls, change: 23, color: '#14B8A6' },
    { title: 'Active Subscriptions', value: stats.activeSubscriptions, change: 3, color: '#F59E0B' },
    { title: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, change: 8, color: '#EF4444' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">Platform Overview</h1>
        <p className="text-white/40 mt-1">Monitor platform health, user activity, and business metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="admin-stat-card bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                <svg className="w-5 h-5" style={{ color: stat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.change >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                {stat.change >= 0 ? '+' : ''}{stat.change}%
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/40 mt-1">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="admin-section bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <h2 className="font-semibold text-white">System Health</h2>
          </div>
          <div className="space-y-4">
            {[{ name: 'API', status: 'healthy' }, { name: 'Database', status: 'healthy' }, { name: 'Voice Service', status: 'healthy' }, { name: 'Webhooks', status: 'healthy' }].map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <span className="text-sm text-white/60">{service.name}</span>
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${service.status === 'healthy' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {service.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Metrics */}
        <div className="admin-section bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <h2 className="font-semibold text-white">Today's Metrics</h2>
          </div>
          <div className="space-y-5">
            {[{ label: 'New Users', value: 12, percent: 67 }, { label: 'Calls Handled', value: 847, percent: 84 }, { label: 'Success Rate', value: '94.2%', percent: 94 }].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">{metric.label}</span>
                  <span className="text-sm font-semibold text-white">{metric.value}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${metric.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-section bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <h2 className="font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link href="/admin/presets" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Manage Agent Presets</div>
                <div className="text-xs text-white/40">Edit landing page phone mockup</div>
              </div>
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">View All Users</div>
                <div className="text-xs text-white/40">{stats.totalUsers} registered users</div>
              </div>
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/admin/organizations" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Organizations</div>
                <div className="text-xs text-white/40">{stats.totalOrganizations} total</div>
              </div>
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div className="admin-section bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-400">Attention Required</h3>
          <p className="text-sm text-white/60">3 organizations have exceeded their monthly call limits.</p>
        </div>
        <button className="px-4 py-2 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-lg hover:bg-amber-500/30 transition-colors">Review</button>
      </div>
    </div>
  )
}
