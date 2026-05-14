"use client"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

type MobileMenuContextType = {
  isOpen: boolean
  toggle: () => void
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined)

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const value = useMemo(() => ({ isOpen, toggle }), [isOpen, toggle])

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext)
  if (!context) {
    throw new Error("useMobileMenu must be used within a MobileMenuProvider")
  }
  return context
}
