import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <Header />
      {children}
      <Footer />
      <BottomNav />
    </div>
  );
}
