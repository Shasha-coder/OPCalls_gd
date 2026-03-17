'use client'

import { useRef, useEffect, useState } from 'react'
import { Phone, BarChart2, Clock, Zap, MoreVertical, Play, Pause, Settings, Trash2 } from 'lucide-react'
import gsap from 'gsap'
import { cn, formatNumber, formatMinutes, getStatusColor } from '@/lib/utils'
import type { Agent } from '@/types/database'

interface AgentCardProps {
  agent: Agent
  onEdit?: (agent: Agent) => void
  onDelete?: (agent: Agent) => void
  onToggleStatus?: (agent: Agent) => void
  index?: number
}

export function AgentCard({ agent, onEdit, onDelete, onToggleStatus, index = 0 }: AgentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 40,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: index * 0.1,
          ease: 'power3.out',
        }
      )
    }
  }, [index])

  // Hover glow effect
  useEffect(() => {
    if (!cardRef.current || !glowRef.current) return

    const card = cardRef.current
    const glow = glowRef.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      gsap.to(glow, {
        x: x - 100,
        y: y - 100,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    const handleMouseEnter = () => {
      gsap.to(glow, { opacity: 1, duration: 0.3 })
      gsap.to(card, {
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(glow, { opacity: 0, duration: 0.3 })
      gsap.to(card, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const conversionRate = agent.total_calls > 0 
    ? ((agent.total_bookings / agent.total_calls) * 100).toFixed(1)
    : '0'

  return (
    <div
      ref={cardRef}
      className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 backdrop-blur-xl"
    >
      {/* Animated glow effect */}
      <div
        ref={glowRef}
        className="absolute w-[200px] h-[200px] rounded-full bg-lime-200/20 blur-[80px] pointer-events-none opacity-0"
      />

      {/* Card content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Agent avatar with animated gradient border */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-lime-200 via-olive to-lime-200 rounded-2xl opacity-60 blur-sm group-hover:opacity-100 transition-opacity animate-[spin_8s_linear_infinite]" />
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-lime-200 to-olive flex items-center justify-center">
                <Phone className="w-6 h-6 text-dark" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-white group-hover:text-lime-200 transition-colors">
                {agent.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                  getStatusColor(agent.is_active ? 'active' : 'inactive')
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    agent.is_active ? 'bg-lime-200 animate-pulse' : 'bg-white/40'
                  )} />
                  {agent.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-white/50 capitalize">{agent.type}</span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white/50" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-dark-50 border border-white/10 rounded-xl shadow-xl z-10">
                <button
                  onClick={() => { onToggleStatus?.(agent); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {agent.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {agent.is_active ? 'Pause Agent' : 'Activate Agent'}
                </button>
                <button
                  onClick={() => { onEdit?.(agent); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Edit Settings
                </button>
                <button
                  onClick={() => { onDelete?.(agent); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Agent
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
              <Phone className="w-3.5 h-3.5" />
              <span>Total Calls</span>
            </div>
            <div className="text-2xl font-display font-bold text-white">
              {formatNumber(agent.total_calls)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Minutes</span>
            </div>
            <div className="text-2xl font-display font-bold text-white">
              {formatMinutes(agent.total_minutes)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Conversion</span>
            </div>
            <div className="text-2xl font-display font-bold text-lime-200">
              {conversionRate}%
            </div>
          </div>
        </div>

        {/* Languages & Industry */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            {agent.languages?.slice(0, 3).map((lang) => (
              <span key={lang} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/60">
                {lang.toUpperCase()}
              </span>
            ))}
            {agent.languages?.length > 3 && (
              <span className="text-xs text-white/40">+{agent.languages.length - 3}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Zap className="w-3.5 h-3.5 text-lime-200" />
            <span className="capitalize">{agent.industry}</span>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-lime-200 via-olive to-lime-200 opacity-50 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
