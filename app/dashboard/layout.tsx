'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Phone, LayoutDashboard, Bot, BarChart2, Settings, 
  LogOut, Menu, X, ChevronDown, Bell, Search, Plus, Smartphone, Wand2
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { cn, getInitials } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Agent Builder', href: '/dashboard/agents/builder', icon: Wand2 },
  { name: 'Phone Numbers', href: '/dashboard/phone', icon: Smartphone },
  { name: 'Call History', href: '/dashboard/calls', icon: Phone },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, organization, signOut, initialize, isInitialized } = useAuthStore()
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
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="OPCalls"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="font-display font-bold text-xl">
                <span className="text-white">OP</span>
                <span className="text-lime-200">CALLS</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization selector */}
          <div className="px-4 py-4 border-b border-white/5">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-200/30 to-olive/30 flex items-center justify-center">
                <span className="text-sm font-medium text-lime-200">
                  {organization?.name?.[0] || 'O'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white truncate">
                  {organization?.name || 'My Organization'}
                </div>
                <div className="text-xs text-white/50 capitalize">
                  {organization?.subscription_tier || 'Free'} Plan
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </button>
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
                      ? 'bg-lime-200/10 text-lime-200 border border-lime-200/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-200 to-olive flex items-center justify-center">
                <span className="text-sm font-semibold text-dark">
                  {profile ? getInitials(`${profile.first_name || ''} ${profile.last_name || ''}`) : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {profile?.first_name} {profile?.last_name}
                </div>
                <div className="text-xs text-white/50 truncate">
                  {user?.email}
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

            {/* Search */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 w-64 lg:w-80">
              <Search className="w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/40">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Create Agent Button */}
            <Link href="/dashboard/agents/new">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lime-200 to-lime-300 text-dark font-semibold text-sm rounded-xl hover:shadow-lime-glow-sm transition-all">
                <Plus className="w-4 h-4" />
                New Agent
              </button>
            </Link>

            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-lime-200 rounded-full" />
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
