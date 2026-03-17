import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-lime-200/20 text-lime-200 border-lime-200/30',
    inactive: 'bg-white/10 text-white/60 border-white/20',
    training: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    paused: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    completed: 'bg-lime-200/20 text-lime-200 border-lime-200/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] || colors.inactive
}

export function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    positive: 'text-lime-200',
    neutral: 'text-white/60',
    negative: 'text-red-400',
  }
  return colors[sentiment] || colors.neutral
}

export function getOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    booked: 'Appointment Booked',
    answered: 'Question Answered',
    callback: 'Callback Scheduled',
    transferred: 'Transferred',
    no_action: 'No Action',
    voicemail: 'Voicemail',
  }
  return labels[outcome] || outcome
}

export function generateGradient(): string {
  const gradients = [
    'from-lime-200 to-olive',
    'from-lime-200 to-lime-300',
    'from-olive to-lime-200',
    'from-lime-300 to-olive',
    'from-emerald-400 to-lime-200',
    'from-lime-200 to-teal-400',
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
}
