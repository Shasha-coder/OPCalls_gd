'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { formatDuration, getRelativeTime, getOutcomeLabel, getSentimentColor } from '@/lib/utils'
import type { Call } from '@/types/database'
import { SearchIcon, PhoneIcon, DownloadIcon, FilterIcon, CloseIcon, PlayIcon, PauseIcon } from '@/components/ui/Icons'
import { ChevronRight, X } from 'lucide-react'

const PAGE_SIZE = 20

interface FilterState {
  dateRange: 'all' | '7d' | '30d' | '90d'
  outcome: string
  sentiment: string
}

// Icons
const VolumeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)

export default function CallsPage() {
  const { profile } = useAuthStore()
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    outcome: 'all',
    sentiment: 'all'
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  // Build query
  const buildQuery = useCallback((supabase: ReturnType<typeof createClient>, offset: number) => {
    let query = supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .eq('org_id', profile?.org_id!)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      query = query.gte('created_at', cutoff.toISOString())
    }

    if (filters.outcome !== 'all') {
      query = query.eq('outcome', filters.outcome)
    }

    if (filters.sentiment !== 'all') {
      query = query.eq('sentiment', filters.sentiment)
    }

    if (debouncedSearch) {
      query = query.or(`caller_name.ilike.%${debouncedSearch}%,from_number.ilike.%${debouncedSearch}%,summary.ilike.%${debouncedSearch}%`)
    }

    return query
  }, [profile?.org_id, filters, debouncedSearch])

  // Fetch calls
  const fetchCalls = useCallback(async (reset = false) => {
    if (!profile?.org_id) {
      setIsLoading(false)
      return
    }

    if (reset) {
      setIsLoading(true)
      setCalls([])
    } else {
      setIsLoadingMore(true)
    }

    const supabase = createClient()
    const offset = reset ? 0 : calls.length
    const { data, count, error } = await buildQuery(supabase, offset)

    if (error) {
      console.error('Failed to fetch calls:', error)
    } else if (data) {
      setCalls(prev => reset ? data : [...prev, ...data])
      setHasMore(count ? offset + data.length < count : false)
    }

    setIsLoading(false)
    setIsLoadingMore(false)
  }, [profile?.org_id, calls.length, buildQuery])

  // Initial load and filter changes
  useEffect(() => {
    fetchCalls(true)
  }, [profile?.org_id, filters, debouncedSearch])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchCalls(false)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, isLoadingMore, isLoading, fetchCalls])

  // Audio playback
  const togglePlayback = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.src = url
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Export CSV
  const exportCalls = () => {
    const headers = ['Date', 'Caller', 'Phone', 'Duration', 'Outcome', 'Sentiment', 'Summary']
    const rows = calls.map(c => [
      new Date(c.created_at).toISOString(),
      c.caller_name || '',
      c.from_number || '',
      c.duration_ms ? (c.duration_ms / 60000).toFixed(1) + 'm' : '',
      c.outcome || '',
      c.sentiment || '',
      (c.summary || '').replace(/,/g, ';')
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calls-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeFiltersCount = [filters.dateRange, filters.outcome, filters.sentiment].filter(f => f !== 'all').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Call History
          </h1>
          <p className="text-white/50 mt-1">
            {calls.length > 0 && `${calls.length} calls`}
            {hasMore && ' • Scroll for more'}
          </p>
        </div>
        <button 
          onClick={exportCalls}
          disabled={calls.length === 0}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#1a1b18] border-2 border-[#474b37] text-[#e7f69e] font-medium text-sm rounded-full hover:bg-[#262720] hover:border-[#5c6147] transition-all disabled:opacity-50"
        >
          <DownloadIcon className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search by caller, phone, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-[#262720] border border-[#474b37] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#e7f69e]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`relative flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-[#262720] border-[#474b37] text-[#e7f69e]'
              : 'bg-[#1a1b18] border-[#3a3d32] text-white/70 hover:border-[#474b37]'
          }`}
        >
          <FilterIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#e7f69e] text-[#1a1b18] text-xs font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-[#262720] border border-[#474b37] rounded-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Time Period</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value as FilterState['dateRange'] }))}
                className="w-full px-3 py-2 bg-[#1a1b18] border border-[#3a3d32] rounded-lg text-white focus:outline-none focus:border-[#e7f69e] appearance-none"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Outcome</label>
              <select
                value={filters.outcome}
                onChange={(e) => setFilters(f => ({ ...f, outcome: e.target.value }))}
                className="w-full px-3 py-2 bg-[#1a1b18] border border-[#3a3d32] rounded-lg text-white focus:outline-none focus:border-[#e7f69e] appearance-none"
              >
                <option value="all">All Outcomes</option>
                <option value="booking">Booking Made</option>
                <option value="callback">Callback Scheduled</option>
                <option value="info">Information Provided</option>
                <option value="voicemail">Voicemail</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Sentiment</label>
              <select
                value={filters.sentiment}
                onChange={(e) => setFilters(f => ({ ...f, sentiment: e.target.value }))}
                className="w-full px-3 py-2 bg-[#1a1b18] border border-[#3a3d32] rounded-lg text-white focus:outline-none focus:border-[#e7f69e] appearance-none"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => setFilters({ dateRange: 'all', outcome: 'all', sentiment: 'all' })}
              className="text-sm text-[#e7f69e] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Calls Table */}
      <div className="bg-[#262720] border border-[#474b37] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#e7f69e]/30 border-t-[#e7f69e] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading calls...</p>
          </div>
        ) : calls.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a3d32]">
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/50">Caller</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/50">Outcome</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/50 hidden md:table-cell">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/50 hidden lg:table-cell">Sentiment</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/50">Time</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3d32]">
                  {calls.map((call) => (
                    <tr 
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className="hover:bg-[#2d3127] cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center group-hover:border-[#474b37] transition-colors">
                            <PhoneIcon className="w-5 h-5 text-[#e7f69e]/70" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {call.caller_name || 'Unknown Caller'}
                            </div>
                            <div className="text-xs text-white/50">
                              {call.from_number || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#e7f69e]/10 text-[#e7f69e] border border-[#e7f69e]/20">
                          {call.outcome ? getOutcomeLabel(call.outcome) : 'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70 hidden md:table-cell">
                        {call.duration_ms ? formatDuration(call.duration_ms) : '-'}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className={`text-sm capitalize ${getSentimentColor(call.sentiment || 'neutral')}`}>
                          {call.sentiment || 'Neutral'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50">
                        {getRelativeTime(call.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="p-4 text-center">
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 text-white/50">
                  <div className="w-4 h-4 border-2 border-[#e7f69e]/30 border-t-[#e7f69e] rounded-full animate-spin" />
                  Loading more...
                </div>
              )}
              {!hasMore && calls.length > PAGE_SIZE && (
                <p className="text-sm text-white/30">You've reached the end</p>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1b18] border border-[#3a3d32] flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="w-8 h-8 text-[#e7f69e]" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-2">No calls found</h3>
            <p className="text-white/50">
              {debouncedSearch || activeFiltersCount > 0 
                ? 'Try adjusting your search or filters'
                : 'Calls will appear here once your agents start handling them'}
            </p>
          </div>
        )}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]/80 backdrop-blur-sm" 
          onClick={() => setSelectedCall(null)}
        >
          <div 
            className="w-full max-w-2xl bg-[#1a1b18] border border-[#474b37] rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#3a3d32]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#262720] border border-[#474b37] flex items-center justify-center">
                  <PhoneIcon className="w-5 h-5 text-[#e7f69e]" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white">
                    {selectedCall.caller_name || 'Unknown Caller'}
                  </h2>
                  <p className="text-sm text-white/50">{selectedCall.from_number || 'No number'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCall(null)} 
                className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#262720] border border-[#3a3d32]">
                  <div className="text-xs text-white/50 mb-1">Duration</div>
                  <div className="text-white font-medium">
                    {selectedCall.duration_ms ? formatDuration(selectedCall.duration_ms) : '-'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#262720] border border-[#3a3d32]">
                  <div className="text-xs text-white/50 mb-1">Outcome</div>
                  <div className="text-[#e7f69e] font-medium">
                    {selectedCall.outcome ? getOutcomeLabel(selectedCall.outcome) : 'Completed'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#262720] border border-[#3a3d32]">
                  <div className="text-xs text-white/50 mb-1">Sentiment</div>
                  <div className={`font-medium capitalize ${getSentimentColor(selectedCall.sentiment || 'neutral')}`}>
                    {selectedCall.sentiment || 'Neutral'}
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              {selectedCall.summary && (
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Call Summary</h3>
                  <div className="p-4 rounded-xl bg-[#262720] border border-[#3a3d32] text-white/80 text-sm leading-relaxed">
                    {selectedCall.summary}
                  </div>
                </div>
              )}

              {/* Recording Player */}
              {selectedCall.recording_url && (
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Recording</h3>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[#262720] border border-[#474b37]">
                    <button 
                      onClick={() => togglePlayback(selectedCall.recording_url!)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-[#e7f69e] text-[#1a1b18] hover:bg-[#d4e38c] transition-colors"
                    >
                      {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-[#3a3d32] rounded-full overflow-hidden">
                        <div className="h-full bg-[#e7f69e] w-0" />
                      </div>
                    </div>
                    <VolumeIcon className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
