import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "./CommandPalette";
import { useGlobalHotkeys } from "../../hooks/useHotkeys";

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  useGlobalHotkeys();

  return (
    <div className="min-h-screen flex bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-primary focus:text-white focus:px-3 focus:py-2 focus:rounded-md"
      >
        Ir para o conteúdo
      </a>

      <Sidebar className="hidden md:flex w-60 shrink-0 border-r fixed inset-y-0 left-0 z-30" />

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="relative h-full w-64 shadow-2xl"
            >
              <Sidebar className="h-full border-r" onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 md:pl-60 flex flex-col min-h-screen">
        <TopBar pathname={location.pathname} onMenuClick={() => setDrawerOpen(true)} />

        <main id="main-content" className="flex-1 safe-bottom">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
