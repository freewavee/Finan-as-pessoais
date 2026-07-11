import { ReactNode } from "react";
import { ToastProvider } from "../lib/toast";
import { DensityProvider } from "../contexts/DensityContext";
import { CommandProvider } from "../contexts/CommandContext";
import { AuthProvider } from "../contexts/AuthContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DensityProvider>
        <CommandProvider>
          <ToastProvider>{children}</ToastProvider>
        </CommandProvider>
      </DensityProvider>
    </AuthProvider>
  );
}
