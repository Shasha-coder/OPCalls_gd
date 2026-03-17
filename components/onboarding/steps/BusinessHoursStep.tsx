/**
 * Business Hours Step
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-slate-400 mb-6">
        Set your business hours so your AI knows when to offer appointments and when to take messages.
      </p>
      
      <div className="space-y-3">
        {DAYS.map(day => (
          <div
            key={day.key}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
              hours[day.key]?.enabled
                ? 'bg-slate-800/50 border-slate-600'
                : 'bg-slate-900/30 border-slate-700'
            }`}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => toggleDay(day.key)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                hours[day.key]?.enabled ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  hours[day.key]?.enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
            
            {/* Day Label */}
            <span className={`w-24 font-medium ${
              hours[day.key]?.enabled ? 'text-white' : 'text-slate-500'
            }`}>
              {day.label}
            </span>
            
            {/* Time Selectors */}
            {hours[day.key]?.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={hours[day.key].open}
                  onChange={(e) => updateTime(day.key, 'open', e.target.value)}
                  className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                
                <span className="text-slate-400">to</span>
                
                <select
                  value={hours[day.key].close}
                  onChange={(e) => updateTime(day.key, 'close', e.target.value)}
                  className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                
                {/* Apply to All */}
                {day.key === 'mon' && (
                  <button
                    type="button"
                    onClick={() => applyToAll('mon')}
                    className="ml-auto text-sm text-blue-400 hover:text-blue-300"
                  >
                    Apply to all
                  </button>
                )}
              </div>
            ) : (
              <span className="text-slate-500 text-sm">Closed</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </form>
  )
}
