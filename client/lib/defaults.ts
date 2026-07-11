import {
  Banknote,
  Briefcase,
  TrendingUp,
  Tag,
  Gift,
  MoreHorizontal,
  ShoppingCart,
  UtensilsCrossed,
  Bike,
  Sandwich,
  Home,
  Building2,
  Droplet,
  Zap,
  Wifi,
  Car,
  Fuel,
  Bus,
  SquareParking,
  Pill,
  ShieldPlus,
  Stethoscope,
  Dumbbell,
  GraduationCap,
  BookOpen,
  Book,
  Clapperboard,
  Tv,
  Gamepad2,
  Plane,
  Landmark,
  Receipt,
  MinusCircle,
  PlusCircle,
  Sparkles,
  Utensils,
  LucideIcon,
} from "lucide-react";
import { CategoryType } from "../types";

export const ICON_MAP: Record<string, LucideIcon> = {
  banknote: Banknote,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  tag: Tag,
  gift: Gift,
  "more-horizontal": MoreHorizontal,
  "shopping-cart": ShoppingCart,
  "utensils-crossed": UtensilsCrossed,
  bike: Bike,
  sandwich: Sandwich,
  home: Home,
  "building-2": Building2,
  droplet: Droplet,
  zap: Zap,
  wifi: Wifi,
  car: Car,
  fuel: Fuel,
  bus: Bus,
  "square-parking": SquareParking,
  pill: Pill,
  "shield-plus": ShieldPlus,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  book: Book,
  clapperboard: Clapperboard,
  tv: Tv,
  "gamepad-2": Gamepad2,
  plane: Plane,
  landmark: Landmark,
  receipt: Receipt,
  "minus-circle": MinusCircle,
  "plus-circle": PlusCircle,
  sparkles: Sparkles,
  utensils: Utensils,
};

export function getCategoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Tag;
  return ICON_MAP[icon] ?? Tag;
}

export const AVAILABLE_ICON_KEYS = Object.keys(ICON_MAP);

/**
 * "Grupo" é um conceito só do frontend — o schema de Category (Fase 1) não
 * tem campo de grupo/categoria-pai, e como o backend está intocável nesta
 * fase, não dá pra persistir isso no banco. Isso serve só pra organizar a
 * exibição na tela de Categorias e pra colorir/iconizar o botão de "criar
 * categorias padrão". Categorias criadas manualmente pelo usuário não têm
 * grupo (caem em "Outras").
 */
export interface DefaultCategory {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  group: string;
}

const RECEITA_COLOR = "#22c55e";

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Receitas
  { name: "Salário", type: "ENTRADA", icon: "banknote", color: RECEITA_COLOR, group: "Receitas" },
  { name: "Freelance", type: "ENTRADA", icon: "briefcase", color: "#16a34a", group: "Receitas" },
  { name: "Investimentos", type: "ENTRADA", icon: "trending-up", color: "#0d9488", group: "Receitas" },
  { name: "Venda", type: "ENTRADA", icon: "tag", color: "#84cc16", group: "Receitas" },
  { name: "Presente", type: "ENTRADA", icon: "gift", color: "#4ade80", group: "Receitas" },
  { name: "Outros", type: "ENTRADA", icon: "more-horizontal", color: "#65a30d", group: "Receitas" },
  // Alimentação
  { name: "Mercado", type: "SAIDA", icon: "shopping-cart", color: "#f97316", group: "Alimentação" },
  { name: "Restaurante", type: "SAIDA", icon: "utensils-crossed", color: "#fb923c", group: "Alimentação" },
  { name: "Delivery", type: "SAIDA", icon: "bike", color: "#fdba74", group: "Alimentação" },
  { name: "Lanche", type: "SAIDA", icon: "sandwich", color: "#ea580c", group: "Alimentação" },
  // Moradia
  { name: "Aluguel", type: "SAIDA", icon: "home", color: "#a855f7", group: "Moradia" },
  { name: "Condomínio", type: "SAIDA", icon: "building-2", color: "#9333ea", group: "Moradia" },
  { name: "Água", type: "SAIDA", icon: "droplet", color: "#38bdf8", group: "Moradia" },
  { name: "Energia", type: "SAIDA", icon: "zap", color: "#facc15", group: "Moradia" },
  { name: "Internet", type: "SAIDA", icon: "wifi", color: "#c084fc", group: "Moradia" },
  // Transporte
  { name: "Uber", type: "SAIDA", icon: "car", color: "#ef4444", group: "Transporte" },
  { name: "Combustível", type: "SAIDA", icon: "fuel", color: "#f87171", group: "Transporte" },
  { name: "Ônibus", type: "SAIDA", icon: "bus", color: "#fb7185", group: "Transporte" },
  { name: "Estacionamento", type: "SAIDA", icon: "square-parking", color: "#e11d48", group: "Transporte" },
  // Saúde
  { name: "Farmácia", type: "SAIDA", icon: "pill", color: "#ec4899", group: "Saúde" },
  { name: "Plano", type: "SAIDA", icon: "shield-plus", color: "#db2777", group: "Saúde" },
  { name: "Consulta", type: "SAIDA", icon: "stethoscope", color: "#f472b6", group: "Saúde" },
  { name: "Academia", type: "SAIDA", icon: "dumbbell", color: "#be185d", group: "Saúde" },
  // Educação
  { name: "Faculdade", type: "SAIDA", icon: "graduation-cap", color: "#6366f1", group: "Educação" },
  { name: "Cursos", type: "SAIDA", icon: "book-open", color: "#818cf8", group: "Educação" },
  { name: "Livros", type: "SAIDA", icon: "book", color: "#4f46e5", group: "Educação" },
  // Lazer
  { name: "Cinema", type: "SAIDA", icon: "clapperboard", color: "#06b6d4", group: "Lazer" },
  { name: "Streaming", type: "SAIDA", icon: "tv", color: "#22d3ee", group: "Lazer" },
  { name: "Jogos", type: "SAIDA", icon: "gamepad-2", color: "#0891b2", group: "Lazer" },
  { name: "Viagens", type: "SAIDA", icon: "plane", color: "#67e8f9", group: "Lazer" },
  // Outros
  { name: "Diversos", type: "SAIDA", icon: "more-horizontal", color: "#94a3b8", group: "Outros" },
  { name: "Impostos", type: "SAIDA", icon: "landmark", color: "#64748b", group: "Outros" },
];

export const DEFAULT_PAYMENT_METHODS = ["Crédito", "Débito", "Pix", "Dinheiro"];
