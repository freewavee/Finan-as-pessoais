import type { LucideIcon } from "lucide-react";
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
  CalendarCheck,
} from "lucide-react";

export interface RouteMeta {
  path: string;
  label: string;
  icon: LucideIcon;
  keywords: string[];
  section?: "main" | "future";
  description?: string;
}

export const ROUTES: RouteMeta[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "inicio", "painel"],
    description: "Centro financeiro",
  },
  {
    path: "/transacoes",
    label: "Transações",
    icon: ArrowLeftRight,
    keywords: ["lancamentos", "gastos", "receitas"],
  },
  {
    path: "/contas",
    label: "Contas",
    icon: Wallet,
    keywords: ["carteira", "banco"],
  },
  {
    path: "/categorias",
    label: "Categorias",
    icon: Tags,
    keywords: ["grupo", "tags"],
  },
  {
    path: "/formas-pagamento",
    label: "Formas de Pagamento",
    icon: CreditCard,
    keywords: ["pix", "cartao", "dinheiro"],
  },
  {
    path: "/metas",
    label: "Metas",
    icon: Target,
    keywords: ["objetivos", "poupar", "goals"],
  },
  {
    path: "/investimentos",
    label: "Investimentos",
    icon: TrendingUp,
    keywords: ["carteira", "acoes", "renda"],
  },
  {
    path: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    keywords: ["reports", "analise", "export"],
  },
  {
    path: "/fechamento",
    label: "Fechamento",
    icon: CalendarCheck,
    keywords: ["mes", "fechar", "periodo", "snapshot"],
  },
  {
    path: "/config",
    label: "Configurações",
    icon: Settings,
    keywords: ["settings", "perfil", "tema", "backup"],
  },
];

export interface Crumb {
  label: string;
  path?: string;
}

export function breadcrumbsFor(pathname: string): Crumb[] {
  const base: Crumb[] = [{ label: "Finanças", path: "/" }];
  if (pathname === "/" || pathname === "") {
    return [...base, { label: "Dashboard" }];
  }
  const route = ROUTES.find((r) => r.path === pathname);
  if (route) return [...base, { label: route.label }];
  return [...base, { label: "Página" }];
}

export function routeByPath(pathname: string): RouteMeta | undefined {
  if (pathname === "" || pathname === "/") return ROUTES[0];
  return ROUTES.find((r) => r.path === pathname);
}

export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}
