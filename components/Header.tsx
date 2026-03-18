'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import gsap from 'gsap'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    gsap.fromTo(
      '.header-content',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      }`}
    >
      <nav className="header-content max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#3366FF] flex items-center justify-center transition-transform group-hover:scale-105">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-[#1E3A5F]">OPCalls</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {['Products', 'Solutions', 'Features', 'Pricing', 'Docs'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="px-4 py-2 text-sm font-medium text-[#5A6B7D] hover:text-[#1E3A5F] transition-colors rounded-lg hover:bg-[#1E3A5F]/5"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-[#5A6B7D] hover:text-[#1E3A5F] transition-colors">
            Sign in
          </Link>
          <Link href="/auth/signup" className="px-5 py-2.5 text-sm font-semibold text-white bg-[#3366FF] rounded-xl hover:bg-[#2952CC] transition-all shadow-sm hover:shadow-md">
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#1E3A5F]/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-[#1E3A5F] rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-[#1E3A5F] rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-[#1E3A5F] rounded transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-[#1E3A5F]/10 transition-all duration-300 ${
        mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="px-4 py-6 space-y-1">
          {['Products', 'Solutions', 'Features', 'Pricing', 'Docs'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block px-4 py-3 text-sm font-medium text-[#5A6B7D] hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 rounded-xl transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-[#1E3A5F]/10 space-y-2">
            <Link href="/auth/login" className="block px-4 py-3 text-sm font-medium text-[#5A6B7D] hover:text-[#1E3A5F] rounded-xl" onClick={() => setMobileOpen(false)}>
              Sign in
            </Link>
            <Link href="/auth/signup" className="block px-4 py-3 text-sm font-semibold text-white bg-[#3366FF] rounded-xl text-center" onClick={() => setMobileOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
