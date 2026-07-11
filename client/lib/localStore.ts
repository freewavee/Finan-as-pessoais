/**
 * Persistência 100% no browser (localStorage).
 * Plug-and-play: zero DATABASE_URL, zero Neon, zero backend de banco.
 */

export type AccountType = "CORRENTE" | "POUPANCA" | "CARTEIRA" | "INVESTIMENTO" | "OUTRO";
export type CategoryType = "ENTRADA" | "SAIDA";
export type TransactionType = "ENTRADA" | "SAIDA";
export type GoalStatus = "ATIVA" | "CONCLUIDA" | "ARQUIVADA";
export type GoalPriority = "BAIXA" | "MEDIA" | "ALTA";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  image?: string | null;
  createdAt: string;
}

export interface StoredAccount {
  id: string;
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  type: CategoryType;
  archived: boolean;
  createdAt: string;
}

export interface StoredPaymentMethod {
  id: string;
  name: string;
  archived: boolean;
  createdAt: string;
}

export interface StoredTransaction {
  id: string;
  date: string;
  amountCents: number;
  type: TransactionType;
  description: string;
  notes: string | null;
  accountId: string;
  categoryId: string;
  paymentMethodId: string;
  monthPeriodId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredGoalContribution {
  id: string;
  goalId: string;
  amountCents: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface StoredGoal {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priority: GoalPriority;
  icon: string | null;
  color: string;
  targetCents: number;
  currentCents: number;
  deadline: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredInvestment {
  id: string;
  institution: string;
  type: string;
  appliedAt: string;
  appliedCents: number;
  currentCents: number;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSettings {
  id: string;
  profileName: string;
  profilePhoto: string | null;
  theme: string;
  language: string;
  currency: string;
  monthStartDay: number;
  notificationsEnabled: boolean;
}

export interface StoredPeriod {
  id: string;
  yearMonth: string;
  status: "ABERTO" | "FECHADO" | string;
  initialBalanceCents: number;
  finalBalanceCents: number | null;
  closedAt: string | null;
  snapshotJson: string | null;
  createdAt: string;
}

export interface UserData {
  accounts: StoredAccount[];
  categories: StoredCategory[];
  paymentMethods: StoredPaymentMethod[];
  transactions: StoredTransaction[];
  goals: StoredGoal[];
  contributions: StoredGoalContribution[];
  investments: StoredInvestment[];
  settings: StoredSettings;
  periods: StoredPeriod[];
}

const USERS_KEY = "financas:users";
const SESSION_KEY = "financas:session";
const dataKey = (userId: string) => `financas:data:${userId}`;

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function yearMonthFromIso(dateIso: string): string {
  const d = new Date(dateIso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function listUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_KEY, []);
}

export function saveUsers(users: StoredUser[]): void {
  writeJson(USERS_KEY, users);
}

export function getSessionUserId(): string | null {
  return readJson<string | null>(SESSION_KEY, null);
}

export function setSessionUserId(userId: string | null): void {
  if (!userId) localStorage.removeItem(SESSION_KEY);
  else writeJson(SESSION_KEY, userId);
}

export function emptyUserData(profileName = "Usuario"): UserData {
  return {
    accounts: [],
    categories: [],
    paymentMethods: [],
    transactions: [],
    goals: [],
    contributions: [],
    investments: [],
    settings: {
      id: uid(),
      profileName,
      profilePhoto: null,
      theme: "dark",
      language: "pt-BR",
      currency: "BRL",
      monthStartDay: 1,
      notificationsEnabled: true,
    },
    periods: [],
  };
}

export function seedDefaults(data: UserData, profileName?: string): UserData {
  const t = nowIso();
  if (data.accounts.length === 0) {
    data.accounts.push({
      id: uid(),
      name: "Carteira",
      type: "CARTEIRA",
      initialBalanceCents: 0,
      archived: false,
      createdAt: t,
      updatedAt: t,
    });
  }
  if (data.categories.length === 0) {
    const cats: Array<Omit<StoredCategory, "id" | "createdAt" | "archived">> = [
      { name: "Salário", type: "ENTRADA", color: "#2E7D5B", icon: "banknote" },
      { name: "Outras entradas", type: "ENTRADA", color: "#4C9A73", icon: "plus-circle" },
      { name: "Alimentação", type: "SAIDA", color: "#B5484D", icon: "utensils" },
      { name: "Transporte", type: "SAIDA", color: "#C97A3D", icon: "car" },
      { name: "Moradia", type: "SAIDA", color: "#7A5FB5", icon: "home" },
      { name: "Lazer", type: "SAIDA", color: "#B5A23D", icon: "sparkles" },
      { name: "Outras saídas", type: "SAIDA", color: "#8A5A5A", icon: "minus-circle" },
    ];
    data.categories = cats.map((c) => ({
      ...c,
      id: uid(),
      archived: false,
      createdAt: t,
    }));
  }
  if (data.paymentMethods.length === 0) {
    data.paymentMethods = ["PIX", "Débito", "Crédito", "Dinheiro"].map((name) => ({
      id: uid(),
      name,
      archived: false,
      createdAt: t,
    }));
  }
  if (profileName) data.settings.profileName = profileName;
  return data;
}

export function loadUserData(userId: string): UserData {
  const data = readJson<UserData | null>(dataKey(userId), null);
  if (!data) {
    const fresh = seedDefaults(emptyUserData());
    saveUserData(userId, fresh);
    return fresh;
  }
  return data;
}

export function saveUserData(userId: string, data: UserData): void {
  writeJson(dataKey(userId), data);
}

export function requireUserId(): string {
  const id = getSessionUserId();
  if (!id) {
    const err = new Error("Não autenticado") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return id;
}

export function ensurePeriod(data: UserData, yearMonth: string): StoredPeriod {
  let p = data.periods.find((x) => x.yearMonth === yearMonth);
  if (p) return p;
  p = {
    id: uid(),
    yearMonth,
    status: "ABERTO",
    initialBalanceCents: 0,
    finalBalanceCents: null,
    closedAt: null,
    snapshotJson: null,
    createdAt: nowIso(),
  };
  data.periods.push(p);
  return p;
}
