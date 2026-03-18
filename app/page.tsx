import Header from '@/components/Header'
import Hero from '@/components/Hero'
import AgentPresets from '@/components/AgentPresets'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen dark-bg">
      <Header />
      <Hero />
      <AgentPresets />
      <Footer />
    </main>
  )
}
