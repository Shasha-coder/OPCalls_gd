'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { ThemeToggleButton } from '@/components/dashboard/ThemeToggleButton'
import { cn, getInitials } from '@/lib/utils'
import {
  HomeIcon, AgentIcon, PhoneIcon, CallHistoryIcon, AnalyticsIcon,
  SettingsIcon, SearchIcon, BellIcon, ChevronDownIcon, SignOutIcon,
  MenuIcon, CloseIcon,
} from '@/components/ui/Icons'

const navigation = [
  { name: 'Overview',      href: '/dashboard',           Icon: HomeIcon },
  { name: 'Agents',        href: '/dashboard/agents',    Icon: AgentIcon },
  { name: 'Phone Numbers', href: '/dashboard/phone',     Icon: PhoneIcon },
  { name: 'Call History',  href: '/dashboard/calls',     Icon: CallHistoryIcon },
  { name: 'Analytics',     href: '/dashboard/analytics', Icon: AnalyticsIcon },
  { name: 'Settings',      href: '/dashboard/settings',  Icon: SettingsIcon },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, organization, signOut, initialize, isInitialized } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
    setMounted(true)
  }, [isInitialized, initialize])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen dark-bg dark:dark-bg light:bg-white light:text-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 glass-card border-r border-[#474b37] transform transition-transform duration-200 ease-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-[#474b37]">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/favicon.png"
                alt="OPCalls"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-semibold text-lg text-white">OPCalls</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white/40 hover:text-white rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Organization */}
          <div className="px-4 py-3 border-b border-[#474b37]">
            <button className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#262720] hover:bg-[#2d3127] transition-colors border border-[#474b37]">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {organization?.name?.[0] || 'O'}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {organization?.name || 'My Organization'}
                </div>
                <div className="text-xs text-white/50 capitalize">
                  {organization?.subscription_tier || 'Free'} Plan
                </div>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map(({ name, href, Icon }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#e7f69e] text-[#262720]'
                      : 'text-white/60 hover:text-white hover:bg-[#262720]'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon />
                  {name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="p-3 border-t border-[#474b37]">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#262720] border border-[#474b37]">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
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
                className="p-2 text-white/40 hover:text-red-400 rounded-lg transition-colors"
                title="Sign out"
              >
                <SignOutIcon />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#474b37]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-white/60 hover:text-white rounded-lg transition-colors"
            >
              <MenuIcon />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-[#262720] rounded-xl border border-[#474b37] w-64 lg:w-80">
              <SearchIcon className="w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/50 border border-white/10 font-mono">
                /
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggleButton />

            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-[#262720] text-[#e7f69e] hover:bg-[#2d3127] hover:border-[#474b37] border border-[#474b37] transition-colors">
              <BellIcon />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
