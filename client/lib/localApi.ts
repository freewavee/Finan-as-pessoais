/**
 * API local — mesma interface do antigo backend Express/Prisma.
 * Tudo roda no browser; deploy Vercel = site estático.
 */
import type {
  Account,
  Category,
  PaymentMethod,
  DashboardSummary,
  TransactionListResponse,
  NewTransactionInput,
  NewAccountInput,
  Goal,
  Investment,
  InvestmentsSummary,
  Settings,
  MonthPeriod,
  ReportOverview,
  InvestmentType,
  GoalPriority,
  GoalStatus,
  Transaction,
} from "../types";
import {
  ensurePeriod,
  getSessionUserId,
  hashPassword,
  listUsers,
  loadUserData,
  nowIso,
  requireUserId,
  saveUserData,
  saveUsers,
  seedDefaults,
  setSessionUserId,
  uid,
  yearMonthFromIso,
  emptyUserData,
  type StoredGoal,
  type StoredInvestment,
  type StoredTransaction,
  type UserData,
} from "./localStore";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface TransactionFilters {
  month?: string;
  accountId?: string;
  categoryId?: string;
  type?: "ENTRADA" | "SAIDA";
  page?: number;
  pageSize?: number;
}

// ─── helpers ─────────────────────────────────────────────────────

function withData<T>(fn: (userId: string, data: UserData) => T): T {
  const userId = requireUserId();
  const data = loadUserData(userId);
  const result = fn(userId, data);
  saveUserData(userId, data);
  return result;
}

function mapAccount(a: UserData["accounts"][0]): Account {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    initialBalanceCents: a.initialBalanceCents,
    archived: a.archived,
  };
}

function mapCategory(c: UserData["categories"][0]): Category {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
    archived: c.archived,
  };
}

function mapPm(p: UserData["paymentMethods"][0]): PaymentMethod {
  return { id: p.id, name: p.name, archived: p.archived };
}

function hydrateTx(data: UserData, t: StoredTransaction): Transaction {
  const account = data.accounts.find((a) => a.id === t.accountId);
  const category = data.categories.find((c) => c.id === t.categoryId);
  const paymentMethod = data.paymentMethods.find((p) => p.id === t.paymentMethodId);
  if (!account || !category || !paymentMethod) {
    throw new ApiError("Transação com referências inválidas", 500);
  }
  return {
    id: t.id,
    date: t.date,
    amountCents: t.amountCents,
    type: t.type,
    description: t.description,
    notes: t.notes,
    accountId: t.accountId,
    categoryId: t.categoryId,
    paymentMethodId: t.paymentMethodId,
    account: mapAccount(account),
    category: mapCategory(category),
    paymentMethod: mapPm(paymentMethod),
  };
}

function goalProgress(target: number, current: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 1000) / 10);
}

function forecastGoal(g: StoredGoal): string | null {
  if (g.currentCents >= g.targetCents) return null;
  const remaining = g.targetCents - g.currentCents;
  const daysElapsed = Math.max(
    1,
    Math.floor((Date.now() - new Date(g.createdAt).getTime()) / 86400000)
  );
  if (g.currentCents <= 0) return g.deadline;
  const rate = g.currentCents / daysElapsed;
  if (rate <= 0) return g.deadline;
  return new Date(Date.now() + Math.ceil(remaining / rate) * 86400000).toISOString();
}

function enrichGoal(data: UserData, g: StoredGoal): Goal {
  const contributions = data.contributions
    .filter((c) => c.goalId === g.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    category: g.category,
    priority: g.priority,
    icon: g.icon,
    color: g.color,
    targetCents: g.targetCents,
    currentCents: g.currentCents,
    deadline: g.deadline,
    status: g.status,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    percentComplete: goalProgress(g.targetCents, g.currentCents),
    forecastDate: forecastGoal(g),
    contributions: contributions.map((c) => ({
      id: c.id,
      goalId: c.goalId,
      amountCents: c.amountCents,
      date: c.date,
      notes: c.notes,
    })),
  };
}

