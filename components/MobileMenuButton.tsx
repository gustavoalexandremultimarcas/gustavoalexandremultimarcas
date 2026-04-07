"use client"
import { Menu, X } from "lucide-react"
import { useMobileMenu } from "../context/MobileMenuContext"

export function MobileMenuButton() {
  const { isOpen, toggle } = useMobileMenu()

  return (
    <button onClick={toggle}>
      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  )
}
