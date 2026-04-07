export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { ReactNode } from "react";
import PanelFooter from "./_components/PanelFooter";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1">{children}</div>
      <PanelFooter />
    </div>
  );
}