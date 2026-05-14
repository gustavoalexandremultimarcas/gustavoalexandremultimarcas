"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Phone, MapPin, Facebook, Instagram, MessageCircle } from "lucide-react"
import { Button } from "../components/ui/button"
import { MobileMenu } from "../components/MobileMenu"
import { MobileMenuButton } from "../components/MobileMenuButton"
import { SimulacaoModal } from "@/components/SimulacaoModal"
import { ConsignarVeiculoForm } from "@/components/consignacao-veiculos"
import { STORE_PHONE, STORE_ADDRESS, STORE_CITY_STATE, STORE_FACEBOOK_LINK, STORE_INSTAGRAM_LINK, STORE_WHATSAPP_LINK } from "@/lib/config"

type HeaderProps = {
  onOpenSimulacaoModal?: () => void
  onOpenConsignarModal?: () => void
}

export function Header({ onOpenSimulacaoModal, onOpenConsignarModal }: HeaderProps) {
  const [showSimulacaoModal, setShowSimulacaoModal] = useState(false)
  const [showConsignarModal, setShowConsignarModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const [showElectric, setShowElectric] = useState(false)

  useEffect(() => {
    import("@/app/actions").then(({ hasElectricVehicles }) => {
      hasElectricVehicles().then(setShowElectric)
    })
  }, [])

  const openSimulacaoModal = onOpenSimulacaoModal ?? (() => setShowSimulacaoModal(true))
  const openConsignarModal = onOpenConsignarModal ?? (() => setShowConsignarModal(true))
  const renderInternalSimulacaoModal = !onOpenSimulacaoModal
  const renderInternalConsignarModal = !onOpenConsignarModal

  const handleAnchorNavigation = (id: string) => {
    if (pathname !== "/") {
      router.push(`/#${id}`)
    } else {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <>
      <header className="bg-black text-white sticky top-0 z-50 w-full overflow-x-hidden pt-safe">
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="hidden md:flex justify-between items-center py-2 text-sm border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4 text-red-500" />
                <span>{STORE_PHONE}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4 text-red-500" />
                <span>{STORE_ADDRESS} - {STORE_CITY_STATE}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-3">
                <a href={STORE_FACEBOOK_LINK} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href={STORE_INSTAGRAM_LINK} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href={STORE_WHATSAPP_LINK} className="text-gray-300 hover:text-red-500 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Linha principal do header */}
          <div className="relative py-3 md:py-2 flex items-center justify-center md:justify-between">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 mx-auto md:mx-0">
              <div className="h-[100px] overflow-hidden flex items-center">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={250} // Pode ser 600, 700... o importante é a proporção
                  height={500}
                  className="object-contain max-h-[500px]"
                  priority
                />
              </div>
            </Link>

            {/* Botão do menu mobile */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden">
              <MobileMenuButton />
            </div>

            {/* Navegação desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-6">
                <Link href="/" className="hover:text-red-500 transition-colors">Início</Link>
                <Link href="/veiculos" className="hover:text-red-500 transition-colors">Veículos</Link>
                {showElectric && (
                  <Link href="/veiculos?electric=true" className="hover:text-red-500 transition-colors">
                    Elétricos
                  </Link>
                )}

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    openSimulacaoModal()
                  }}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  Simulação
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    openConsignarModal()
                  }}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  Consignação
                </a>
                <a
                  href="#servicos"
                  onClick={(e) => {
                    e.preventDefault()
                    handleAnchorNavigation("servicos")
                  }}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  Serviços
                </a>
              </nav>
              <Button
                onClick={() => {
                  const el = document.getElementById("contato")
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" })
                  } else {
                    router.push("/#contato")
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Fale Conosco
              </Button>
            </div>
          </div>

          {/* Menu mobile abaixo do header */}
          <MobileMenu
            showElectric={showElectric}
            onOpenSimulacaoModal={openSimulacaoModal}
            onOpenConsignarModal={openConsignarModal}
          />

        </div>
      </header>

      {/* Modal de Simulação */}
      {renderInternalSimulacaoModal && (
        <SimulacaoModal
          isOpen={showSimulacaoModal}
          onClose={() => setShowSimulacaoModal(false)}
        />
      )}

      {renderInternalConsignarModal && (
        <ConsignarVeiculoForm
          isOpen={showConsignarModal}
          onClose={() => setShowConsignarModal(false)}
        />
      )}
    </>
  )
}
