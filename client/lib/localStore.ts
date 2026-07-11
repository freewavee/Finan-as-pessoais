/**
 * Persistência no navegador (localStorage).
 * Cada conta tem seus próprios dados; login restaura a sessão.
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

const USERS_KEY = "financas:v4:users";
const SESSION_KEY = "financas:v4:session";
const dataKey = (userId: string) => `financas:v4:data:${userId}`;

export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    }
  } catch {
    /* ignore */
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function yearMonthFromIso(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    return dateIso.slice(0, 7);
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function assertStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Armazenamento local indisponível neste navegador.");
  }
  try {
    const k = "__financas_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
  } catch {
    throw new Error(
      "Não foi possível salvar dados (localStorage bloqueado ou cheio). Libere espaço ou desative modo privado."
    );
  }
  return window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = assertStorage().getItem(key);
    if (raw == null || raw === "") return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    if (e instanceof Error && e.message.includes("Armazenamento")) throw e;
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  const storage = assertStorage();
  const payload = JSON.stringify(value);
  try {
    storage.setItem(key, payload);
  } catch {
    throw new Error(
      "Falha ao gravar dados. O armazenamento do navegador pode estar cheio."
    );
  }
  // Confirma leitura (evita “achou que salvou” e perdeu)
  const check = storage.getItem(key);
  if (check !== payload) {
    throw new Error("Falha ao confirmar gravação dos dados.");
  }
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const material = `${salt}:${password}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const enc = new TextEncoder();
      const buf = await crypto.subtle.digest("SHA-256", enc.encode(material));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* fallback abaixo */
  }
  // Fallback determinístico (ambientes sem SubtleCrypto)
  let h = 2166136261;
  for (let i = 0; i < material.length; i++) {
    h ^= material.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = (h >>> 0).toString(16).padStart(8, "0");
  for (let round = 0; round < 7; round++) {
    h = Math.imul(h ^ material.charCodeAt(round % material.length), 16777619);
    out += (h >>> 0).toString(16).padStart(8, "0");
  }
  return out;
}

export function listUsers(): StoredUser[] {
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export function saveUsers(users: StoredUser[]): void {
  writeJson(USERS_KEY, users);
}

export function getSessionUserId(): string | null {
  const v = readJson<string | null>(SESSION_KEY, null);
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function setSessionUserId(userId: string | null): void {
  if (!userId) {
    try {
      assertStorage().removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  writeJson(SESSION_KEY, userId);
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

function normalizeUserData(raw: Partial<UserData> | null | undefined, profileName?: string): UserData {
  const base = emptyUserData(profileName);
  if (!raw || typeof raw !== "object") return base;
  return {
    accounts: Array.isArray(raw.accounts) ? raw.accounts : base.accounts,
    categories: Array.isArray(raw.categories) ? raw.categories : base.categories,
    paymentMethods: Array.isArray(raw.paymentMethods)
      ? raw.paymentMethods
      : base.paymentMethods,
    transactions: Array.isArray(raw.transactions) ? raw.transactions : base.transactions,
    goals: Array.isArray(raw.goals) ? raw.goals : base.goals,
    contributions: Array.isArray(raw.contributions) ? raw.contributions : base.contributions,
    investments: Array.isArray(raw.investments) ? raw.investments : base.investments,
    settings: raw.settings && typeof raw.settings === "object"
      ? { ...base.settings, ...raw.settings }
      : base.settings,
    periods: Array.isArray(raw.periods) ? raw.periods : base.periods,
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
  const raw = readJson<Partial<UserData> | null>(dataKey(userId), null);
  if (!raw) {
    const fresh = seedDefaults(emptyUserData());
    saveUserData(userId, fresh);
    return fresh;
  }
  return normalizeUserData(raw);
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
  // Garante que a conta ainda existe
  if (!listUsers().some((u) => u.id === id)) {
    setSessionUserId(null);
    const err = new Error("Sessão inválida. Faça login novamente.") as Error & {
      status: number;
    };
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

/** Cria conta + dados iniciais e inicia sessão. */
export async function createAccount(
  name: string,
  email: string,
  password: string
): Promise<StoredUser> {
  assertStorage();
  const users = listUsers();
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("Informe um email válido");
  }
  if (users.some((u) => u.email === normalized)) {
    throw new Error("Este email já está cadastrado");
  }
  if (!name.trim()) throw new Error("Informe seu nome");
  if (password.length < 6) throw new Error("Senha deve ter ao menos 6 caracteres");

  const salt = uid();
  const passwordHash = await hashPassword(password, salt);
  const user: StoredUser = {
    id: uid(),
    email: normalized,
    name: name.trim(),
    passwordHash,
    salt,
    image: null,
    createdAt: nowIso(),
  };

  const nextUsers = [...users, user];
  saveUsers(nextUsers);

  const data = seedDefaults(emptyUserData(user.name), user.name);
  saveUserData(user.id, data);
  setSessionUserId(user.id);

  // Verificação ponta a ponta
  const checkUser = listUsers().find((u) => u.id === user.id);
  const checkData = loadUserData(user.id);
  const checkSession = getSessionUserId();
  if (!checkUser || checkSession !== user.id) {
    throw new Error("Conta criada, mas a sessão não persistiu. Tente de novo.");
  }
  if (checkData.accounts.length === 0 || checkData.categories.length === 0) {
    throw new Error("Conta criada, mas os dados iniciais falharam. Tente de novo.");
  }

  return user;
}

/** Valida senha e inicia sessão. */
export async function loginAccount(email: string, password: string): Promise<StoredUser> {
  assertStorage();
  const user = listUsers().find((u) => u.email === email.toLowerCase().trim());
  if (!user) throw new Error("Email ou senha incorretos");
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) throw new Error("Email ou senha incorretos");

  // Garante dados do usuário (conta antiga / migração)
  const data = loadUserData(user.id);
  if (data.accounts.length === 0 || data.categories.length === 0) {
    saveUserData(user.id, seedDefaults(data, user.name));
  }

  setSessionUserId(user.id);
  if (getSessionUserId() !== user.id) {
    throw new Error("Não foi possível manter a sessão. Verifique o armazenamento do navegador.");
  }
  return user;
}

export function logoutAccount(): void {
  setSessionUserId(null);
}
