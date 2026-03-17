import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OPCalls - The Next-Gen AI Agent for Efficiency',
  description: 'Build your specialized AI voice agent in under 10 minutes. Handle calls 24/7, book appointments, and never lose a customer again.',
  keywords: 'AI voice agent, call automation, business calls, AI receptionist, voice AI, customer service',
  openGraph: {
    title: 'OPCalls - The Next-Gen AI Agent for Efficiency',
    description: 'Build your specialized AI voice agent in under 10 minutes.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#3366FF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans min-h-screen antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1A2B4B',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
