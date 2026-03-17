'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Building, Bell, Shield, CreditCard, Globe, Save } from 'lucide-react'
import gsap from 'gsap'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'organization', name: 'Organization', icon: Building },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'billing', name: 'Billing', icon: CreditCard },
]

export default function SettingsPage() {
  const { profile, organization } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsSaving(false)
    toast.success('Settings saved!')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Settings
        </h1>
        <p className="text-white/60 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-lime-200/10 text-lime-200 border border-lime-200/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6 lg:p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-white">Profile Information</h2>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-200 to-olive flex items-center justify-center text-2xl font-bold text-dark">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </div>
                  <div>
                    <Button variant="secondary" size="sm">Change Photo</Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    defaultValue={profile?.first_name || ''}
                    placeholder="John"
                  />
                  <Input
                    label="Last Name"
                    defaultValue={profile?.last_name || ''}
                    placeholder="Doe"
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  defaultValue=""
                  placeholder="john@example.com"
                  disabled
                  hint="Contact support to change your email"
                />

                <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Changes
                </Button>
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-white">Organization Settings</h2>
                
                <Input
                  label="Organization Name"
                  defaultValue={organization?.name || ''}
                  placeholder="My Company"
                />

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">Timezone</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-lime-200/50">
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>

                <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Changes
                </Button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-white">Notification Preferences</h2>
                
                {[
                  { id: 'email_calls', label: 'Email me after each call', description: 'Receive a summary email after every call' },
                  { id: 'email_daily', label: 'Daily digest', description: 'Get a daily summary of all calls' },
                  { id: 'email_weekly', label: 'Weekly report', description: 'Weekly performance report every Monday' },
                  { id: 'sms_missed', label: 'SMS for missed calls', description: 'Get notified via SMS when a call is missed' },
                ].map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-white font-medium">{pref.label}</div>
                      <div className="text-sm text-white/50">{pref.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-200" />
                    </label>
                  </div>
                ))}

                <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Preferences
                </Button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-white">Security Settings</h2>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-white/50">Add an extra layer of security</div>
                    </div>
                    <Button variant="secondary" size="sm">Enable 2FA</Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Change Password</div>
                      <div className="text-sm text-white/50">Update your account password</div>
                    </div>
                    <Button variant="secondary" size="sm">Change</Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Active Sessions</div>
                      <div className="text-sm text-white/50">1 active session</div>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-white">Billing & Subscription</h2>
                
                <div className="p-6 rounded-xl bg-gradient-to-br from-lime-200/10 to-olive/10 border border-lime-200/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-lime-200">Current Plan</div>
                      <div className="text-2xl font-display font-bold text-white capitalize">
                        {organization?.subscription_tier || 'Free'} Plan
                      </div>
                    </div>
                    <Button size="sm">Upgrade</Button>
                  </div>
                  <div className="text-sm text-white/60">
                    Your next billing date is April 10, 2026
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Payment Method</div>
                      <div className="text-sm text-white/50">Visa ending in 4242</div>
                    </div>
                    <Button variant="ghost" size="sm">Update</Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Billing History</div>
                      <div className="text-sm text-white/50">View past invoices</div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
