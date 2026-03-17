'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  Users, Building, Bot, Phone, DollarSign, TrendingUp, 
  Activity, AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatNumber } from '@/lib/utils'

interface PlatformStats {
  totalUsers: number
  totalOrganizations: number
  totalAgents: number
  totalCalls: number
  activeSubscriptions: number
  monthlyRevenue: number
  newUsersToday: number
  callsToday: number
  usersChange: number
  callsChange: number
  revenueChange: number
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'subscription' | 'agent_created' | 'call_completed'
  description: string
  timestamp: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    totalAgents: 0,
    totalCalls: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    newUsersToday: 0,
    callsToday: 0,
    usersChange: 12,
    callsChange: 23,
    revenueChange: 8,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [systemHealth, setSystemHealth] = useState({
    api: 'healthy',
    database: 'healthy',
    voiceService: 'healthy',
    webhooks: 'healthy',
  })
  const [isLoading, setIsLoading] = useState(true)

  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )

      gsap.fromTo(
        '.admin-stat-card',
        { opacity: 0, y: 30, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.5, 
          stagger: 0.08, 
          delay: 0.2,
          ease: 'power3.out' 
        }
      )

      gsap.fromTo(
        '.admin-section',
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0,
          duration: 0.6, 
          stagger: 0.1, 
          delay: 0.5,
          ease: 'power3.out' 
        }
      )
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        // Fetch counts
        const [profilesRes, orgsRes, agentsRes, callsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('agents').select('id', { count: 'exact', head: true }),
          supabase.from('calls').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          totalUsers: profilesRes.count || 0,
          totalOrganizations: orgsRes.count || 0,
          totalAgents: agentsRes.count || 0,
          totalCalls: callsRes.count || 0,
          activeSubscriptions: 45, // Placeholder
          monthlyRevenue: 28450, // Placeholder
          newUsersToday: 12,
          callsToday: 847,
          usersChange: 12,
          callsChange: 23,
          revenueChange: 8,
        })

        // Generate mock recent activity
        setRecentActivity([
          { id: '1', type: 'user_signup', description: 'New user registered: john@example.com', timestamp: '2 minutes ago' },
          { id: '2', type: 'subscription', description: 'Subscription upgraded to Scale plan', timestamp: '15 minutes ago' },
          { id: '3', type: 'agent_created', description: 'New agent created: Customer Support AI', timestamp: '32 minutes ago' },
          { id: '4', type: 'call_completed', description: 'Call completed: +1 (555) 123-4567', timestamp: '45 minutes ago' },
          { id: '5', type: 'user_signup', description: 'New user registered: sarah@company.com', timestamp: '1 hour ago' },
        ])

      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      change: stats.usersChange, 
      icon: Users,
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      title: 'Organizations', 
      value: stats.totalOrganizations, 
      change: 5, 
      icon: Building,
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      title: 'AI Agents', 
      value: stats.totalAgents, 
      change: 18, 
      icon: Bot,
      color: 'from-lime-500 to-lime-600' 
    },
    { 
      title: 'Total Calls', 
      value: stats.totalCalls, 
      change: stats.callsChange, 
      icon: Phone,
      color: 'from-cyan-500 to-cyan-600' 
    },
    { 
      title: 'Active Subscriptions', 
      value: stats.activeSubscriptions, 
      change: 3, 
      icon: CheckCircle,
      color: 'from-green-500 to-green-600' 
    },
    { 
      title: 'Monthly Revenue', 
      value: `$${formatNumber(stats.monthlyRevenue)}`, 
      change: stats.revenueChange, 
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-500' 
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="w-4 h-4" />
      case 'subscription': return <DollarSign className="w-4 h-4" />
      case 'agent_created': return <Bot className="w-4 h-4" />
      case 'call_completed': return <Phone className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_signup': return 'bg-blue-500/20 text-blue-400'
      case 'subscription': return 'bg-yellow-500/20 text-yellow-400'
      case 'agent_created': return 'bg-lime-500/20 text-lime-400'
      case 'call_completed': return 'bg-cyan-500/20 text-cyan-400'
      default: return 'bg-white/10 text-white/60'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Platform Overview
        </h1>
        <p className="text-white/60 mt-1">
          Monitor platform health, user activity, and business metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div key={stat.title} className="admin-stat-card">
            <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.change >= 0 ? 'text-lime-400' : 'text-red-400'
                }`}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-white mb-1">
                {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
              </div>
              <div className="text-xs text-white/50">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="admin-section">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-lime-200" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(systemHealth).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm text-white/70 capitalize">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                      status === 'healthy' 
                        ? 'bg-lime-500/20 text-lime-400' 
                        : status === 'degraded'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        status === 'healthy' ? 'bg-lime-400' : status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                      } ${status === 'healthy' ? 'animate-pulse' : ''}`} />
                      {status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Metrics */}
        <div className="admin-section">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-lime-200" />
                Today's Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">New Users</span>
                    <span className="text-lg font-semibold text-white">{stats.newUsersToday}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-lime-200 to-olive rounded-full" style={{ width: '67%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Calls Handled</span>
                    <span className="text-lg font-semibold text-white">{stats.callsToday}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" style={{ width: '84%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Success Rate</span>
                    <span className="text-lg font-semibold text-lime-200">94.2%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-lime-400 rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="admin-section">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-lime-200" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{activity.description}</p>
                      <p className="text-xs text-white/40">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="admin-section">
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-400">Attention Required</h3>
                <p className="text-sm text-white/60">
                  3 organizations have exceeded their monthly call limits. Review and contact them about upgrading their plans.
                </p>
              </div>
              <button className="px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-lg hover:bg-yellow-500/30 transition-colors">
                Review
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
