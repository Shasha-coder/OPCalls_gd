'use client'

import { useEffect, useRef } from 'react'

export default function AgentPresetsCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationFrameId: number

    const scroll = () => {
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 20) {
        container.scrollLeft = 0
      } else {
        container.scrollLeft += 0.5
      }
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const presets = [
    { name: 'Customer Support', desc: 'Handle inquiries & support', icon: '💬' },
    { name: 'Sales Assistant', desc: 'Qualify leads & close deals', icon: '📊' },
    { name: 'Appointment Booking', desc: 'Schedule & manage bookings', icon: '📅' },
    { name: 'Lead Generation', desc: 'Capture and qualify leads', icon: '🎯' },
    { name: 'Technical Support', desc: 'IT troubleshooting & help', icon: '🔧' },
    { name: 'Order Management', desc: 'Process & track orders', icon: '📦' },
    { name: 'Survey Agent', desc: 'Collect customer feedback', icon: '📝' },
    { name: 'HR Assistant', desc: 'Employee inquiries & help', icon: '👥' },
  ]

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {presets.map((preset, idx) => (
          <div key={idx} className="flex-shrink-0 w-80">
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <div className="text-3xl mb-3">{preset.icon}</div>
              <h3 className="font-semibold text-gray-900 text-base mb-1">{preset.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{preset.desc}</p>
              <button className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors">
                Use template →
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  )
}
