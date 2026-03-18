'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'

const DEFAULT_PRESETS = [
  { id: 1, name: 'Sales Closer', desc: 'Convert leads into paying customers', category: 'Sales', color: '#EF4444', icon: 'target' },
  { id: 2, name: 'Lead Qualifier', desc: 'Pre-qualify leads automatically', category: 'Sales', color: '#F59E0B', icon: 'filter' },
  { id: 3, name: 'Follow-up Agent', desc: 'Smart follow-up sequences', category: 'Nurture', color: '#8B5CF6', icon: 'repeat' },
  { id: 4, name: 'Real Estate', desc: 'Property inquiries & viewings', category: 'Industry', color: '#10B981', icon: 'home' },
  { id: 5, name: 'HVAC Dispatch', desc: 'Book service appointments 24/7', category: 'Industry', color: '#3B82F6', icon: 'wrench' },
  { id: 6, name: 'Customer Support', desc: 'Handle inquiries & issues', category: 'Support', color: '#14B8A6', icon: 'headset' },
  { id: 7, name: 'Appointment', desc: 'Schedule with calendar sync', category: 'Booking', color: '#F97316', icon: 'calendar' },
  { id: 8, name: 'Missed Call', desc: 'Recover missed opportunities', category: 'Recovery', color: '#EC4899', icon: 'phone-missed' },
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

  useEffect(() => {
    const container = scrollRef.current
    if (!container || !isAutoScrolling) return

    let scrollPos = container.scrollTop

    const animate = () => {
      if (!isAutoScrolling) return
      scrollPos += 0.5
      
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
    resumeTimeoutRef.current = setTimeout(() => setIsAutoScrolling(true), 3000)
  }, [])

  const handlePresetClick = (preset: typeof DEFAULT_PRESETS[0]) => {
    setActivePreset(preset.id)
    setIsAutoScrolling(false)
    
    gsap.to(`#preset-${preset.id}`, {
      scale: 0.96,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    })
    
    setTimeout(() => {
      setActivePreset(null)
      setIsAutoScrolling(true)
    }, 2500)
  }

  const doubledPresets = [...DEFAULT_PRESETS, ...DEFAULT_PRESETS]

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-white overflow-hidden relative flex flex-col">
      {/* Status Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-12 pb-2">
        <span className="text-[11px] font-semibold text-gray-800">9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3C6.95 3 3 6.95 3 12s3.95 9 9 9c.35 0 .7-.02 1.05-.07C8.52 20.13 5 16.47 5 12s3.52-8.13 8.05-8.93C12.7 3.02 12.35 3 12 3z"/>
          </svg>
          <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
          </svg>
          <div className="w-6 h-3 rounded-sm border border-gray-800 flex items-center p-0.5">
            <div className="w-4 h-full bg-gray-800 rounded-sm"/>
          </div>
        </div>
      </div>

      {/* App Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-sm text-gray-900">OPCalls</h1>
            <p className="text-[10px] text-gray-500">AI Voice Agents</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Section Title */}
      <div className="flex-shrink-0 px-4 py-2">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Agent Presets</h2>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-20"
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
              id={`preset-${preset.id}`}
              onClick={() => handlePresetClick(preset)}
              className={`
                rounded-2xl p-3.5 transition-all duration-200 cursor-pointer
                ${activePreset === preset.id 
                  ? 'bg-gray-900 shadow-xl scale-[0.98]' 
                  : 'bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    activePreset === preset.id ? 'bg-white/20' : ''
                  }`}
                  style={{ backgroundColor: activePreset === preset.id ? undefined : `${preset.color}15` }}
                >
                  <PresetIcon type={preset.icon} color={activePreset === preset.id ? '#fff' : preset.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className={`font-semibold text-[12px] truncate ${activePreset === preset.id ? 'text-white' : 'text-gray-900'}`}>
                      {preset.name}
                    </h3>
                    <span 
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: activePreset === preset.id ? 'rgba(255,255,255,0.2)' : `${preset.color}15`, 
                        color: activePreset === preset.id ? '#fff' : preset.color 
                      }}
                    >
                      {preset.category}
                    </span>
                  </div>
                  <p className={`text-[10px] truncate ${activePreset === preset.id ? 'text-white/70' : 'text-gray-500'}`}>
                    {preset.desc}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activePreset === preset.id ? 'bg-white' : 'bg-gray-100'
                }`}>
                  {activePreset === preset.id ? (
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  )}
                </div>
              </div>
              {activePreset === preset.id && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">Connecting...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
      
      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full" />
    </div>
  )
}

function PresetIcon({ type, color }: { type: string; color: string }) {
  const icons: Record<string, JSX.Element> = {
    target: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    filter: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
      </svg>
    ),
    repeat: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
      </svg>
    ),
    wrench: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    headset: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    'phone-missed': (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={color} strokeWidth="2">
        <path d="M22 2L16 8M16 2l6 6"/><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
  }
  return icons[type] || icons.target
}
