'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtextRef = useRef<HTMLParagraphElement>(null)
  const dfyRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)
  const [showDFYModal, setShowDFYModal] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(headlineRef.current, 
        { y: 60, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1 }
      )
      .fromTo(subtextRef.current, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8 }, 
        '-=0.6'
      )
      .fromTo(dfyRef.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7 }, 
        '-=0.5'
      )
      .fromTo(blobRef.current, 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, 
        '-=0.8'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <section ref={sectionRef} className="relative min-h-[70vh] dark-bg overflow-hidden pt-32 pb-16">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 
              ref={headlineRef}
              className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-6"
            >
              Elevate Your
              <br />
              <span className="text-white/70">Business Calls</span>
            </h1>
            
            <p 
              ref={subtextRef}
              className="text-white/40 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed mb-10"
            >
              Unlock your business potential with AI-powered voice agents, handling calls 24/7 professionally.
            </p>

            {/* Done-For-You Section */}
            <div ref={dfyRef} className="glass-card rounded-2xl p-6 max-w-md mx-auto">
              <h3 className="text-white font-semibold text-lg mb-2">Done-For-You Setup</h3>
              <p className="text-white/50 text-sm mb-4">Let our experts build and configure your AI voice agent</p>
              <button
                onClick={() => setShowDFYModal(true)}
                className="w-full py-3.5 bg-white text-gray-900 rounded-xl font-medium hover:bg-white/90 transition-all"
              >
                Request Done-For-You
              </button>
            </div>
          </div>

          {/* Golden Blob */}
          <div ref={blobRef} className="relative mt-8 flex justify-center">
            <div className="relative w-[280px] h-[180px] sm:w-[360px] sm:h-[240px]">
              <Image
                src="/images/hero-blob.jpg"
                alt="AI Voice Technology"
                fill
                className="object-contain opacity-70"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* DFY Modal */}
      {showDFYModal && (
        <DFYModal onClose={() => setShowDFYModal(false)} />
      )}
    </>
  )
}

function DFYModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    country: '',
    address: '',
    agentType: '',
    otherDescription: ''
  })

  useEffect(() => {
    gsap.fromTo(modalRef.current, 
      { opacity: 0, scale: 0.95 }, 
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
    )
  }, [])

  const handleClose = () => {
    gsap.to(modalRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      onComplete: onClose
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('DFY Request:', formData)
    handleClose()
  }

  const agentTypes = [
    'Appointment Setter',
    'Follow-Up Agent',
    'No-Show Recovery',
    'HVAC Support',
    'Real Estate Agent',
    'Closer Agent',
    'Customer Support',
    'Other'
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div ref={modalRef} className="relative w-full max-w-lg glass-card rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-display font-semibold text-white mb-2">Done-For-You Request</h2>
        <p className="text-white/50 text-sm mb-6">Our team will build your custom AI voice agent</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="john@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Business Name</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Acme Inc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Country</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="United States"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="123 Main St"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Agent Type</label>
            <select
              required
              value={formData.agentType}
              onChange={(e) => setFormData({ ...formData, agentType: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">Select agent type</option>
              {agentTypes.map((type) => (
                <option key={type} value={type} className="bg-gray-900">{type}</option>
              ))}
            </select>
          </div>

          {formData.agentType === 'Other' && (
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Describe your agent (max 100 chars)</label>
              <input
                type="text"
                maxLength={100}
                value={formData.otherDescription}
                onChange={(e) => setFormData({ ...formData, otherDescription: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Brief description of your needs..."
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-white/90 transition-all mt-6"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  )
}
