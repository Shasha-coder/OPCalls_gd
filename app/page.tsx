import Header from '@/components/Header'
import Hero from '@/components/Hero'
import FeaturesSection from '@/components/FeaturesSection'
import UseCasesSection from '@/components/UseCasesSection'
import Testimonials from '@/components/Testimonials'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen metal-bg">
      <Header />
      <Hero />
      <FeaturesSection />
      <UseCasesSection />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  )
}
