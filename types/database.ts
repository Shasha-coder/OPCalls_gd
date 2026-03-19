export interface Profile {
  id: string
  org_id: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string
  is_admin: boolean
  demo_call_id: string | null
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  subscription_tier: 'free' | 'core' | 'scale' | 'enterprise'
  subscription_status: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  org_id: string
  name: string
  type: 'inbound' | 'outbound'
  industry: string
  retell_agent_id: string | null
  retell_voice_id: string | null
  prompt: string | null
  languages: string[]
  primary_language: string
  voice: string | null
  knowledge_base: string | null
  max_call_duration: number | null
  capabilities: string[] | null
  is_active: boolean
  total_calls: number
  total_bookings: number
  total_minutes: number
  conversion_rate: number | null
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  org_id: string
  agent_id: string
  phone_number_id: string | null
  retell_call_id: string | null
  direction: 'inbound' | 'outbound'
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'busy' | 'no_answer'
  outcome: 'booked' | 'answered' | 'callback' | 'transferred' | 'no_action' | 'voicemail' | null
  from_number: string | null
  to_number: string | null
  started_at: string | null
  ended_at: string | null
  duration_ms: number
  transcript: string | null
  transcript_object: Record<string, any> | null
  recording_url: string | null
  summary: string | null
  sentiment: string | null
  call_successful: boolean
  user_sentiment: string | null
  custom_analysis: Record<string, any> | null
  language_detected: string | null
  caller_name: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface Subscription {
  id: string
  org_id: string
  tier: 'free' | 'core' | 'scale' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  minutes_included: number
  minutes_used: number
  agents_included: number
  created_at: string
  updated_at: string
}

export interface DailyMetric {
  id: string
  org_id: string
  agent_id: string | null
  date: string
  total_calls: number
  answered_calls: number
  missed_calls: number
  total_minutes: number
  bookings: number
  conversion_rate: number
  avg_duration: number
}

export interface PhoneNumber {
  id: string
  org_id: string
  agent_id: string | null
  number: string
  country: string
  capabilities: string[]
  status: 'active' | 'inactive' | 'pending'
  monthly_cost: number
  created_at: string
}

// Dashboard Stats
export interface DashboardStats {
  totalCalls: number
  totalMinutes: number
  conversionRate: number
  totalBookings: number
  activeAgents: number
  callsToday: number
  callsChange: number
  minutesChange: number
  bookingsChange: number
}

// Admin Stats
export interface AdminStats {
  totalUsers: number
  totalOrganizations: number
  totalAgents: number
  totalCalls: number
  activeSubscriptions: number
  monthlyRevenue: number
  newUsersToday: number
  callsToday: number
}
