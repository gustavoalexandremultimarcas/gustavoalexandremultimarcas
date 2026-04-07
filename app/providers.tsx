"use client"

import { MobileMenuProvider } from "@/Context/MobileMenuContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MobileMenuProvider>
      {children}
    </MobileMenuProvider>
  )
}
