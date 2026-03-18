'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    )
  }, [])

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-8 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-white text-xl font-semibold tracking-tight">OPCalls</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { name: 'About', hasDropdown: false },
            { name: 'Solutions', hasDropdown: true },
            { name: 'Pricing', hasDropdown: false },
            { name: 'FAQ', hasDropdown: false },
          ].map((item) => (
            <Link
              key={item.name}
              href={`#${item.name.toLowerCase()}`}
              className="flex items-center gap-1 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              {item.name}
              {item.hasDropdown && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-5 py-2.5 text-sm font-medium text-white btn-outline rounded-full"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2.5 text-sm font-medium btn-light rounded-full"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-4 right-4 mt-2 glass-card rounded-2xl transition-all duration-300 ${
        mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="p-4 space-y-1">
          {['About', 'Solutions', 'Pricing', 'FAQ'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
            <Link href="/auth/login" className="block px-4 py-3 text-sm text-white/70 rounded-xl text-center" onClick={() => setMobileOpen(false)}>
              Login
            </Link>
            <Link href="/auth/signup" className="block px-4 py-3 text-sm font-medium btn-light rounded-xl text-center" onClick={() => setMobileOpen(false)}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
