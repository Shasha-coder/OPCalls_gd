'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
    )
  }, [])

  return (
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-chrome shadow-lg' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-18 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl icon-badge flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <span className="font-display text-xl text-metallic tracking-tight">OPCalls</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {['Home', 'Features', 'Pricing', 'About'].map((item) => (
            <Link
              key={item}
              href={item === 'Home' ? '/' : `#${item.toLowerCase()}`}
              className="px-5 py-2.5 text-sm font-medium text-silver-700 hover:text-silver-900 transition-colors rounded-lg hover:bg-white/40"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Sign In Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            href="/auth/login" 
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-silver-700 hover:text-silver-900 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup" 
            className="flex items-center gap-2 px-5 py-2.5 btn-chrome rounded-full text-sm font-semibold text-silver-800"
          >
            <span>Get Started</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl btn-chrome"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-silver-800 rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-silver-800 rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-silver-800 rounded transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 glass-chrome border-t border-white/30 transition-all duration-300 ${
        mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="px-6 py-6 space-y-2">
          {['Home', 'Features', 'Pricing', 'About'].map((item) => (
            <Link
              key={item}
              href={item === 'Home' ? '/' : `#${item.toLowerCase()}`}
              className="block px-4 py-3 text-sm font-medium text-silver-700 hover:text-silver-900 hover:bg-white/50 rounded-xl transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-silver-300/50 space-y-2">
            <Link href="/auth/login" className="block px-4 py-3 text-sm font-medium text-silver-700 rounded-xl" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <Link href="/auth/signup" className="block px-4 py-3 text-sm font-semibold btn-dark rounded-xl text-center" onClick={() => setMobileOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
