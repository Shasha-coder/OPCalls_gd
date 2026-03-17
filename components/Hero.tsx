'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import DoneForYouModal from './DoneForYouModal'

export default function Hero() {
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Canvas-based orbiting light animation for smooth performance
  useEffect(() => {
    if (!mounted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const centerX = canvas.getBoundingClientRect().width / 2
    const centerY = canvas.getBoundingClientRect().height / 2

    // Orbit configuration - 3 elliptical orbits at different angles
    const orbits = [
      { rx: 180, ry: 60, rotation: -25, speed: 0.0008, color: '#e8fb76', opacity: 0.8, width: 2 },
      { rx: 220, ry: 75, rotation: 15, speed: -0.0006, color: '#e8fb76', opacity: 0.6, width: 1.5 },
      { rx: 260, ry: 90, rotation: -40, speed: 0.0004, color: '#c8d96a', opacity: 0.4, width: 1 },
    ]

    // Particles that travel along the orbits
    const particles = [
      { orbitIndex: 0, angle: 0, size: 4, glowSize: 15 },
      { orbitIndex: 0, angle: Math.PI, size: 3, glowSize: 12 },
      { orbitIndex: 1, angle: Math.PI / 2, size: 3, glowSize: 12 },
      { orbitIndex: 1, angle: Math.PI * 1.5, size: 2, glowSize: 10 },
      { orbitIndex: 2, angle: Math.PI / 4, size: 2, glowSize: 8 },
      { orbitIndex: 2, angle: Math.PI * 1.25, size: 2, glowSize: 8 },
    ]

    let animationId: number
    let time = 0

    const animate = () => {
      time += 1
      ctx.clearRect(0, 0, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height)

      // Draw orbits
      orbits.forEach((orbit, index) => {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate((orbit.rotation * Math.PI) / 180)

        // Create gradient for the orbit line
        const gradient = ctx.createLinearGradient(-orbit.rx, 0, orbit.rx, 0)
        gradient.addColorStop(0, `rgba(232, 251, 118, 0)`)
        gradient.addColorStop(0.3, `rgba(232, 251, 118, ${orbit.opacity})`)
        gradient.addColorStop(0.7, `rgba(232, 251, 118, ${orbit.opacity})`)
        gradient.addColorStop(1, `rgba(232, 251, 118, 0)`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = orbit.width
        ctx.beginPath()
        ctx.ellipse(0, 0, orbit.rx, orbit.ry, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      })

      // Draw particles
      particles.forEach((particle) => {
        const orbit = orbits[particle.orbitIndex]
        const angle = particle.angle + time * orbit.speed

        // Calculate position on ellipse
        const x = orbit.rx * Math.cos(angle)
        const y = orbit.ry * Math.sin(angle)

        // Rotate the point
        const rotRad = (orbit.rotation * Math.PI) / 180
        const rotatedX = x * Math.cos(rotRad) - y * Math.sin(rotRad)
        const rotatedY = x * Math.sin(rotRad) + y * Math.cos(rotRad)

        const finalX = centerX + rotatedX
        const finalY = centerY + rotatedY

        // Draw glow
        const glow = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, particle.glowSize)
        glow.addColorStop(0, 'rgba(232, 251, 118, 0.8)')
        glow.addColorStop(0.5, 'rgba(232, 251, 118, 0.3)')
        glow.addColorStop(1, 'rgba(232, 251, 118, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(finalX, finalY, particle.glowSize, 0, Math.PI * 2)
        ctx.fill()

        // Draw particle
        ctx.fillStyle = '#e8fb76'
        ctx.beginPath()
        ctx.arc(finalX, finalY, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [mounted])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-dark" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#e8fb76]/10 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#6c743f]/20 rounded-full blur-[100px] opacity-40" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className={`space-y-8 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e8fb76]/10 border border-[#e8fb76]/20">
              <span className="text-2xl">📞</span>
              <span className="text-sm text-[#e8fb76] font-medium">AI-Powered Voice Agents</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight">
              <span className="text-white">Never Miss</span>
              <br />
              <span className="bg-gradient-to-r from-[#e8fb76] to-[#c8d96a] bg-clip-text text-transparent">Another Call</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/60 max-w-xl leading-relaxed">
              Tell us about your business. We build your custom AI voice agent in 
              <span className="text-[#e8fb76] font-semibold"> 48 hours</span>. Handle calls 24/7, 
              book appointments, and never lose a customer again.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#e8fb76] to-[#d4e86a] text-[#1a1a1a] font-semibold rounded-full hover:shadow-[0_0_30px_rgba(232,251,118,0.3)] transition-all duration-300 hover:scale-105"
              >
                Get Your AI Agent Built
                <span>→</span>
              </button>
              <Link 
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <span>⚡</span>
                DIY Setup
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="text-[#e8fb76]">🛡️</span>
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="text-[#e8fb76]">⚡</span>
                <span>Setup in 10 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="text-[#e8fb76]">💳</span>
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Right Content - Phone with Orbiting Lights */}
          <div className={`relative flex items-center justify-center h-[600px] ${mounted ? 'animate-scale-in' : 'opacity-0'}`}>
            {/* Canvas for orbiting lights */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Phone Mockup - Centered, Fixed Position */}
            <div className="relative w-[280px] sm:w-[300px] z-10">
              {/* Phone Frame */}
              <div className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl border border-white/10">
                {/* Phone Screen */}
                <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between px-6 py-3">
                    <span className="text-xs text-white/70">9:41</span>
                    <div className="w-20 h-6 bg-black rounded-full" />
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 bg-white/70 rounded-sm" />
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="px-5 py-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/50">← Back</div>
                      <div className="text-sm font-medium text-white">Active Calls</div>
                      <div className="w-6 h-6 rounded-full bg-[#e8fb76]/20" />
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs">Today's Calls</span>
                        <span className="text-[#e8fb76] text-xs">+23%</span>
                      </div>
                      <div className="text-3xl font-bold text-white font-display">247</div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-[#e8fb76] to-[#6c743f] rounded-full" />
                      </div>
                    </div>

                    {/* Call Items */}
                    <div className="space-y-2">
                      {[
                        { name: 'Sarah M.', status: 'Appointment Booked', time: '2m ago' },
                        { name: 'John D.', status: 'Question Answered', time: '5m ago' },
                        { name: 'Lisa K.', status: 'Follow-up Scheduled', time: '8m ago' },
                      ].map((call, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8fb76]/30 to-[#6c743f]/30 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">{call.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{call.name}</div>
                            <div className="text-xs text-[#e8fb76]/80">{call.status}</div>
                          </div>
                          <span className="text-xs text-white/40">{call.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action */}
                    <button className="w-full py-3 bg-gradient-to-r from-[#e8fb76] to-[#d4e86a] rounded-full text-[#1a1a1a] font-semibold text-sm">
                      View All Activity
                    </button>
                  </div>
                </div>

                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-16 bg-[#e8fb76]/10 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark to-transparent" />
      
      {/* Done For You Modal */}
      <DoneForYouModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </section>
  )
}