function enrichInvestment(inv: StoredInvestment): Investment {
  const rentabilidadeCents = inv.currentCents - inv.appliedCents;
  const rentabilidadePercent =
    inv.appliedCents > 0
      ? Math.round((rentabilidadeCents / inv.appliedCents) * 10000) / 100
      : 0;
  return {
    id: inv.id,
    institution: inv.institution,
    type: inv.type as InvestmentType,
    appliedAt: inv.appliedAt,
    appliedCents: inv.appliedCents,
    currentCents: inv.currentCents,
    notes: inv.notes,
    archived: inv.archived,
    rentabilidadeCents,
    rentabilidadePercent,
  };
}

function investmentsSummary(data: UserData): InvestmentsSummary {
  const investments = data.investments.filter((i) => !i.archived);
  let applied = 0;
  let current = 0;
  const byType: Record<string, { appliedCents: number; currentCents: number; count: number }> = {};
  const byInstitution: Record<
    string,
    { appliedCents: number; currentCents: number; count: number }
  > = {};

  for (const inv of investments) {
    applied += inv.appliedCents;
    current += inv.currentCents;
    if (!byType[inv.type]) byType[inv.type] = { appliedCents: 0, currentCents: 0, count: 0 };
    byType[inv.type].appliedCents += inv.appliedCents;
    byType[inv.type].currentCents += inv.currentCents;
    byType[inv.type].count += 1;
    if (!byInstitution[inv.institution]) {
      byInstitution[inv.institution] = { appliedCents: 0, currentCents: 0, count: 0 };
    }
    byInstitution[inv.institution].appliedCents += inv.appliedCents;
    byInstitution[inv.institution].currentCents += inv.currentCents;
    byInstitution[inv.institution].count += 1;
  }

  return {
    count: investments.length,
    patrimonioInvestidoCents: current,
    valorAplicadoCents: applied,
    lucroCents: Math.max(0, current - applied),
    prejuizoCents: Math.max(0, applied - current),
    rentabilidadeCents: current - applied,
    rentabilidadePercent:
      applied > 0 ? Math.round(((current - applied) / applied) * 10000) / 100 : 0,
    byType: Object.entries(byType).map(([type, v]) => ({ type, ...v })),
    byInstitution: Object.entries(byInstitution).map(([institution, v]) => ({
      institution,
      ...v,
    })),
  };
}

function goalsSummary(data: UserData) {
  const active = data.goals.filter((g) => g.status === "ATIVA").length;
  const completed = data.goals.filter((g) => g.status === "CONCLUIDA").length;
  const archived = data.goals.filter((g) => g.status === "ARQUIVADA").length;
  const relevant = data.goals.filter((g) => g.status === "ATIVA" || g.status === "CONCLUIDA");
  const target = relevant.reduce((s, g) => s + g.targetCents, 0);
  const current = relevant.reduce((s, g) => s + g.currentCents, 0);
  return {
    activeCount: active,
    completedCount: completed,
    archivedCount: archived,
    totalTargetCents: target,
    totalCurrentCents: current,
    overallPercent: target > 0 ? Math.round((current / target) * 1000) / 10 : 0,
  };
}

function mapPeriod(p: UserData["periods"][0]): MonthPeriod {
  return {
    id: p.id,
    yearMonth: p.yearMonth,
    status: p.status,
    initialBalanceCents: p.initialBalanceCents,
    finalBalanceCents: p.finalBalanceCents,
    closedAt: p.closedAt,
    snapshotJson: p.snapshotJson,
    createdAt: p.createdAt,
  };
}

// ─── Auth ────────────────────────────────────────────────────────

export async function authSession() {
  const userId = getSessionUserId();
  if (!userId) return { user: null };
  const user = listUsers().find((u) => u.id === userId);
  if (!user) {
    setSessionUserId(null);
    return { user: null };
  }
  return {
    user: { id: user.id, email: user.email, name: user.name, image: user.image ?? null },
  };
}

