'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-[#1a1a1a] border border-lime-300/40 text-lime-300 font-medium hover:bg-[#222] hover:border-lime-300/60 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
      secondary: 'bg-[#1a1a1a] border border-white/20 text-white/80 hover:bg-[#222] hover:border-white/30 active:scale-[0.98]',
      ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10',
      danger: 'bg-[#1a1a1a] text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-full',
      md: 'px-6 py-3 text-sm rounded-full',
      lg: 'px-8 py-4 text-base rounded-full',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lime-300/30 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
