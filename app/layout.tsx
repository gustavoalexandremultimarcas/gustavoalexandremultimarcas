// app/layout.tsx (ou app/layout.ts)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileMenuWrapper } from "@/components/mobile-menu-wrapper";
import { STORE_NAME } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${STORE_NAME} - Compra, Venda e Troca de Veículos`,
  description:
    "Carros revisados e periciados com garantia. Compra, venda, troca e financiamento de veículos novos e seminovos.",
  generator: "v0.dev",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden max-w-screen`} suppressHydrationWarning>
        <MobileMenuWrapper>{children}</MobileMenuWrapper>
      </body>
    </html>
  );
}
