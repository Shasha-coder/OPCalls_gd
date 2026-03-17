'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Phone, LayoutDashboard, Users, Bot, BarChart2, Settings, 
  LogOut, Menu, X, Shield, Activity, DollarSign, Bell
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { cn, getInitials } from '@/lib/utils'

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Organizations', href: '/admin/organizations', icon: Shield },
  { name: 'All Agents', href: '/admin/agents', icon: Bot },
  { name: 'Call Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'Activity Logs', href: '/admin/logs', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, initialize, isInitialized } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-dark/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-dark-50 border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-20 border-b border-white/5">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white">Admin</span>
                <div className="text-xs text-white/50">OPCalls Console</div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin badge */}
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Admin Mode</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Back to Dashboard */}
          <div className="p-4 border-t border-white/5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>

          {/* User menu */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {profile ? getInitials(`${profile.first_name || ''} ${profile.last_name || ''}`) : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {profile?.first_name} {profile?.last_name}
                </div>
                <div className="text-xs text-red-400 truncate">
                  Super Admin
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-white/40 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 lg:px-8 bg-dark/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-white/60 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-semibold text-white">
                Admin Console
              </h1>
              <p className="text-sm text-white/50">Platform monitoring & management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-200/10 border border-lime-200/20">
              <div className="w-2 h-2 rounded-full bg-lime-200 animate-pulse" />
              <span className="text-xs font-medium text-lime-200">All Systems Operational</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
