'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    <header ref={headerRef} className="fixed top-4 left-4 right-4 z-50">
      <nav className="max-w-6xl mx-auto glass-header rounded-2xl px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/opcalls-logo.png"
            alt="OPCalls"
            width={28}
            height={28}
            className="brightness-0 invert opacity-90"
          />
          <span className="text-white text-lg font-semibold">OPCalls</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {['About', 'Solutions', 'Pricing', 'FAQ'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-5 py-2 text-sm font-medium text-white border border-white/20 rounded-full hover:bg-white/5 transition-all"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2 text-sm font-medium bg-white text-gray-900 rounded-full hover:bg-white/90 transition-all"
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
      <div className={`md:hidden mt-2 max-w-6xl mx-auto glass-header rounded-2xl transition-all duration-300 ${
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
          <div className="pt-3 mt-3 border-t border-white/10 flex gap-3">
            <Link href="/auth/login" className="flex-1 px-4 py-3 text-sm text-white/70 rounded-xl text-center border border-white/20" onClick={() => setMobileOpen(false)}>
              Login
            </Link>
            <Link href="/auth/signup" className="flex-1 px-4 py-3 text-sm font-medium bg-white text-gray-900 rounded-xl text-center" onClick={() => setMobileOpen(false)}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
