import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CornerDownLeft,
  Rows3,
  Plus,
  Wallet,
  Target,
  Tags,
} from "lucide-react";
import { useCommand, type CommandItem } from "../../contexts/CommandContext";
import { useDensity } from "../../contexts/DensityContext";
import { ROUTES, normalizeSearch } from "../../lib/navigation";

const GROUP_LABEL: Record<string, string> = {
  navigation: "Navegação",
  actions: "Ações",
  help: "Ajuda",
};

export function CommandPalette() {
  const { open, setOpen, commands: extra } = useCommand();
  const navigate = useNavigate();
  const { toggleDensity, isCompact } = useDensity();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const builtIn: CommandItem[] = useMemo(
    () => [
      ...ROUTES.map((r) => ({
        id: `nav-${r.path}`,
        label: r.label,
        keywords: r.keywords,
        group: "navigation" as const,
        icon: r.icon,
        run: () => navigate(r.path),
      })),
      {
        id: "action-new-tx",
        label: "Nova transação",
        keywords: ["criar", "lancamento", "adicionar"],
        group: "actions",
        icon: Plus,
        shortcut: "N",
        run: () => navigate("/transacoes?new=1"),
      },
      {
        id: "action-new-account",
        label: "Nova conta",
        keywords: ["criar", "carteira"],
        group: "actions",
        icon: Wallet,
        run: () => navigate("/contas?new=1"),
      },
      {
        id: "action-new-goal",
        label: "Nova meta",
        keywords: ["criar", "objetivo"],
        group: "actions",
        icon: Target,
        run: () => navigate("/metas?new=1"),
      },
      {
        id: "action-new-category",
        label: "Nova categoria",
        keywords: ["criar"],
        group: "actions",
        icon: Tags,
        run: () => navigate("/categorias?new=1"),
      },
      {
        id: "action-new-investment",
        label: "Novo investimento",
        keywords: ["criar", "aplicar"],
        group: "actions",
        icon: ArrowLeftRight,
        run: () => navigate("/investimentos?new=1"),
      },
      {
        id: "action-density",
        label: isCompact ? "Densidade confortável" : "Densidade compacta",
        keywords: ["tabela", "compacto", "density"],
        group: "actions",
        icon: Rows3,
        shortcut: "⇧⌘D",
        run: () => toggleDensity(),
      },
      {
        id: "help-shortcuts",
        label: "Atalhos: G+D dashboard · G+T transações · N nova · ⌘K busca",
        keywords: ["atalho", "teclado", "help"],
        group: "help",
        run: () => undefined,
      },
    ],
    [navigate, toggleDensity, isCompact]
  );

  const all = useMemo(() => [...builtIn, ...extra], [builtIn, extra]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return all;
    return all.filter((c) => {
      const hay = normalizeSearch([c.label, ...(c.keywords ?? [])].join(" "));
      return hay.includes(q);
    });
  }, [all, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function runItem(item: CommandItem) {
    setOpen(false);
    item.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && filtered[active]) {
      e.preventDefault();
      runItem(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  const groups = ["navigation", "actions", "help"] as const;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Busca global"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-line bg-surface shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-line px-4">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar páginas, ações…"
                className="flex-1 bg-transparent py-3.5 text-sm text-ink placeholder:text-ink-muted outline-none"
              />
              <kbd className="text-[10px] text-ink-muted border border-line rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">
                  Nenhum resultado para “{query}”
                </p>
              ) : (
                groups.map((g) => {
                  const items = filtered.filter((c) => c.group === g);
                  if (items.length === 0) return null;
                  return (
                    <div key={g} className="mb-1">
                      <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-ink-muted">
                        {GROUP_LABEL[g]}
                      </p>
                      {items.map((item) => {
                        const idx = filtered.indexOf(item);
                        const Icon = item.icon;
                        const isActive = idx === active;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => runItem(item)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                              isActive ? "bg-primary-soft text-ink" : "text-ink-muted hover:bg-surface-hover"
                            }`}
                          >
                            {Icon && <Icon size={16} className={isActive ? "text-primary" : ""} />}
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.shortcut && (
                              <span className="text-[10px] font-mono opacity-60">{item.shortcut}</span>
                            )}
                            {isActive && <CornerDownLeft size={14} className="opacity-50" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
