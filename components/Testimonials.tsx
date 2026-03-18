'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TESTIMONIALS = [
  {
    quote: "OPCalls transformed our sales process. We're booking 3x more demos without adding headcount.",
    author: 'Sarah Chen',
    role: 'VP of Sales',
    company: 'TechScale Inc.',
    avatar: 'SC',
    color: '#3366FF',
  },
  {
    quote: "Our patients love being able to schedule appointments anytime. Staff satisfaction is through the roof.",
    author: 'Dr. Michael Torres',
    role: 'Practice Manager',
    company: 'Metro Health Clinic',
    avatar: 'MT',
    color: '#10B981',
  },
  {
    quote: "We capture every after-hours call now. Revenue is up 40% since implementing OPCalls.",
    author: 'James Wright',
    role: 'Owner',
    company: 'Wright HVAC Services',
    avatar: 'JW',
    color: '#F59E0B',
  },
]

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.testimonial-card',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-[#3366FF]/10 text-[#3366FF] text-xs font-semibold rounded-full mb-4">
            TESTIMONIALS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E3A5F] mb-4">
            Loved by businesses worldwide
          </h2>
          <p className="text-[#5A6B7D] text-lg max-w-2xl mx-auto">
            See how companies are transforming their communication with OPCalls.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card bg-[#F5F3EF] rounded-2xl p-6 lg:p-8 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl text-[#3366FF] opacity-30 font-serif mb-4">"</div>
              <p className="text-[#1E3A5F] font-medium leading-relaxed mb-6 -mt-4">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: testimonial.color }}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-[#1E3A5F]">{testimonial.author}</div>
                  <div className="text-sm text-[#5A6B7D]">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { value: '10M+', label: 'Calls Handled' },
            { value: '500+', label: 'Businesses' },
            { value: '99.9%', label: 'Uptime' },
            { value: '4.9/5', label: 'Rating' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-display text-3xl lg:text-4xl font-bold text-[#3366FF] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[#5A6B7D]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
