"use client"
import { MobileMenuProvider } from "@/context/MobileMenuContext"

export function MobileMenuWrapper({ children }: { children: React.ReactNode }) {
  return <MobileMenuProvider>{children}</MobileMenuProvider>
}
