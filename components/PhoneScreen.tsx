'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'

// Agent presets that will be manageable from admin
const DEFAULT_PRESETS = [
  { id: 1, name: 'Sales Closer', desc: 'Convert leads into paying customers', category: 'Sales', color: '#EF4444' },
  { id: 2, name: 'Lead Qualifier', desc: 'Pre-qualify leads automatically', category: 'Sales', color: '#F59E0B' },
  { id: 3, name: 'Follow-up Agent', desc: 'Smart follow-up sequences', category: 'Nurture', color: '#8B5CF6' },
  { id: 4, name: 'Real Estate', desc: 'Property inquiries & viewings', category: 'Industry', color: '#10B981' },
  { id: 5, name: 'HVAC Dispatch', desc: 'Book service appointments 24/7', category: 'Industry', color: '#3B82F6' },
  { id: 6, name: 'Customer Support', desc: 'Handle inquiries & issues', category: 'Support', color: '#14B8A6' },
  { id: 7, name: 'Appointment', desc: 'Schedule with calendar sync', category: 'Booking', color: '#F97316' },
  { id: 8, name: 'Missed Call', desc: 'Recover missed opportunities', category: 'Recovery', color: '#EC4899' },
]

export function PhoneScreen() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const animationRef = useRef<number>()
  const resumeTimeoutRef = useRef<NodeJS.Timeout>()

  // Smooth auto-scroll animation using GSAP
  useEffect(() => {
    const container = scrollRef.current
    if (!container || !isAutoScrolling) return

    let scrollPos = container.scrollTop

    const animate = () => {
      if (!isAutoScrolling) return
      scrollPos += 0.4
      
      // Reset when reaching halfway (for infinite effect)
      if (scrollPos >= container.scrollHeight / 2) {
        scrollPos = 0
        container.scrollTop = 0
      } else {
        container.scrollTop = scrollPos
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isAutoScrolling])

  // Touch/Mouse handlers
  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true)
    setIsAutoScrolling(false)
    setStartY(clientY)
    setScrollTop(scrollRef.current?.scrollTop || 0)
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
  }, [])

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging || !scrollRef.current) return
    const diff = startY - clientY
    scrollRef.current.scrollTop = scrollTop + diff
  }, [isDragging, startY, scrollTop])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
    resumeTimeoutRef.current = setTimeout(() => setIsAutoScrolling(true), 4000)
  }, [])

  const handlePresetClick = (preset: typeof DEFAULT_PRESETS[0]) => {
    setActivePreset(preset.id)
    setIsAutoScrolling(false)
    
    gsap.to(`#phone-preset-${preset.id}`, {
      scale: 0.97,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
    })

    // Here you would trigger the actual call demo
    console.log('Demo call for:', preset.name)
    
    setTimeout(() => {
      setActivePreset(null)
      setIsAutoScrolling(true)
    }, 2000)
  }

  const doubledPresets = [...DEFAULT_PRESETS, ...DEFAULT_PRESETS]

  return (
    <div className="w-full h-full bg-white rounded-[24px] overflow-hidden shadow-inner relative">
      {/* App Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3366FF] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <span className="font-semibold text-xs text-[#1E3A5F]">OPCalls</span>
          </div>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-[#1E3A5F]" />
            <div className="w-1 h-1 rounded-full bg-[#1E3A5F]" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="absolute inset-0 pt-14 pb-4 px-3 overflow-y-auto hide-scrollbar"
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => handleMove(e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="space-y-2.5">
          {doubledPresets.map((preset, idx) => (
            <div
              key={`${preset.id}-${idx}`}
              id={`phone-preset-${preset.id}`}
              onClick={() => handlePresetClick(preset)}
              className={`
                bg-white rounded-xl p-3 border transition-all duration-200 cursor-pointer
                ${activePreset === preset.id 
                  ? 'border-[#3366FF] shadow-lg ring-2 ring-[#3366FF]/20' 
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-start gap-2.5">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${preset.color}15` }}
                >
                  <PresetIcon color={preset.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-[11px] text-[#1E3A5F] truncate">{preset.name}</h3>
                    <span 
                      className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${preset.color}15`, color: preset.color }}
                    >
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#5A6B7D] mt-0.5 truncate">{preset.desc}</p>
                  <button 
                    className="mt-1.5 text-[9px] font-semibold text-[#3366FF] flex items-center gap-0.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePresetClick(preset)
                    }}
                  >
                    Try Demo Call
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
    </div>
  )
}

function PresetIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" style={{ color }}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
