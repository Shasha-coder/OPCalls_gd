'use client'

import Image from 'next/image'
import { Twitter, Linkedin, Instagram, Youtube } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Dashboard', href: '#' },
    { name: 'About', href: '#' },
    { name: 'Integrations', href: '#' },
    { name: 'Resources', href: '#' },
    { name: 'Pricing', href: '#' },
  ],
  resources: [
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Guides', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Support', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Partners', href: '#' },
    { name: 'Press', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
    { name: 'GDPR', href: '#' },
  ],
}

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'LinkedIn', icon: Linkedin, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'YouTube', icon: Youtube, href: '#' },
]

export default function Footer() {
  return (
    <footer className="relative bg-dark border-t border-white/5 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-lime-200/5 rounded-full blur-[120px] opacity-50" />
      
      {/* World Map Dots Pattern */}
      <div className="absolute right-0 bottom-0 w-[500px] h-[300px] opacity-20">
        <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Simplified world map dots */}
          {Array.from({ length: 50 }).map((_, i) => (
            <circle
              key={i}
              cx={100 + Math.random() * 350}
              cy={50 + Math.random() * 200}
              r={1 + Math.random() * 2}
              fill="#e8fd79"
              opacity={0.3 + Math.random() * 0.5}
            />
          ))}
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.svg"
                alt="OPCalls"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="font-display font-bold text-xl tracking-tight">
                <span className="text-white">OP</span>
                <span className="text-lime-200">CALLS</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
              AI-powered voice agents that handle your calls 24/7. Never miss another opportunity.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-lime-200 hover:border-lime-200/30 transition-all duration-300"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/50 hover:text-lime-200 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/50 hover:text-lime-200 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/50 hover:text-lime-200 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/50 hover:text-lime-200 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} OPCalls Technologies Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-white/40 text-sm">
            <span>Made with ❤️ for businesses worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
