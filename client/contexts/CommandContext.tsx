import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

export type CommandGroup = "navigation" | "actions" | "help";

export interface CommandItem {
  id: string;
  label: string;
  keywords?: string[];
  group: CommandGroup;
  icon?: LucideIcon;
  shortcut?: string;
  run: () => void;
}

interface CommandContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  commands: CommandItem[];
  register: (items: CommandItem[]) => () => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [extra, setExtra] = useState<CommandItem[]>([]);

  const register = useCallback((items: CommandItem[]) => {
    setExtra((prev) => [...prev, ...items]);
    return () => {
      setExtra((prev) => prev.filter((c) => !items.some((i) => i.id === c.id)));
    };
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((o) => !o),
      commands: extra,
      register,
    }),
    [open, extra, register]
  );

  return <CommandContext.Provider value={value}>{children}</CommandContext.Provider>;
}

export function useCommand() {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error("useCommand must be used within CommandProvider");
  return ctx;
}

export function useRegisterCommands(items: CommandItem[]) {
  const { register } = useCommand();
  useEffect(() => register(items), [register, items]);
}
