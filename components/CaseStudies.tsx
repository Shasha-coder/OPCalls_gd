'use client'

import { useEffect, useRef, useState } from 'react'

// Case studies with emojis - matching your design reference
const caseStudies = [
  {
    company: 'Sunshine Dental Group',
    emoji: '🦷',
    metric: '+45%',
    metricLabel: 'Bookings in 30 Days',
    description: 'Dr. Sarah Chen transformed her practice by implementing our AI receptionist. Now handling 200+ calls daily with zero missed appointments.',
    testimonial: {
      quote: 'Our patients love the instant response. It feels like having 10 receptionists working 24/7.',
      author: 'Dr. Sarah Chen',
      role: 'Owner & Lead Dentist',
    },
    since: 'Customer since 2024',
  },
  {
    company: 'Radiance Med Spa',
    emoji: '✨',
    metric: '+110%',
    metricLabel: 'Conversion Rate on After-Hours Calls',
    description: 'By capturing after-hours inquiries that used to go to voicemail, Radiance Med Spa doubled their new client acquisitions.',
    testimonial: {
      quote: 'We were losing $50K+ monthly in missed after-hours leads. OPCalls changed everything.',
      author: 'Lisa Martinez',
      role: 'Director of Operations',
    },
    since: 'Customer since 2024',
  },
  {
    company: 'Premier Auto Service',
    emoji: '🚗',
    metric: '40%',
    metricLabel: 'Reduction in Front Desk Staff Costs',
    description: 'Premier Auto now handles 3x the call volume with the same team, freeing staff to focus on in-person customer service.',
    testimonial: {
      quote: 'The AI handles routine calls perfectly. My team can focus on what matters - the cars in our shop.',
      author: 'Mike Thompson',
      role: 'General Manager',
    },
    since: 'Customer since 2024',
  },
]

export default function CaseStudies() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="case-studies" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-dark overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#e8fb76]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#e8fb76]/10 border border-[#e8fb76]/20 text-[#e8fb76] text-sm font-medium mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Discover Deep Insights &<br />Groundbreaking Case Studies
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Learn how businesses like yours are transforming their operations with AI voice agents.
          </p>
        </div>

        {/* Company Selector */}
        <div className={`flex flex-wrap justify-center gap-4 mb-12 transition-all duration-700 ease-out delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {caseStudies.map((study, index) => (
            <button
              key={study.company}
              onClick={() => setActiveIndex(index)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 ${
                activeIndex === index
                  ? 'bg-[#1a1a1a] border-[#e8fb76]/30'
                  : 'bg-[#0a0a0a] border-white/5 hover:border-white/10'
              }`}
            >
              {/* Emoji on lime background */}
              <div className="w-10 h-10 rounded-xl bg-[#e8fb76] flex items-center justify-center text-xl">
                {study.emoji}
              </div>
              <div className="text-left">
                <div className="font-medium text-white">{study.company}</div>
                <div className="text-white/40 text-xs">{study.since}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Case Study */}
        <div className={`transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Stats Card */}
            <div className="bg-[#141414] rounded-3xl border border-white/10 p-8 lg:p-10">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#e8fb76] flex items-center justify-center text-2xl">
                  {caseStudies[activeIndex].emoji}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{caseStudies[activeIndex].company}</h3>
                  <p className="text-white/50">{caseStudies[activeIndex].since}</p>
                </div>
              </div>

              {/* Metric */}
              <div className="mb-8">
                <div className="text-5xl lg:text-6xl font-display font-bold text-[#e8fb76] mb-2">
                  {caseStudies[activeIndex].metric}
                </div>
                <div className="text-white/60 text-lg">
                  {caseStudies[activeIndex].metricLabel}
                </div>
              </div>

              <p className="text-white/70 leading-relaxed">
                {caseStudies[activeIndex].description}
              </p>
            </div>

            {/* Testimonial Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] rounded-3xl border border-white/10 p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className="text-4xl text-[#e8fb76]/30 mb-4">"</div>
                <blockquote className="text-xl lg:text-2xl text-white/90 font-light leading-relaxed mb-8">
                  {caseStudies[activeIndex].testimonial.quote}
                </blockquote>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e8fb76]/30 to-[#6c743f]/30 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {caseStudies[activeIndex].testimonial.author[0]}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-white">{caseStudies[activeIndex].testimonial.author}</div>
                  <div className="text-white/50 text-sm">{caseStudies[activeIndex].testimonial.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 transition-all duration-700 ease-out delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white font-medium rounded-full border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            Check Case Study
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