export async function authRegister(name: string, email: string, password: string) {
  const users = listUsers();
  const normalized = email.toLowerCase().trim();
  if (users.some((u) => u.email === normalized)) {
    throw new ApiError("Este email já está cadastrado", 409);
  }
  if (password.length < 6) throw new ApiError("Senha deve ter ao menos 6 caracteres", 400);

  const salt = uid();
  const passwordHash = await hashPassword(password, salt);
  const user = {
    id: uid(),
    email: normalized,
    name: name.trim(),
    passwordHash,
    salt,
    image: null as string | null,
    createdAt: nowIso(),
  };
  users.push(user);
  saveUsers(users);

  const data = seedDefaults(emptyUserData(user.name), user.name);
  saveUserData(user.id, data);
  setSessionUserId(user.id);

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
    message: "Conta criada com sucesso",
  };
}

export async function authLogin(email: string, password: string) {
  const user = listUsers().find((u) => u.email === email.toLowerCase().trim());
  if (!user) throw new ApiError("Email ou senha incorretos", 401);
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) throw new ApiError("Email ou senha incorretos", 401);
  setSessionUserId(user.id);
  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function authLogout() {
  setSessionUserId(null);
  return { ok: true };
}

// ─── API surface ─────────────────────────────────────────────────

export const api = {
  getDashboard: async (month?: string): Promise<DashboardSummary> => {
    const userId = requireUserId();
    const data = loadUserData(userId);
    const ref = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
    const yearMonth = month ?? yearMonthFromIso(ref.toISOString());

    const accounts = data.accounts.filter((a) => !a.archived);
    const initialBalanceCents = accounts.reduce((s, a) => s + a.initialBalanceCents, 0);

    let totalEntradas = 0;
    let totalSaidas = 0;
    let receitasMesCents = 0;
    let despesasMesCents = 0;

    for (const t of data.transactions) {
      const ym = yearMonthFromIso(t.date);
      if (t.type === "ENTRADA") {
        totalEntradas += t.amountCents;
        if (ym === yearMonth) receitasMesCents += t.amountCents;
      } else {
        totalSaidas += t.amountCents;
        if (ym === yearMonth) despesasMesCents += t.amountCents;
      }
    }

    const saldoConsolidadoCents = initialBalanceCents + totalEntradas - totalSaidas;
    const saldoMesCents = receitasMesCents - despesasMesCents;
    const inv = investmentsSummary(data);
    const goals = goalsSummary(data);

    const lastTransactions = [...data.transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((t) => hydrateTx(data, t));

    const topGoals = data.goals
      .filter((g) => g.status === "ATIVA")
      .sort((a, b) => {
        const p = { ALTA: 0, MEDIA: 1, BAIXA: 2 } as Record<string, number>;
        return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
      })
      .slice(0, 5)
      .map((g) => enrichGoal(data, g));

    const now = Date.now();
    const in60 = now + 60 * 86400000;
    const upcoming = data.goals
      .filter((g) => {
        if (g.status !== "ATIVA" || !g.deadline) return false;
        const d = new Date(g.deadline).getTime();
        return d >= now && d <= in60;
      })
      .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
      .slice(0, 5)
      .map((g) => enrichGoal(data, g));

    return {
      referenceMonth: yearMonth,
      saldoAtualCents: saldoConsolidadoCents,
      saldoConsolidadoCents,
      patrimonioLiquidoCents: saldoConsolidadoCents + inv.patrimonioInvestidoCents,
      receitasMesCents,
      despesasMesCents,
      saldoMesCents,
      economiaAcumuladaCents: totalEntradas - totalSaidas,
      lastTransactions,
      investments: inv,
      goals: { ...goals, top: topGoals, upcomingDeadlines: upcoming },
      monthlySummary: {
        yearMonth,
        receitasCents: receitasMesCents,
        despesasCents: despesasMesCents,
        economiaCents: saldoMesCents,
        saldoCents: saldoConsolidadoCents,
      },
    };
  },

  listAccounts: async () => {
    const data = loadUserData(requireUserId());
    return data.accounts.filter((a) => !a.archived).map(mapAccount);
  },

  createAccount: async (input: NewAccountInput) =>
    withData((_uid, data) => {
      const t = nowIso();
      const a = {
        id: uid(),
        name: input.name,
        type: input.type,
        initialBalanceCents: input.initialBalanceCents ?? 0,
        archived: false,
        createdAt: t,
        updatedAt: t,
      };
      data.accounts.push(a);
      return mapAccount(a);
    }),

  updateAccount: async (id: string, input: Partial<NewAccountInput>) =>
    withData((_uid, data) => {
      const a = data.accounts.find((x) => x.id === id);
      if (!a || a.archived) throw new ApiError("Conta não encontrada", 404);
      if (input.name !== undefined) a.name = input.name;
      if (input.type !== undefined) a.type = input.type;
      if (input.initialBalanceCents !== undefined) a.initialBalanceCents = input.initialBalanceCents;
      a.updatedAt = nowIso();
      return mapAccount(a);
    }),

  archiveAccount: async (id: string) =>
    withData((_uid, data) => {
      const a = data.accounts.find((x) => x.id === id);
      if (!a) throw new ApiError("Conta não encontrada", 404);
      a.archived = true;
      a.updatedAt = nowIso();
      return mapAccount(a);
    }),

  listCategories: async () => {
    const data = loadUserData(requireUserId());
    return data.categories.filter((c) => !c.archived).map(mapCategory);
  },

  createCategory: async (input: Partial<Category>) =>
    withData((_uid, data) => {
      const c = {
        id: uid(),
        name: input.name ?? "Categoria",
        icon: input.icon ?? null,
        color: input.color ?? "#6B7280",
        type: (input.type as "ENTRADA" | "SAIDA") ?? "SAIDA",
        archived: false,
        createdAt: nowIso(),
      };
      data.categories.push(c);
      return mapCategory(c);
    }),

  updateCategory: async (id: string, input: Partial<Category>) =>
    withData((_uid, data) => {
      const c = data.categories.find((x) => x.id === id);
      if (!c || c.archived) throw new ApiError("Categoria não encontrada", 404);
      if (input.name !== undefined) c.name = input.name;
      if (input.icon !== undefined) c.icon = input.icon;
      if (input.color !== undefined) c.color = input.color;
      if (input.type !== undefined) c.type = input.type;
      return mapCategory(c);
    }),

  archiveCategory: async (id: string) =>
    withData((_uid, data) => {
      const c = data.categories.find((x) => x.id === id);
      if (!c) throw new ApiError("Categoria não encontrada", 404);
      c.archived = true;
      return mapCategory(c);
    }),

  listPaymentMethods: async () => {
    const data = loadUserData(requireUserId());
    return data.paymentMethods.filter((p) => !p.archived).map(mapPm);
  },

  createPaymentMethod: async (input: { name: string }) =>
    withData((_uid, data) => {
      const p = { id: uid(), name: input.name, archived: false, createdAt: nowIso() };
      data.paymentMethods.push(p);
      return mapPm(p);
    }),

  updatePaymentMethod: async (id: string, input: { name: string }) =>
    withData((_uid, data) => {
      const p = data.paymentMethods.find((x) => x.id === id);
      if (!p || p.archived) throw new ApiError("Forma de pagamento não encontrada", 404);
      p.name = input.name;
      return mapPm(p);
    }),

  archivePaymentMethod: async (id: string) =>
    withData((_uid, data) => {
      const p = data.paymentMethods.find((x) => x.id === id);
      if (!p) throw new ApiError("Forma de pagamento não encontrada", 404);
      p.archived = true;
      return mapPm(p);
    }),

  listTransactions: async (filters?: TransactionFilters): Promise<TransactionListResponse> => {
    const data = loadUserData(requireUserId());
    let list = [...data.transactions];
    if (filters?.month) {
      list = list.filter((t) => yearMonthFromIso(t.date) === filters.month);
    }
    if (filters?.accountId) list = list.filter((t) => t.accountId === filters.accountId);
    if (filters?.categoryId) list = list.filter((t) => t.categoryId === filters.categoryId);
    if (filters?.type) list = list.filter((t) => t.type === filters.type);

    list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const total = list.length;
    const slice = list.slice((page - 1) * pageSize, page * pageSize);

    return {
      transactions: slice.map((t) => hydrateTx(data, t)),
      total,
      page,
      pageSize,
    };
  },

  createTransaction: async (input: NewTransactionInput) =>
    withData((_uid, data) => {
      const account = data.accounts.find((a) => a.id === input.accountId && !a.archived);
      const category = data.categories.find((c) => c.id === input.categoryId && !c.archived);
      const pm = data.paymentMethods.find((p) => p.id === input.paymentMethodId && !p.archived);
      if (!account) throw new ApiError("Conta inválida", 400);
      if (!category) throw new ApiError("Categoria inválida", 400);
      if (!pm) throw new ApiError("Forma de pagamento inválida", 400);

      const ym = yearMonthFromIso(input.date);
      const period = ensurePeriod(data, ym);
      if (period.status === "FECHADO") {
        throw new ApiError("Mês fechado — reabra o período para lançar", 400);
      }

      const t: StoredTransaction = {
        id: uid(),
        date: input.date,
        amountCents: input.amountCents,
        type: input.type,
        description: input.description,
        notes: null,
        accountId: input.accountId,
        categoryId: input.categoryId,
        paymentMethodId: input.paymentMethodId,
        monthPeriodId: period.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.transactions.push(t);
      return hydrateTx(data, t);
    }),

  deleteTransaction: async (id: string) =>
    withData((_uid, data) => {
      const idx = data.transactions.findIndex((t) => t.id === id);
      if (idx < 0) throw new ApiError("Transação não encontrada", 404);
      const t = data.transactions[idx];
      const period = data.periods.find((p) => p.id === t.monthPeriodId);
      if (period?.status === "FECHADO") {
        throw new ApiError("Mês fechado — reabra o período para excluir", 400);
      }
      data.transactions.splice(idx, 1);
    }),

  listGoals: async (includeArchived?: boolean) => {
    const data = loadUserData(requireUserId());
    return data.goals
      .filter((g) => includeArchived || g.status !== "ARQUIVADA")
      .map((g) => enrichGoal(data, g));
  },

  createGoal: async (input: {
    name: string;
    description?: string | null;
    category?: string;
    priority?: GoalPriority;
    icon?: string | null;
    color?: string;
    targetCents: number;
    currentCents?: number;
    deadline?: string | null;
    status?: GoalStatus;
  }) =>
    withData((_uid, data) => {
      const t = nowIso();
      const g: StoredGoal = {
        id: uid(),
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? "Geral",
        priority: input.priority ?? "MEDIA",
        icon: input.icon ?? "target",
        color: input.color ?? "#3B82F6",
        targetCents: input.targetCents,
        currentCents: input.currentCents ?? 0,
        deadline: input.deadline ?? null,
        status: input.status ?? "ATIVA",
        createdAt: t,
        updatedAt: t,
      };
      data.goals.push(g);
      return enrichGoal(data, g);
    }),

  updateGoal: async (id: string, input: Record<string, unknown>) =>
    withData((_uid, data) => {
      const g = data.goals.find((x) => x.id === id);
      if (!g) throw new ApiError("Meta não encontrada", 404);
      const keys = [
        "name",
        "description",
        "category",
        "priority",
        "icon",
        "color",
        "targetCents",
        "currentCents",
        "deadline",
        "status",
      ] as const;
      for (const k of keys) {
        if (input[k] !== undefined) (g as any)[k] = input[k];
      }
      g.updatedAt = nowIso();
      return enrichGoal(data, g);
    }),

  archiveGoal: async (id: string) =>
    withData((_uid, data) => {
      const g = data.goals.find((x) => x.id === id);
      if (!g) throw new ApiError("Meta não encontrada", 404);
      g.status = "ARQUIVADA";
      g.updatedAt = nowIso();
      return enrichGoal(data, g);
    }),

  completeGoal: async (id: string) =>
    withData((_uid, data) => {
      const g = data.goals.find((x) => x.id === id);
      if (!g) throw new ApiError("Meta não encontrada", 404);
      g.status = "CONCLUIDA";
      if (g.currentCents < g.targetCents) g.currentCents = g.targetCents;
      g.updatedAt = nowIso();
      return enrichGoal(data, g);
    }),

  addGoalContribution: async (
    id: string,
    input: { amountCents: number; date?: string; notes?: string | null }
  ) =>
    withData((_uid, data) => {
      const g = data.goals.find((x) => x.id === id);
      if (!g) throw new ApiError("Meta não encontrada", 404);
      const c = {
        id: uid(),
        goalId: id,
        amountCents: input.amountCents,
        date: input.date ?? nowIso(),
        notes: input.notes ?? null,
        createdAt: nowIso(),
      };
      data.contributions.push(c);
      g.currentCents += input.amountCents;
      if (g.currentCents >= g.targetCents) g.status = "CONCLUIDA";
      g.updatedAt = nowIso();
      return { contribution: c, goal: enrichGoal(data, g) };
    }),

  listInvestments: async () => {
    const data = loadUserData(requireUserId());
    return data.investments.filter((i) => !i.archived).map(enrichInvestment);
  },

  getInvestmentsSummary: async () => {
    const data = loadUserData(requireUserId());
    return investmentsSummary(data);
  },

  createInvestment: async (input: {
    institution: string;
    type: InvestmentType;
    appliedAt: string;
    appliedCents: number;
    currentCents: number;
    notes?: string | null;
  }) =>
    withData((_uid, data) => {
      const t = nowIso();
      const inv: StoredInvestment = {
        id: uid(),
        institution: input.institution,
        type: input.type,
        appliedAt: input.appliedAt,
        appliedCents: input.appliedCents,
        currentCents: input.currentCents,
        notes: input.notes ?? null,
        archived: false,
        createdAt: t,
        updatedAt: t,
      };
      data.investments.push(inv);
      return enrichInvestment(inv);
    }),

  updateInvestment: async (id: string, input: Record<string, unknown>) =>
    withData((_uid, data) => {
      const inv = data.investments.find((x) => x.id === id);
      if (!inv || inv.archived) throw new ApiError("Investimento não encontrado", 404);
      for (const k of [
        "institution",
        "type",
        "appliedAt",
        "appliedCents",
        "currentCents",
        "notes",
      ] as const) {
        if (input[k] !== undefined) (inv as any)[k] = input[k];
      }
      inv.updatedAt = nowIso();
      return enrichInvestment(inv);
    }),

  archiveInvestment: async (id: string) =>
    withData((_uid, data) => {
      const inv = data.investments.find((x) => x.id === id);
      if (!inv) throw new ApiError("Investimento não encontrado", 404);
      inv.archived = true;
      inv.updatedAt = nowIso();
      return enrichInvestment(inv);
    }),

  getSettings: async (): Promise<Settings> => {
    const data = loadUserData(requireUserId());
    return { ...data.settings };
  },

  updateSettings: async (input: Partial<Settings>): Promise<Settings> =>
    withData((_uid, data) => {
      data.settings = { ...data.settings, ...input, id: data.settings.id };
      return { ...data.settings };
    }),

  exportBackup: async () => {
    const userId = requireUserId();
    const data = loadUserData(userId);
    return {
      exportedAt: nowIso(),
      version: "4.0.0",
      format: "financas-backup-json",
      storage: "localStorage",
      data: {
        settings: data.settings,
        accounts: data.accounts,
        categories: data.categories,
        paymentMethods: data.paymentMethods,
        transactions: data.transactions.map((t) => hydrateTx(data, t)),
        goals: data.goals.map((g) => enrichGoal(data, g)),
        investments: data.investments.map(enrichInvestment),
        periods: data.periods.map(mapPeriod),
      },
    };
  },

  listPeriods: async () => {
    const data = loadUserData(requireUserId());
    return [...data.periods]
      .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
      .map(mapPeriod);
  },

  getPeriod: async (yearMonth: string) =>
    withData((_uid, data) => mapPeriod(ensurePeriod(data, yearMonth))),

  closePeriod: async (yearMonth: string) =>
    withData((_uid, data) => {
      const p = ensurePeriod(data, yearMonth);
      if (p.status === "FECHADO") throw new ApiError("Período já fechado", 400);

      const accounts = data.accounts.filter((a) => !a.archived);
      const initial = accounts.reduce((s, a) => s + a.initialBalanceCents, 0);
      let ent = 0;
      let sai = 0;
      for (const t of data.transactions) {
        if (yearMonthFromIso(t.date) > yearMonth) continue;
        if (t.type === "ENTRADA") ent += t.amountCents;
        else sai += t.amountCents;
      }
      p.finalBalanceCents = initial + ent - sai;
      p.status = "FECHADO";
      p.closedAt = nowIso();
      p.snapshotJson = JSON.stringify({
        closedAt: p.closedAt,
        finalBalanceCents: p.finalBalanceCents,
      });
      return mapPeriod(p);
    }),

  reopenPeriod: async (yearMonth: string) =>
    withData((_uid, data) => {
      const p = ensurePeriod(data, yearMonth);
      p.status = "ABERTO";
      p.closedAt = null;
      p.finalBalanceCents = null;
      p.snapshotJson = null;
      return mapPeriod(p);
    }),

  getReportOverview: async (year?: number): Promise<ReportOverview> => {
    const data = loadUserData(requireUserId());
    const y = year ?? new Date().getUTCFullYear();
    const months: Record<
      string,
      { entradasCents: number; saidasCents: number; byCategory: Record<string, number> }
    > = {};

    for (let m = 0; m < 12; m++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      months[key] = { entradasCents: 0, saidasCents: 0, byCategory: {} };
    }

    for (const t of data.transactions) {
      const key = yearMonthFromIso(t.date);
      if (!months[key]) continue;
      if (t.type === "ENTRADA") months[key].entradasCents += t.amountCents;
      else {
        months[key].saidasCents += t.amountCents;
        const cat = data.categories.find((c) => c.id === t.categoryId)?.name ?? "Outros";
        months[key].byCategory[cat] = (months[key].byCategory[cat] ?? 0) + t.amountCents;
      }
    }

    const monthly = Object.entries(months).map(([month, v]) => ({
      month,
      entradasCents: v.entradasCents,
      saidasCents: v.saidasCents,
      economiaCents: v.entradasCents - v.saidasCents,
      byCategory: Object.entries(v.byCategory).map(([name, totalCents]) => ({
        name,
        totalCents,
      })),
    }));

    const quarterly = [0, 1, 2, 3].map((qIdx) => {
      const slice = monthly.slice(qIdx * 3, qIdx * 3 + 3);
      return {
        quarter: `Q${qIdx + 1}`,
        entradasCents: slice.reduce((s, m) => s + m.entradasCents, 0),
        saidasCents: slice.reduce((s, m) => s + m.saidasCents, 0),
        economiaCents: slice.reduce((s, m) => s + m.economiaCents, 0),
      };
    });

    const h1 = quarterly.slice(0, 2);
    const h2 = quarterly.slice(2, 4);
    const semesters = [
      {
        semester: "H1",
        entradasCents: h1.reduce((s, q) => s + q.entradasCents, 0),
        saidasCents: h1.reduce((s, q) => s + q.saidasCents, 0),
        economiaCents: h1.reduce((s, q) => s + q.economiaCents, 0),
      },
      {
        semester: "H2",
        entradasCents: h2.reduce((s, q) => s + q.entradasCents, 0),
        saidasCents: h2.reduce((s, q) => s + q.saidasCents, 0),
        economiaCents: h2.reduce((s, q) => s + q.economiaCents, 0),
      },
    ];

    const totalEntradas = monthly.reduce((s, m) => s + m.entradasCents, 0);
    const totalSaidas = monthly.reduce((s, m) => s + m.saidasCents, 0);
    const patrimonioBase = data.accounts
      .filter((a) => !a.archived)
      .reduce((s, a) => s + a.initialBalanceCents, 0);

    return {
      exportMeta: {
        preparedFormats: ["json", "csv", "xlsx", "pdf"],
        implementedFormats: ["json"],
      },
      year: y,
      monthly,
      quarterly,
      semesters,
      annual: {
        receitasCents: totalEntradas,
        despesasCents: totalSaidas,
        fluxoCaixaCents: totalEntradas - totalSaidas,
        patrimonioBaseCents: patrimonioBase,
      },
      investments: investmentsSummary(data),
      goals: goalsSummary(data),
      periods: data.periods
        .filter((p) => p.yearMonth.startsWith(String(y)))
        .map(mapPeriod),
      generatedAt: nowIso(),
    };
  },
};
