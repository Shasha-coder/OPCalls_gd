/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#e8fd79',
          50: '#f9ffe6',
          100: '#f0ffc2',
          200: '#e8fd79',
          300: '#d4f53d',
          400: '#c2e81a',
          500: '#a3c910',
          600: '#7fa008',
          700: '#5f780b',
          800: '#4c5f0f',
          900: '#3f4f11',
        },
        olive: {
          DEFAULT: '#68703b',
          50: '#f7f8ed',
          100: '#ecefd8',
          200: '#dae1b4',
          300: '#c2cd86',
          400: '#abb85f',
          500: '#8c9a41',
          600: '#68703b',
          700: '#535a30',
          800: '#44492b',
          900: '#3b3f28',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          50: '#1a1a1a',
          100: '#141414',
          200: '#0f0f0f',
          300: '#0a0a0a',
          400: '#080808',
          500: '#050505',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'lime-gradient': 'linear-gradient(135deg, #e8fd79 0%, #68703b 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)',
        'glow-gradient': 'radial-gradient(ellipse at center, rgba(232,253,121,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'lime-glow': '0 0 60px rgba(232,253,121,0.3)',
        'lime-glow-sm': '0 0 30px rgba(232,253,121,0.2)',
        'lime-glow-lg': '0 0 100px rgba(232,253,121,0.4)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
        'glass-lg': '0 16px 64px rgba(0,0,0,0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'orbit': 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit 25s linear infinite reverse',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 30px rgba(232,253,121,0.2)' },
          '100%': { boxShadow: '0 0 60px rgba(232,253,121,0.4)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(150px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(150px) rotate(-360deg)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
