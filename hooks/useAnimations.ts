'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// Fade in from bottom animation
export function useFadeInUp(delay: number = 0) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: 'power3.out',
        }
      )
    }
  }, [delay])

  return ref
}

// Scale in animation
export function useScaleIn(delay: number = 0) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          scale: 0.9,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          delay,
          ease: 'back.out(1.7)',
        }
      )
    }
  }, [delay])

  return ref
}

// Stagger children animation
export function useStaggerChildren(staggerDelay: number = 0.1) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      const children = ref.current.children
      gsap.fromTo(
        children,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: staggerDelay,
          ease: 'power2.out',
        }
      )
    }
  }, [staggerDelay])

  return ref
}

// Counter animation
export function useCountUp(endValue: number, duration: number = 2) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (ref.current) {
      const obj = { value: 0 }
      gsap.to(obj, {
        value: endValue,
        duration,
        ease: 'power1.out',
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = Math.round(obj.value).toLocaleString()
          }
        },
      })
    }
  }, [endValue, duration])

  return ref
}

// Hover glow effect
export function useHoverGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const handleMouseEnter = () => {
      gsap.to(element, {
        boxShadow: '0 0 40px rgba(232, 253, 121, 0.3)',
        borderColor: 'rgba(232, 253, 121, 0.4)',
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(element, {
        boxShadow: '0 0 0px rgba(232, 253, 121, 0)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return ref
}

// Parallax effect
export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const handleScroll = () => {
      const scrollY = window.scrollY
      const rect = element.getBoundingClientRect()
      const offsetTop = rect.top + scrollY

      gsap.to(element, {
        y: (scrollY - offsetTop) * speed,
        duration: 0.1,
        ease: 'none',
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return ref
}

// Magnetic cursor effect
export function useMagnetic(strength: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength

      gsap.to(element, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      })
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [strength])

  return ref
}
