'use client'

import { useEffect, useRef } from 'react'
import { BarChart2, TrendingUp, Phone, Clock, Users, Calendar } from 'lucide-react'
import gsap from 'gsap'

export default function AnalyticsPage() {
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )

      gsap.fromTo(
        '.analytics-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.2, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  const stats = [
    { label: 'Total Calls This Month', value: '1,247', change: '+12%', icon: Phone },
    { label: 'Average Call Duration', value: '3m 42s', change: '+5%', icon: Clock },
    { label: 'Conversion Rate', value: '34.2%', change: '+8%', icon: TrendingUp },
    { label: 'Unique Callers', value: '892', change: '+15%', icon: Users },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Analytics
        </h1>
        <p className="text-white/60 mt-1">
          Track your AI agent performance and call metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className="analytics-card bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-lime-200/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-lime-200" />
              </div>
              <span className="text-sm text-lime-200 font-medium">{stat.change}</span>
            </div>
            <div className="text-2xl font-display font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-white/50">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="analytics-card bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-white">Calls Over Time</h2>
          <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        
        {/* Simple bar chart visualization */}
        <div className="flex items-end justify-between h-48 gap-2">
          {[65, 45, 78, 52, 90, 68, 85].map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-gradient-to-t from-lime-200/50 to-lime-200 rounded-t-lg transition-all duration-500"
                style={{ height: `${value}%` }}
              />
              <span className="text-xs text-white/40">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="analytics-card bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-display font-semibold text-white mb-4">Peak Call Hours</h2>
          <div className="space-y-3">
            {[
              { hour: '10 AM - 11 AM', calls: 145, percent: 95 },
              { hour: '2 PM - 3 PM', calls: 132, percent: 85 },
              { hour: '11 AM - 12 PM', calls: 118, percent: 75 },
              { hour: '3 PM - 4 PM', calls: 98, percent: 65 },
            ].map((item) => (
              <div key={item.hour}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/70">{item.hour}</span>
                  <span className="text-white">{item.calls} calls</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-lime-200 to-olive rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-display font-semibold text-white mb-4">Call Outcomes</h2>
          <div className="space-y-4">
            {[
              { outcome: 'Appointment Booked', count: 423, color: 'bg-lime-200' },
              { outcome: 'Question Answered', count: 312, color: 'bg-blue-400' },
              { outcome: 'Callback Scheduled', count: 189, color: 'bg-purple-400' },
              { outcome: 'Message Taken', count: 156, color: 'bg-orange-400' },
            ].map((item) => (
              <div key={item.outcome} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <div className="flex-1">
                  <div className="text-sm text-white">{item.outcome}</div>
                </div>
                <div className="text-sm font-medium text-white">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
