import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Density } from "../types";

const STORAGE_KEY = "fp.density";

interface DensityContextValue {
  density: Density;
  setDensity: (d: Density) => void;
  toggleDensity: () => void;
  isCompact: boolean;
}

const DensityContext = createContext<DensityContextValue | null>(null);

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === "compact" ? "compact" : "comfortable";
    } catch {
      return "comfortable";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.density = density;
  }, [density]);

  const value = useMemo(
    () => ({
      density,
      setDensity: setDensityState,
      toggleDensity: () =>
        setDensityState((d) => (d === "compact" ? "comfortable" : "compact")),
      isCompact: density === "compact",
    }),
    [density]
  );

  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useDensity() {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error("useDensity must be used within DensityProvider");
  return ctx;
}
