/**
 * Business Hours Step - Matching Landing Page Design
 */

'use client'

import { useState } from 'react'

type DaySchedule = {
  open: string
  close: string
  enabled: boolean
}

type BusinessHours = Record<string, DaySchedule>

interface Props {
  data?: BusinessHours
  onComplete: (data: BusinessHours) => void
  onBack: () => void
  saving: boolean
}

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

const DEFAULT_HOURS: BusinessHours = {
  mon: { open: '09:00', close: '17:00', enabled: true },
  tue: { open: '09:00', close: '17:00', enabled: true },
  wed: { open: '09:00', close: '17:00', enabled: true },
  thu: { open: '09:00', close: '17:00', enabled: true },
  fri: { open: '09:00', close: '17:00', enabled: true },
  sat: { open: '09:00', close: '13:00', enabled: false },
  sun: { open: '09:00', close: '13:00', enabled: false },
}

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = (i % 2) * 30
  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
  return { value: time, label }
})

export function BusinessHoursStep({ data, onComplete, onBack, saving }: Props) {
  const [hours, setHours] = useState<BusinessHours>(data || DEFAULT_HOURS)
  
  const toggleDay = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }))
  }
  
  const updateTime = (day: string, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete(hours)
  }
  
  const applyToAll = (sourceDay: string) => {
    const source = hours[sourceDay]
    setHours(prev => {
      const updated = { ...prev }
      DAYS.forEach(d => {
        if (prev[d.key].enabled) {
          updated[d.key] = { ...source, enabled: true }
        }
      })
      return updated
    })
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-white/50 text-sm mb-6">
        Set your business hours so your AI knows when to offer appointments and when to take messages.
      </p>
      
      <div className="space-y-2">
        {DAYS.map(day => (
          <div
            key={day.key}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              hours[day.key]?.enabled
                ? 'bg-white/5 border-white/10'
                : 'bg-white/[0.02] border-white/5'
            }`}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => toggleDay(day.key)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                hours[day.key]?.enabled ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                  hours[day.key]?.enabled ? 'left-6 bg-gray-900' : 'left-1 bg-white/60'
                }`}
              />
            </button>
            
            {/* Day Label */}
            <span className={`w-24 font-medium text-sm ${
              hours[day.key]?.enabled ? 'text-white' : 'text-white/30'
            }`}>
              {day.label}
            </span>
            
            {/* Time Selectors */}
            {hours[day.key]?.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={hours[day.key].open}
                  onChange={(e) => updateTime(day.key, 'open', e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{ colorScheme: 'dark' }}
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t.value} value={t.value} className="bg-[#0a0a0a]">{t.label}</option>
                  ))}
                </select>
                
                <span className="text-white/40">to</span>
                
                <select
                  value={hours[day.key].close}
                  onChange={(e) => updateTime(day.key, 'close', e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{ colorScheme: 'dark' }}
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t.value} value={t.value} className="bg-[#0a0a0a]">{t.label}</option>
                  ))}
                </select>
                
                {/* Apply to All */}
                {day.key === 'mon' && (
                  <button
                    type="button"
                    onClick={() => applyToAll('mon')}
                    className="ml-auto text-xs text-white/50 hover:text-white transition-colors"
                  >
                    Apply to all
                  </button>
                )}
              </div>
            ) : (
              <span className="text-white/30 text-sm">Closed</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3.5 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full" />
              Saving...
            </span>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </form>
  )
}
