'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  gradient?: string
  index?: number
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon, 
  gradient = 'from-lime-200 to-olive',
  index = 0 
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Card entrance
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.6, 
          delay: index * 0.1,
          ease: 'power3.out'
        }
      )

      // Icon pulse animation
      gsap.to(iconRef.current, {
        scale: 1.1,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      })

      // Value counter animation
      if (valueRef.current && typeof value === 'number') {
        const obj = { val: 0 }
        gsap.to(obj, {
          val: value,
          duration: 1.5,
          delay: index * 0.1 + 0.3,
          ease: 'power2.out',
          onUpdate: () => {
            if (valueRef.current) {
              valueRef.current.textContent = Math.round(obj.val).toLocaleString()
            }
          },
        })
      }
    })

    return () => ctx.revert()
  }, [index, value])

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-6 backdrop-blur-xl group hover:border-lime-200/20 transition-all duration-300"
    >
      {/* Background glow */}
      <div className={cn(
        'absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity',
        `bg-gradient-to-br ${gradient}`
      )} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-white/60">{title}</span>
          <div
            ref={iconRef}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              `bg-gradient-to-br ${gradient}`
            )}
          >
            <div className="text-dark">
              {icon}
            </div>
          </div>
        </div>

        {/* Value */}
        <div
          ref={valueRef}
          className="text-3xl font-display font-bold text-white mb-2"
        >
          {typeof value === 'number' ? '0' : value}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              change >= 0 ? 'text-lime-200' : 'text-red-400'
            )}>
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{change >= 0 ? '+' : ''}{change}%</span>
            </div>
            {changeLabel && (
              <span className="text-xs text-white/40">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
