import { ReactNode } from "react";

/** Ações sempre visíveis no touch; hover/focus no desktop. */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
      {children}
    </div>
  );
}
