'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DropdownOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  error?: boolean
  disabled?: boolean
  className?: string
}

export function Dropdown({ value, onChange, options, placeholder = 'Select...', error, disabled, className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value)
          setIsOpen(false)
        } else {
          setIsOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-200',
          'bg-[#1a1a1a] border',
          error ? 'border-red-500/30' : 'border-white/[0.08]',
          isOpen && !error && 'border-white/20 bg-[#1e1e1e]',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1e1e1e]'
        )}
      >
        <span className={cn(
          'truncate',
          selectedOption ? 'text-white' : 'text-white/40'
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <svg 
          className={cn(
            'w-4 h-4 text-white/40 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <ul
          ref={listRef}
          className={cn(
            'absolute z-50 w-full mt-2 py-1 rounded-xl overflow-hidden',
            'bg-[#2a2a2a] border border-white/[0.08]',
            'shadow-xl shadow-black/40',
            'max-h-64 overflow-y-auto',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent'
          }}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'px-4 py-2.5 cursor-pointer transition-colors duration-100',
                'text-white text-sm',
                (highlightedIndex === index || value === option.value)
                  ? 'bg-white/10'
                  : 'hover:bg-white/5'
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
