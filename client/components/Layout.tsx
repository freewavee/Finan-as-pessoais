import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar, Page } from "./Sidebar";

interface LayoutProps {
  current: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function Layout({ current, onNavigate, children }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleNavigate(page: Page) {
    onNavigate(page);
    setDrawerOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar fixa — desktop */}
      <Sidebar current={current} onNavigate={handleNavigate} className="hidden md:flex w-60 shrink-0 border-r" />

      {/* Drawer — mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <Sidebar current={current} onNavigate={handleNavigate} className="relative w-64 h-full border-r" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Top bar — mobile only */}
        <div className="md:hidden flex items-center gap-3 border-b border-line bg-sidebar px-4 py-3">
          <button onClick={() => setDrawerOpen(true)} aria-label="Abrir menu" className="text-ink">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-ink">Finanças</span>
        </div>

        {children}
      </div>
    </div>
  );
}
