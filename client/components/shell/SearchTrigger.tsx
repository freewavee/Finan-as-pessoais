import { Search } from "lucide-react";
import { useCommand } from "../../contexts/CommandContext";

export function SearchTrigger() {
  const { setOpen } = useCommand();
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="group flex items-center gap-2 rounded-lg border border-line bg-surface/60 hover:bg-surface-hover px-3 py-1.5 text-sm text-ink-muted transition-colors min-w-0 w-full max-w-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <Search size={15} className="shrink-0" />
      <span className="truncate flex-1 text-left">Buscar…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-line bg-bg px-1.5 py-0.5 text-[10px] font-mono text-ink-muted">
        {isMac ? "⌘" : "Ctrl"}K
      </kbd>
    </button>
  );
}
