"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { FeaturedVehicles } from "@/components/featured-vehicles"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"
import { SimulacaoModal } from "@/components/SimulacaoModal"
import { ConsignarVeiculoForm } from "@/components/consignacao-veiculos"
import { EletricosVeiculos } from "@/components/eletricos-veiculos"

export default function Home() {
  const [showSimulacaoModal, setShowSimulacaoModal] = useState(false)
  const [showConsignarModal, setShowConsignarModal] = useState(false)

  return (
    <main>
      <Header />
      <HeroSection />      
      <FeaturedVehicles />
      <ServicesSection />
      <ContactSection />
      <Footer
        onOpenSimulacaoModal={() => setShowSimulacaoModal(true)}
        onOpenConsignarModal={() => setShowConsignarModal(true)} 
      />
      <SimulacaoModal
        isOpen={showSimulacaoModal}
        onClose={() => setShowSimulacaoModal(false)}
      />
      <ConsignarVeiculoForm
        isOpen={showConsignarModal}
        onClose={() => setShowConsignarModal(false)}
      />
    </main>
  )
}
