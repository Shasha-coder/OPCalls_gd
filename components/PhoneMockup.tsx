'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'

const AGENT_PRESETS = [
  { id: 1, name: 'Sales Closer', desc: 'Convert leads into customers', icon: 'target', color: '#EF4444', category: 'Sales' },
  { id: 2, name: 'Lead Qualifier', desc: 'Pre-qualify leads automatically', icon: 'filter', color: '#F59E0B', category: 'Sales' },
  { id: 3, name: 'Follow-up Agent', desc: 'Intelligent follow-up sequences', icon: 'repeat', color: '#8B5CF6', category: 'Nurture' },
  { id: 4, name: 'Real Estate', desc: 'Property inquiries & viewings', icon: 'home', color: '#10B981', category: 'Industry' },
  { id: 5, name: 'HVAC Dispatch', desc: 'Book service appointments 24/7', icon: 'thermometer', color: '#3B82F6', category: 'Industry' },
  { id: 6, name: 'Customer Support', desc: 'Handle inquiries & issues', icon: 'headphones', color: '#14B8A6', category: 'Support' },
  { id: 7, name: 'Appointment', desc: 'Schedule with calendar sync', icon: 'calendar', color: '#F97316', category: 'Booking' },
  { id: 8, name: 'Missed Call', desc: 'Recover missed opportunities', icon: 'phone-missed', color: '#EC4899', category: 'Recovery' },
]

const ICONS: Record<string, JSX.Element> = {
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  repeat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  thermometer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  headphones: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  'phone-missed': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="23" y1="1" x2="17" y2="7"/><line x1="17" y1="1" x2="23" y2="7"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
}

export function PhoneMockup() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const animationRef = useRef<number>()

  // Auto-scroll animation
  useEffect(() => {
    const container = scrollRef.current
    if (!container || !isAutoScrolling) return

    let scrollPos = 0
    const speed = 0.5

    const animate = () => {
      if (!isAutoScrolling) return
      scrollPos += speed
      if (scrollPos >= container.scrollHeight / 2) {
        scrollPos = 0
      }
      container.scrollTop = scrollPos
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isAutoScrolling])

  // Touch/Mouse handlers for manual scroll
  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true)
    setIsAutoScrolling(false)
    setStartY(clientY)
    setScrollTop(scrollRef.current?.scrollTop || 0)
  }, [])

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging || !scrollRef.current) return
    const diff = startY - clientY
    scrollRef.current.scrollTop = scrollTop + diff
  }, [isDragging, startY, scrollTop])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
    // Resume auto-scroll after 3 seconds of inactivity
    setTimeout(() => setIsAutoScrolling(true), 3000)
  }, [])

  const handlePresetClick = (preset: typeof AGENT_PRESETS[0]) => {
    setActivePreset(preset.id)
    setIsAutoScrolling(false)
    
    // Animate selection
    gsap.to(`#preset-${preset.id}`, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
    })

    // Trigger demo call modal would go here
    console.log('Trigger call for:', preset.name)
    
    setTimeout(() => {
      setActivePreset(null)
      setIsAutoScrolling(true)
    }, 2000)
  }

  // Double the presets for infinite scroll effect
  const doubledPresets = [...AGENT_PRESETS, ...AGENT_PRESETS]

  return (
    <div className="phone-frame w-full max-w-[280px] mx-auto">
      <div className="phone-screen relative" style={{ aspectRatio: '9/19.5' }}>
        {/* Notch */}
        <div className="phone-notch" />
        
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-12 flex items-end justify-between px-6 pb-1 z-20">
          <span className="text-xs font-semibold text-[#1E3A5F]">9:41</span>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-[#1E3A5F]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/>
            </svg>
            <svg className="w-6 h-3 text-[#1E3A5F]" fill="currentColor" viewBox="0 0 24 12">
              <rect x="0" y="0" width="22" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1"/>
              <rect x="2" y="2" width="16" height="8" rx="1"/>
              <rect x="22" y="4" width="2" height="4" rx="0.5"/>
            </svg>
          </div>
        </div>

        {/* App Header */}
        <div className="absolute top-12 left-0 right-0 px-4 py-3 flex items-center justify-between z-10 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3366FF] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-sm text-[#1E3A5F]">OPCalls</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-[#1E3A5F]" />
            <div className="w-1 h-1 rounded-full bg-[#1E3A5F]" />
          </div>
        </div>

        {/* Scrollable Presets */}
        <div
          ref={scrollRef}
          className="absolute top-24 bottom-0 left-0 right-0 overflow-y-auto hide-scrollbar px-3 pb-4"
          onMouseDown={(e) => handleStart(e.clientY)}
          onMouseMove={(e) => handleMove(e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientY)}
          onTouchEnd={handleEnd}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="space-y-3 pt-2">
            {doubledPresets.map((preset, index) => (
              <div
                key={`${preset.id}-${index}`}
                id={`preset-${preset.id}`}
                onClick={() => handlePresetClick(preset)}
                className={`preset-card transition-all duration-200 ${
                  activePreset === preset.id ? 'active ring-2 ring-[#3366FF]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${preset.color}15`, color: preset.color }}
                  >
                    {ICONS[preset.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm text-[#1E3A5F] truncate">{preset.name}</h3>
                      <span 
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${preset.color}15`, color: preset.color }}
                      >
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A6B7D] mt-0.5 truncate">{preset.desc}</p>
                    <button 
                      className="mt-2 text-xs font-semibold text-[#3366FF] flex items-center gap-1 hover:gap-2 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePresetClick(preset)
                      }}
                    >
                      Try Now
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
        
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#1E3A5F] rounded-full opacity-20 z-20" />
      </div>
    </div>
  )
}
