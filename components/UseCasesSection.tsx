'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const USE_CASES = [
  {
    id: 'sales',
    title: 'Sales Teams',
    subtitle: 'Close more deals, faster',
    description: 'Qualify leads automatically, schedule demos, and follow up with prospects 24/7. Never miss a hot lead again.',
    stats: [
      { value: '3x', label: 'Lead Response Rate' },
      { value: '45%', label: 'Increase in Demos' },
    ],
    color: '#3366FF',
  },
  {
    id: 'realestate',
    title: 'Real Estate',
    subtitle: 'Property inquiries handled',
    description: 'Answer property questions, schedule viewings, and pre-qualify buyers around the clock.',
    stats: [
      { value: '24/7', label: 'Availability' },
      { value: '60%', label: 'More Viewings' },
    ],
    color: '#10B981',
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    subtitle: 'Patient care simplified',
    description: 'Schedule appointments, handle prescription refills, and provide after-hours support.',
    stats: [
      { value: '80%', label: 'Call Resolution' },
      { value: '50%', label: 'Staff Time Saved' },
    ],
    color: '#8B5CF6',
  },
  {
    id: 'services',
    title: 'Home Services',
    subtitle: 'Book jobs automatically',
    description: 'HVAC, plumbing, electrical—capture every service call and dispatch techs instantly.',
    stats: [
      { value: '2x', label: 'Booking Rate' },
      { value: '35%', label: 'Revenue Growth' },
    ],
    color: '#F59E0B',
  },
]

export default function UseCasesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeCase, setActiveCase] = useState(USE_CASES[0].id)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.use-case-card',
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const activeData = USE_CASES.find((c) => c.id === activeCase) || USE_CASES[0]

  return (
    <section ref={sectionRef} id="solutions" className="py-24 bg-[#F5F3EF]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-[#1E3A5F]/10 text-[#1E3A5F] text-xs font-semibold rounded-full mb-4">
            USE CASES
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E3A5F] mb-4">
            Built for every industry
          </h2>
          <p className="text-[#5A6B7D] text-lg max-w-2xl mx-auto">
            From sales to healthcare, our AI voice agents adapt to your specific business needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-start">
          {/* Use Case Tabs */}
          <div className="space-y-3">
            {USE_CASES.map((useCase) => (
              <button
                key={useCase.id}
                onClick={() => setActiveCase(useCase.id)}
                className={`use-case-card w-full text-left p-5 rounded-2xl transition-all duration-300 ${
                  activeCase === useCase.id
                    ? 'bg-white shadow-lg border-l-4'
                    : 'bg-white/50 hover:bg-white'
                }`}
                style={{
                  borderLeftColor: activeCase === useCase.id ? useCase.color : 'transparent',
                }}
              >
                <h3 className="font-display font-semibold text-lg text-[#1E3A5F] mb-1">
                  {useCase.title}
                </h3>
                <p className="text-sm text-[#5A6B7D]">{useCase.subtitle}</p>
              </button>
            ))}
          </div>

          {/* Active Case Detail */}
          <div 
            className="bg-white rounded-3xl p-8 lg:p-10 shadow-lg border border-[#E8E5DF]"
            style={{ borderTopColor: activeData.color, borderTopWidth: '4px' }}
          >
            <h3 className="font-display text-2xl font-bold text-[#1E3A5F] mb-3">
              {activeData.title}
            </h3>
            <p className="text-[#5A6B7D] text-base leading-relaxed mb-8">
              {activeData.description}
            </p>

            <div className="grid grid-cols-2 gap-4">
              {activeData.stats.map((stat, index) => (
                <div key={index} className="bg-[#F5F3EF] rounded-xl p-5">
                  <div 
                    className="font-display text-3xl font-bold mb-1"
                    style={{ color: activeData.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#5A6B7D]">{stat.label}</div>
                </div>
              ))}
            </div>

            <button
              className="mt-8 w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: activeData.color }}
            >
              See {activeData.title} Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
