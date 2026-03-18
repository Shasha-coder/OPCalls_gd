'use client'

const FEATURES = [
  {
    icon: 'phone',
    title: 'Erase Personal Numbers For Business',
    description: 'Instant Local, Toll-Free, Or International Numbers—No IT Needed. Port Existing Ones Easily.',
    color: '#3366FF',
  },
  {
    icon: 'message',
    title: 'Effortless Communication in All Channels',
    description: 'Effortlessly Handle Calls and Messages, Keeping Teams and Customers Connected.',
    color: '#3366FF',
  },
  {
    icon: 'audio',
    title: 'Unmatched Clarity in Every Conversation',
    description: 'Crystal-Clear Audio for Productive, Professional and Smooth Conversations - Always.',
    color: '#3366FF',
  },
  {
    icon: 'tap',
    title: 'Manage Everything With A Single Tap',
    description: 'Manage Calls, Teams, and Business Lines Effortlessly With Key Features at Your Fingertips.',
    color: '#3366FF',
  },
]

const ICONS: Record<string, JSX.Element> = {
  phone: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  tap: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M5.5 12.5L12 6l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
}

export function FeatureCards() {
  return (
    <div className="space-y-4">
      {FEATURES.map((feature, index) => (
        <div
          key={index}
          className="feature-item feature-card flex items-start gap-4 max-w-[280px]"
        >
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ backgroundColor: feature.color }}
          >
            {ICONS[feature.icon]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-[#1E3A5F] leading-tight mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-[#5A6B7D] leading-relaxed">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
