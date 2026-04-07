export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1">{children}</div>
      <footer className="py-4 text-center text-xs text-gray-500 border-t bg-white">
        © {new Date().getFullYear()} - Painel Administrativo
      </footer>
    </div>
  );
}