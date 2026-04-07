"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { useMobileMenu } from "../context/MobileMenuContext"

type MobileMenuProps = {
  onOpenSimulacaoModal: () => void
  onOpenConsignarModal: () => void
  showElectric?: boolean
}

export function MobileMenu({ onOpenSimulacaoModal, onOpenConsignarModal, showElectric }: MobileMenuProps) {
  const { isOpen } = useMobileMenu()
  const pathname = usePathname()
  const router = useRouter()

  if (!isOpen) return null

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
    <nav className="py-4 border-t border-gray-800 mt-2">
      <div className="flex flex-col space-y-4">
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
            onOpenSimulacaoModal()
          }}
          className="hover:text-red-500 transition-colors cursor-pointer"
        >
          Simulação
        </a>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onOpenConsignarModal()
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

        <a
          href="#contato"
          onClick={(e) => {
            e.preventDefault()
            handleAnchorNavigation("contato")
          }}
          className="hover:text-red-500 transition-colors cursor-pointer"
        >
          Contato
        </a>

        <Button
          onClick={() => {
            const el = document.getElementById("contato-footer")
            if (el) {
              el.scrollIntoView({ behavior: "smooth" })
            } else {
              router.push("/#contato-footer")
            }
          }}
          className="bg-red-600 hover:bg-red-700 w-fit"
        >
          Fale Conosco
        </Button>
      </div>
    </nav>
  )
}
