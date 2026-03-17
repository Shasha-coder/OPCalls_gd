import Header from '@/components/Header'
import Hero from '@/components/Hero'
import AgentDemo from '@/components/AgentDemo'
import Integrations from '@/components/Integrations'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import CaseStudies from '@/components/CaseStudies'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-dark overflow-x-hidden">
      <Header />
      <Hero />
      <AgentDemo />
      <Integrations />
      <Features />
      <CaseStudies />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
