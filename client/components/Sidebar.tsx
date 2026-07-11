import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  CreditCard,
  BarChart3,
  TrendingUp,
  Target,
  Settings,
  Landmark,
} from "lucide-react";

export type Page =
  | "dashboard"
  | "transacoes"
  | "contas"
  | "categorias"
  | "formas-pagamento"
  | "relatorios"
  | "investimentos"
  | "metas"
  | "config";

interface NavItem {
  page: Page;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "transacoes", label: "Transações", icon: ArrowLeftRight },
  { page: "contas", label: "Contas", icon: Wallet },
  { page: "categorias", label: "Categorias", icon: Tags },
  { page: "formas-pagamento", label: "Formas de Pagamento", icon: CreditCard },
  { page: "relatorios", label: "Relatórios", icon: BarChart3, disabled: true },
  { page: "investimentos", label: "Investimentos", icon: TrendingUp, disabled: true },
  { page: "metas", label: "Metas", icon: Target, disabled: true },
  { page: "config", label: "Configurações", icon: Settings, disabled: true },
];

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  className?: string;
}

export function Sidebar({ current, onNavigate, className = "" }: SidebarProps) {
  return (
    <nav className={`bg-sidebar border-line flex flex-col ${className}`}>
      <div className="flex items-center gap-2 px-5 py-6">
        <Landmark className="text-primary" size={22} />
        <span className="font-display font-bold text-lg text-ink">Finanças</span>
      </div>

      <ul className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.page;
          return (
            <li key={item.page} className="relative">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <button
                disabled={item.disabled}
                onClick={() => !item.disabled && onNavigate(item.page)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-surface-active text-ink"
                    : item.disabled
                    ? "text-ink-muted/40 cursor-not-allowed"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                }`}
              >
                <Icon size={17} className={active ? "text-primary" : ""} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.disabled && (
                  <span className="text-[10px] uppercase tracking-wide text-ink-muted/40 shrink-0">em breve</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-5 py-4 text-xs text-ink-muted/60 border-t border-line">Fase 2.1 — MVP local</div>
    </nav>
  );
}
