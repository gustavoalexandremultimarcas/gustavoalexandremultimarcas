"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Facebook, Instagram, MessageCircle } from "lucide-react"
import { STORE_NAME, STORE_FACEBOOK_LINK, STORE_INSTAGRAM_LINK, STORE_WHATSAPP_LINK } from "@/lib/config"

type FooterProps = {
  onOpenSimulacaoModal: () => void
  onOpenConsignarModal?: () => void
}

export function Footer({ onOpenSimulacaoModal, onOpenConsignarModal }: FooterProps) {
  const pathname = usePathname()
  const router = useRouter()

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
    <footer className="text-white py-12 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 items-start">
          {/* Logo e Descrição */}
          <div className="md:col-span-2 flex flex-col items-center md:flex-row md:items-center">
            <div className="mb-4 md:mb-0 md:mr-6 flex justify-center md:justify-start">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={400}
                height={400}
                className="h-[200px] md:h-[200px] w-auto object-contain"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-300 mb-4 max-w-md">
                Bem-vindo à {STORE_NAME}! Oferecemos uma ampla variedade de veículos seminovos com garantia, procedência e condições que se encaixam no seu perfil.
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <a href={STORE_FACEBOOK_LINK} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href={STORE_INSTAGRAM_LINK} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href={STORE_WHATSAPP_LINK} className="text-gray-300 hover:text-red-500 transition-colors">
                  <MessageCircle className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-red-500 transition-colors">Início</Link></li>
              <li><Link href="/veiculos" className="text-gray-300 hover:text-red-500 transition-colors">Veículos</Link></li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onOpenSimulacaoModal()
                  }}
                  className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Simulação
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (onOpenConsignarModal) {
                      onOpenConsignarModal();
                    }                    
                  }}
                  className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Consignação
                </a>
              </li>
              <li>
                <a
                  href="#servicos"
                  onClick={(e) => {
                    e.preventDefault()
                    handleAnchorNavigation("servicos")
                  }}
                  className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Serviços
                </a>
              </li>
              <li>
                <a
                  href="#contato"
                  onClick={(e) => {
                    e.preventDefault()
                    handleAnchorNavigation("contato")
                  }}
                  className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Fale Conosco
                </a>
              </li>
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Compra de Veículos</li>
              <li>Consignação de Veículos</li>
              <li>Financiamento</li>
              <li>Troca Facilitada</li>
              <li>Venda com Garantia</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p className="text-white">&copy; {new Date().getFullYear()} {STORE_NAME}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
