'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'

const navigation = [
  { name: 'Solutions', href: '#solutions', hasDropdown: true },
  { name: 'Integrations', href: '#integrations' },
  { name: 'Resources', href: '#resources', hasDropdown: true },
  { name: 'Pricing', href: '#pricing' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-dark/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.svg"
                alt="OPCalls"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              <span className="text-white">OP</span>
              <span className="text-lime-200">CALLS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors duration-300"
              >
                {item.name}
                {item.hasDropdown && (
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                )}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm text-white/70 hover:text-white transition-colors duration-300"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="btn-primary text-sm py-3 px-6"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 space-y-4 border-t border-white/5">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4 space-y-3 border-t border-white/5">
              <Link
                href="/auth/login"
                className="block text-white/70 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="btn-primary inline-block text-sm py-3 px-6"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
