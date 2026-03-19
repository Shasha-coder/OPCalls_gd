import { create } from 'zustand'
import type { Profile, Organization, Agent } from '@/types/database'

// Lazy load Supabase client to prevent crashes
const getSupabaseClient = () => {
  try {
    // Check if env vars exist before attempting to create client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }
    const { createClient } = require('@/lib/supabase/client')
    return createClient()
  } catch {
    return null
  }
}

interface AuthState {
  user: any | null
  profile: Profile | null
  organization: Organization | null
  agents: Agent[]
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshAgents: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  organization: null,
  agents: [],
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      set({ isLoading: false, isInitialized: true })
      return
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        let organization = null
        let agents: Agent[] = []
        
        if (profile?.org_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.org_id)
            .single()
          organization = org

          const { data: agentData } = await supabase
            .from('agents')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('created_at', { ascending: false })
          agents = agentData || []
        }

        set({ user, profile, organization, agents, isLoading: false, isInitialized: true })
      } else {
        set({ user: null, profile: null, organization: null, agents: [], isLoading: false, isInitialized: true })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ isLoading: false, isInitialized: true })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await get().refreshProfile()
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, organization: null, agents: [] })
      }
    })
  },

  signIn: async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Authentication not available' }
    }
    set({ isLoading: true })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ isLoading: false })
      return { error: error.message }
    }

    await get().initialize()
    return {}
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Authentication not available' }
    }
    set({ isLoading: true })

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      set({ isLoading: false })
      return { error: error.message }
    }

    set({ isLoading: false })
    return {}
  },

  signInWithGoogle: async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Authentication not available' }
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return {}
  },

  signOut: async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    set({ user: null, profile: null, organization: null, agents: [] })
  },

  refreshProfile: async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      let organization = null
      let agents: Agent[] = []
      
      if (profile?.org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.org_id)
          .single()
        organization = org

        const { data: agentData } = await supabase
          .from('agents')
          .select('*')
          .eq('org_id', profile.org_id)
          .order('created_at', { ascending: false })
        agents = agentData || []
      }

      set({ user, profile, organization, agents })
    }
  },

  refreshAgents: async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    
    const { profile } = get()
    
    if (profile?.org_id) {
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
      
      set({ agents: agents || [] })
    }
  },
}))
