/**
 * API sobre Supabase (Auth + Postgres). Única base de dados do app.
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
  AccountType,
  CategoryType,
  TransactionType,
} from "../types";
import { getSupabase, getSupabaseConfigError } from "./supabase";

export class ApiError extends Error {
  constructor(message: string, public status: number = 400) {
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

function sb() {
  const cfg = getSupabaseConfigError();
  if (cfg) throw new ApiError(cfg, 500);
  return getSupabase();
}

function fail(error: { message?: string } | null, fallback: string, status = 400): never {
  throw new ApiError(error?.message || fallback, status);
}

async function requireUserId(): Promise<string> {
  const { data, error } = await sb().auth.getUser();
  if (error || !data.user) throw new ApiError("Não autenticado", 401);
  return data.user.id;
}

function yearMonthFromIso(dateIso: string): string {
  const d = new Date(dateIso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function mapAccount(r: any): Account {
  return {
    id: r.id,
    name: r.name,
    type: r.type as AccountType,
    initialBalanceCents: r.initial_balance_cents,
    archived: r.archived,
  };
}

function mapCategory(r: any): Category {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as CategoryType,
    archived: r.archived,
  };
}

function mapPm(r: any): PaymentMethod {
  return { id: r.id, name: r.name, archived: r.archived };
}

function mapTx(r: any): Transaction {
  return {
    id: r.id,
    date: r.date,
    amountCents: r.amount_cents,
    type: r.type as TransactionType,
    description: r.description,
    notes: r.notes,
    accountId: r.account_id,
    categoryId: r.category_id,
    paymentMethodId: r.payment_method_id,
    account: mapAccount(r.account ?? r.bank_accounts),
    category: mapCategory(r.category ?? r.categories),
    paymentMethod: mapPm(r.payment_method ?? r.payment_methods),
  };
}

function mapPeriod(r: any): MonthPeriod {
  return {
    id: r.id,
    yearMonth: r.year_month,
    status: r.status,
    initialBalanceCents: r.initial_balance_cents,
    finalBalanceCents: r.final_balance_cents,
    closedAt: r.closed_at,
    snapshotJson: r.snapshot_json,
    createdAt: r.created_at,
  };
}

function mapSettings(r: any): Settings {
  return {
    id: r.id,
    profileName: r.profile_name,
    profilePhoto: r.profile_photo,
    theme: r.theme,
    language: r.language,
    currency: r.currency,
    monthStartDay: r.month_start_day,
    notificationsEnabled: r.notifications_enabled,
  };
}

function goalProgress(target: number, current: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 1000) / 10);
}

function forecastGoal(g: {
  target_cents: number;
  current_cents: number;
  deadline: string | null;
  created_at: string;
}): string | null {
  if (g.current_cents >= g.target_cents) return null;
  const remaining = g.target_cents - g.current_cents;
  const daysElapsed = Math.max(
    1,
    Math.floor((Date.now() - new Date(g.created_at).getTime()) / 86400000)
  );
  if (g.current_cents <= 0) return g.deadline;
  const rate = g.current_cents / daysElapsed;
  if (rate <= 0) return g.deadline;
  return new Date(Date.now() + Math.ceil(remaining / rate) * 86400000).toISOString();
}

function mapGoal(r: any, contributions: any[] = []): Goal {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    priority: r.priority as GoalPriority,
    icon: r.icon,
    color: r.color,
    targetCents: r.target_cents,
    currentCents: r.current_cents,
    deadline: r.deadline,
    status: r.status as GoalStatus,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    percentComplete: goalProgress(r.target_cents, r.current_cents),
    forecastDate: forecastGoal(r),
    contributions: contributions.map((c) => ({
      id: c.id,
      goalId: c.goal_id,
      amountCents: c.amount_cents,
      date: c.date,
      notes: c.notes,
    })),
  };
}

function enrichInvestment(r: any): Investment {
  const rentabilidadeCents = r.current_cents - r.applied_cents;
  const rentabilidadePercent =
    r.applied_cents > 0
      ? Math.round((rentabilidadeCents / r.applied_cents) * 10000) / 100
      : 0;
  return {
    id: r.id,
    institution: r.institution,
    type: r.type as InvestmentType,
    appliedAt: r.applied_at,
    appliedCents: r.applied_cents,
    currentCents: r.current_cents,
    notes: r.notes,
    archived: r.archived,
    rentabilidadeCents,
    rentabilidadePercent,
  };
}

function investmentsSummaryFrom(rows: any[]): InvestmentsSummary {
  const investments = rows.filter((i) => !i.archived);
  let applied = 0;
  let current = 0;
  const byType: Record<string, { appliedCents: number; currentCents: number; count: number }> = {};
  const byInstitution: Record<
    string,
    { appliedCents: number; currentCents: number; count: number }
  > = {};

  for (const inv of investments) {
    applied += inv.applied_cents;
    current += inv.current_cents;
    if (!byType[inv.type]) byType[inv.type] = { appliedCents: 0, currentCents: 0, count: 0 };
    byType[inv.type].appliedCents += inv.applied_cents;
    byType[inv.type].currentCents += inv.current_cents;
    byType[inv.type].count += 1;
    if (!byInstitution[inv.institution]) {
      byInstitution[inv.institution] = { appliedCents: 0, currentCents: 0, count: 0 };
    }
    byInstitution[inv.institution].appliedCents += inv.applied_cents;
    byInstitution[inv.institution].currentCents += inv.current_cents;
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

function goalsSummaryFrom(rows: any[]) {
  const active = rows.filter((g) => g.status === "ATIVA").length;
  const completed = rows.filter((g) => g.status === "CONCLUIDA").length;
  const archived = rows.filter((g) => g.status === "ARQUIVADA").length;
  const relevant = rows.filter((g) => g.status === "ATIVA" || g.status === "CONCLUIDA");
  const target = relevant.reduce((s, g) => s + g.target_cents, 0);
  const current = relevant.reduce((s, g) => s + g.current_cents, 0);
  return {
    activeCount: active,
    completedCount: completed,
    archivedCount: archived,
    totalTargetCents: target,
    totalCurrentCents: current,
    overallPercent: target > 0 ? Math.round((current / target) * 1000) / 10 : 0,
  };
}

async function ensurePeriod(userId: string, yearMonth: string) {
  const client = sb();
  const { data: existing } = await client
    .from("month_periods")
    .select("*")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await client
    .from("month_periods")
    .insert({ user_id: userId, year_month: yearMonth, status: "ABERTO" })
    .select("*")
    .single();
  if (error) fail(error, "Erro ao abrir período");
  return data;
}

/** Dados iniciais na primeira conta (idempotente). */
export async function seedUserDefaults(userId: string, profileName?: string) {
  const client = sb();

  const { count: accCount } = await client
    .from("bank_accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!accCount) {
    await client.from("bank_accounts").insert({
      user_id: userId,
      name: "Carteira",
      type: "CARTEIRA",
      initial_balance_cents: 0,
    });
  }

  const { count: catCount } = await client
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!catCount) {
    await client.from("categories").insert([
      { user_id: userId, name: "Salário", type: "ENTRADA", color: "#2E7D5B", icon: "banknote" },
      {
        user_id: userId,
        name: "Outras entradas",
        type: "ENTRADA",
        color: "#4C9A73",
        icon: "plus-circle",
      },
      { user_id: userId, name: "Alimentação", type: "SAIDA", color: "#B5484D", icon: "utensils" },
      { user_id: userId, name: "Transporte", type: "SAIDA", color: "#C97A3D", icon: "car" },
      { user_id: userId, name: "Moradia", type: "SAIDA", color: "#7A5FB5", icon: "home" },
      { user_id: userId, name: "Lazer", type: "SAIDA", color: "#B5A23D", icon: "sparkles" },
      {
        user_id: userId,
        name: "Outras saídas",
        type: "SAIDA",
        color: "#8A5A5A",
        icon: "minus-circle",
      },
    ]);
  }

  const { count: pmCount } = await client
    .from("payment_methods")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!pmCount) {
    await client.from("payment_methods").insert(
      ["PIX", "Débito", "Crédito", "Dinheiro"].map((name) => ({
        user_id: userId,
        name,
      }))
    );
  }

  const { data: settings } = await client
    .from("settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings) {
    await client.from("settings").insert({
      user_id: userId,
      profile_name: profileName || "Usuario",
    });
  }
}

// ─── Auth ────────────────────────────────────────────────────────

export async function authSession() {
  const cfg = getSupabaseConfigError();
  if (cfg) return { user: null, configError: cfg };

  const { data, error } = await sb().auth.getSession();
  if (error || !data.session?.user) return { user: null };

  const u = data.session.user;
  return {
    user: {
      id: u.id,
      email: u.email ?? "",
      name: (u.user_metadata?.name as string) ?? null,
      image: (u.user_metadata?.avatar_url as string) ?? null,
    },
  };
}

export async function authRegister(name: string, email: string, password: string) {
  if (password.length < 6) throw new ApiError("Senha deve ter ao menos 6 caracteres", 400);

  const { data, error } = await sb().auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      data: { name: name.trim() },
    },
  });

  if (error) fail(error, "Falha no registro", 400);
  if (!data.user) throw new ApiError("Falha no registro", 400);

  // Sem sessão = confirmação de email ativa no Supabase
  if (!data.session) {
    throw new ApiError(
      "Conta criada. Confirme o email (ou desative “Confirm email” no Supabase Auth) e faça login.",
      401
    );
  }

  await seedUserDefaults(data.user.id, name.trim());

  return {
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
      name: name.trim(),
    },
    message: "Conta criada com sucesso",
  };
}

export async function authLogin(email: string, password: string) {
  const { data, error } = await sb().auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (error) fail(error, "Email ou senha incorretos", 401);
  if (!data.user) throw new ApiError("Email ou senha incorretos", 401);

  await seedUserDefaults(
    data.user.id,
    (data.user.user_metadata?.name as string) || undefined
  );

  return {
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
      name: (data.user.user_metadata?.name as string) ?? null,
    },
  };
}

export async function authLogout() {
  await sb().auth.signOut();
  return { ok: true };
}

// ─── API ─────────────────────────────────────────────────────────

export const api = {
  getDashboard: async (month?: string): Promise<DashboardSummary> => {
    const userId = await requireUserId();
    const client = sb();
    const ref = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
    const yearMonth = month ?? yearMonthFromIso(ref.toISOString());
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
    const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));

    const [
      { data: accounts },
      { data: allTx },
      { data: lastTx },
      { data: invRows },
      { data: goalRows },
    ] = await Promise.all([
      client.from("bank_accounts").select("*").eq("user_id", userId).eq("archived", false),
      client.from("transactions").select("type, amount_cents, date").eq("user_id", userId),
      client
        .from("transactions")
        .select(
          "*, account:bank_accounts(*), category:categories(*), payment_method:payment_methods(*)"
        )
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10),
      client.from("investments").select("*").eq("user_id", userId).eq("archived", false),
      client.from("goals").select("*").eq("user_id", userId),
    ]);

    const accs = accounts ?? [];
    const txs = allTx ?? [];
    const initialBalanceCents = accs.reduce(
      (s, a) => s + (a.initial_balance_cents as number),
      0
    );

    let totalEntradas = 0;
    let totalSaidas = 0;
    let receitasMesCents = 0;
    let despesasMesCents = 0;

    for (const t of txs) {
      const d = new Date(t.date as string);
      const inMonth = d >= start && d < end;
      if (t.type === "ENTRADA") {
        totalEntradas += t.amount_cents as number;
        if (inMonth) receitasMesCents += t.amount_cents as number;
      } else {
        totalSaidas += t.amount_cents as number;
        if (inMonth) despesasMesCents += t.amount_cents as number;
      }
    }

    const saldoConsolidadoCents = initialBalanceCents + totalEntradas - totalSaidas;
    const saldoMesCents = receitasMesCents - despesasMesCents;
    const inv = investmentsSummaryFrom(invRows ?? []);
    const goals = goalsSummaryFrom(goalRows ?? []);

    const activeGoals = (goalRows ?? [])
      .filter((g) => g.status === "ATIVA")
      .sort((a, b) => {
        const p = { ALTA: 0, MEDIA: 1, BAIXA: 2 } as Record<string, number>;
        return (p[a.priority as string] ?? 1) - (p[b.priority as string] ?? 1);
      })
      .slice(0, 5);

    const now = Date.now();
    const in60 = now + 60 * 86400000;
    const upcoming = (goalRows ?? [])
      .filter((g) => {
        if (g.status !== "ATIVA" || !g.deadline) return false;
        const d = new Date(g.deadline as string).getTime();
        return d >= now && d <= in60;
      })
      .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
      .slice(0, 5);

    return {
      referenceMonth: yearMonth,
      saldoAtualCents: saldoConsolidadoCents,
      saldoConsolidadoCents,
      patrimonioLiquidoCents: saldoConsolidadoCents + inv.patrimonioInvestidoCents,
      receitasMesCents,
      despesasMesCents,
      saldoMesCents,
      economiaAcumuladaCents: totalEntradas - totalSaidas,
      lastTransactions: (lastTx ?? []).map(mapTx),
      investments: inv,
      goals: {
        ...goals,
        top: activeGoals.map((g) => mapGoal(g)),
        upcomingDeadlines: upcoming.map((g) => mapGoal(g)),
      },
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
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("created_at");
    if (error) fail(error, "Erro ao listar contas");
    return (data ?? []).map(mapAccount);
  },

  createAccount: async (input: NewAccountInput) => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("bank_accounts")
      .insert({
        user_id: userId,
        name: input.name,
        type: input.type,
        initial_balance_cents: input.initialBalanceCents ?? 0,
      })
      .select("*")
      .single();
    if (error) fail(error, "Erro ao criar conta");
    return mapAccount(data);
  },

  updateAccount: async (id: string, input: Partial<NewAccountInput>) => {
    await requireUserId();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.type !== undefined) patch.type = input.type;
    if (input.initialBalanceCents !== undefined)
      patch.initial_balance_cents = input.initialBalanceCents;
    const { data, error } = await sb()
      .from("bank_accounts")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao atualizar conta");
    return mapAccount(data);
  },

  archiveAccount: async (id: string) => {
    await requireUserId();
    const { data, error } = await sb()
      .from("bank_accounts")
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao arquivar conta");
    return mapAccount(data);
  },

  listCategories: async () => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("created_at");
    if (error) fail(error, "Erro ao listar categorias");
    return (data ?? []).map(mapCategory);
  },

  createCategory: async (input: Partial<Category>) => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("categories")
      .insert({
        user_id: userId,
        name: input.name ?? "Categoria",
        icon: input.icon ?? null,
        color: input.color ?? "#6B7280",
        type: input.type ?? "SAIDA",
      })
      .select("*")
      .single();
    if (error) fail(error, "Erro ao criar categoria");
    return mapCategory(data);
  },

  updateCategory: async (id: string, input: Partial<Category>) => {
    await requireUserId();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.icon !== undefined) patch.icon = input.icon;
    if (input.color !== undefined) patch.color = input.color;
    if (input.type !== undefined) patch.type = input.type;
    const { data, error } = await sb()
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao atualizar categoria");
    return mapCategory(data);
  },

  archiveCategory: async (id: string) => {
    await requireUserId();
    const { data, error } = await sb()
      .from("categories")
      .update({ archived: true })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao arquivar categoria");
    return mapCategory(data);
  },

  listPaymentMethods: async () => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("created_at");
    if (error) fail(error, "Erro ao listar formas de pagamento");
    return (data ?? []).map(mapPm);
  },

  createPaymentMethod: async (input: { name: string }) => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("payment_methods")
      .insert({ user_id: userId, name: input.name })
      .select("*")
      .single();
    if (error) fail(error, "Erro ao criar forma de pagamento");
    return mapPm(data);
  },

  updatePaymentMethod: async (id: string, input: { name: string }) => {
    await requireUserId();
    const { data, error } = await sb()
      .from("payment_methods")
      .update({ name: input.name })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao atualizar forma de pagamento");
    return mapPm(data);
  },

  archivePaymentMethod: async (id: string) => {
    await requireUserId();
    const { data, error } = await sb()
      .from("payment_methods")
      .update({ archived: true })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao arquivar forma de pagamento");
    return mapPm(data);
  },

  listTransactions: async (filters?: TransactionFilters): Promise<TransactionListResponse> => {
    const userId = await requireUserId();
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = sb()
      .from("transactions")
      .select(
        "*, account:bank_accounts(*), category:categories(*), payment_method:payment_methods(*)",
        { count: "exact" }
      )
      .eq("user_id", userId);

    if (filters?.accountId) q = q.eq("account_id", filters.accountId);
    if (filters?.categoryId) q = q.eq("category_id", filters.categoryId);
    if (filters?.type) q = q.eq("type", filters.type);
    if (filters?.month) {
      const [y, m] = filters.month.split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
      const end = new Date(Date.UTC(y, m, 1)).toISOString();
      q = q.gte("date", start).lt("date", end);
    }

    const { data, error, count } = await q
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) fail(error, "Erro ao listar transações");
    return {
      transactions: (data ?? []).map(mapTx),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  createTransaction: async (input: NewTransactionInput) => {
    const userId = await requireUserId();
    const ym = yearMonthFromIso(input.date);
    const period = await ensurePeriod(userId, ym);
    if (period.status === "FECHADO") {
      throw new ApiError("Mês fechado — reabra o período para lançar", 400);
    }

    const { data, error } = await sb()
      .from("transactions")
      .insert({
        user_id: userId,
        date: input.date,
        amount_cents: input.amountCents,
        type: input.type,
        description: input.description,
        notes: null,
        account_id: input.accountId,
        category_id: input.categoryId,
        payment_method_id: input.paymentMethodId,
        month_period_id: period.id,
      })
      .select(
        "*, account:bank_accounts(*), category:categories(*), payment_method:payment_methods(*)"
      )
      .single();
    if (error) fail(error, "Erro ao criar lançamento");
    return mapTx(data);
  },

  deleteTransaction: async (id: string) => {
    const userId = await requireUserId();
    const { data: existing, error: e1 } = await sb()
      .from("transactions")
      .select("id, month_period_id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (e1 || !existing) throw new ApiError("Transação não encontrada", 404);

    const { data: period } = await sb()
      .from("month_periods")
      .select("status")
      .eq("id", existing.month_period_id)
      .maybeSingle();
    if (period?.status === "FECHADO") {
      throw new ApiError("Mês fechado — reabra o período para excluir", 400);
    }

    const { error } = await sb().from("transactions").delete().eq("id", id);
    if (error) fail(error, "Erro ao excluir lançamento");
  },

  listGoals: async (includeArchived?: boolean) => {
    const userId = await requireUserId();
    let q = sb().from("goals").select("*").eq("user_id", userId);
    if (!includeArchived) q = q.neq("status", "ARQUIVADA");
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) fail(error, "Erro ao listar metas");

    const goals = data ?? [];
    const ids = goals.map((g) => g.id);
    let contribs: any[] = [];
    if (ids.length) {
      const { data: c } = await sb()
        .from("goal_contributions")
        .select("*")
        .in("goal_id", ids)
        .order("date", { ascending: false });
      contribs = c ?? [];
    }

    return goals.map((g) =>
      mapGoal(
        g,
        contribs.filter((c) => c.goal_id === g.id)
      )
    );
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
  }) => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("goals")
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? "Geral",
        priority: input.priority ?? "MEDIA",
        icon: input.icon ?? "target",
        color: input.color ?? "#3B82F6",
        target_cents: input.targetCents,
        current_cents: input.currentCents ?? 0,
        deadline: input.deadline ?? null,
        status: input.status ?? "ATIVA",
      })
      .select("*")
      .single();
    if (error) fail(error, "Erro ao criar meta");
    return mapGoal(data, []);
  },

  updateGoal: async (id: string, input: Record<string, unknown>) => {
    await requireUserId();
    const map: Record<string, string> = {
      name: "name",
      description: "description",
      category: "category",
      priority: "priority",
      icon: "icon",
      color: "color",
      targetCents: "target_cents",
      currentCents: "current_cents",
      deadline: "deadline",
      status: "status",
    };
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, col] of Object.entries(map)) {
      if (input[k] !== undefined) patch[col] = input[k];
    }
    const { data, error } = await sb()
      .from("goals")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao atualizar meta");
    return mapGoal(data, []);
  },

  archiveGoal: async (id: string) => {
    await requireUserId();
    const { data, error } = await sb()
      .from("goals")
      .update({ status: "ARQUIVADA", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao arquivar meta");
    return mapGoal(data, []);
  },

  completeGoal: async (id: string) => {
    await requireUserId();
    const { data: g, error: e1 } = await sb().from("goals").select("*").eq("id", id).single();
    if (e1 || !g) throw new ApiError("Meta não encontrada", 404);
    const current = Math.max(g.current_cents as number, g.target_cents as number);
    const { data, error } = await sb()
      .from("goals")
      .update({
        status: "CONCLUIDA",
        current_cents: current,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao concluir meta");
    return mapGoal(data, []);
  },

  addGoalContribution: async (
    id: string,
    input: { amountCents: number; date?: string; notes?: string | null }
  ) => {
    const userId = await requireUserId();
    const { data: g, error: e1 } = await sb().from("goals").select("*").eq("id", id).single();
    if (e1 || !g) throw new ApiError("Meta não encontrada", 404);

    const { data: c, error: e2 } = await sb()
      .from("goal_contributions")
      .insert({
        goal_id: id,
        user_id: userId,
        amount_cents: input.amountCents,
        date: input.date ?? new Date().toISOString(),
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (e2) fail(e2, "Erro ao adicionar aporte");

    const next = (g.current_cents as number) + input.amountCents;
    const status =
      next >= (g.target_cents as number) ? "CONCLUIDA" : (g.status as string);
    const { data: goal, error: e3 } = await sb()
      .from("goals")
      .update({
        current_cents: next,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (e3) fail(e3, "Erro ao atualizar meta");

    return {
      contribution: {
        id: c.id,
        goalId: c.goal_id,
        amountCents: c.amount_cents,
        date: c.date,
        notes: c.notes,
      },
      goal: mapGoal(goal, [c]),
    };
  },

  listInvestments: async () => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("applied_at", { ascending: false });
    if (error) fail(error, "Erro ao listar investimentos");
    return (data ?? []).map(enrichInvestment);
  },

  getInvestmentsSummary: async () => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false);
    if (error) fail(error, "Erro no resumo de investimentos");
    return investmentsSummaryFrom(data ?? []);
  },

  createInvestment: async (input: {
    institution: string;
    type: InvestmentType;
    appliedAt: string;
    appliedCents: number;
    currentCents: number;
    notes?: string | null;
  }) => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("investments")
      .insert({
        user_id: userId,
        institution: input.institution,
        type: input.type,
        applied_at: input.appliedAt,
        applied_cents: input.appliedCents,
        current_cents: input.currentCents,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (error) fail(error, "Erro ao criar investimento");
    return enrichInvestment(data);
  },

  updateInvestment: async (id: string, input: Record<string, unknown>) => {
    await requireUserId();
    const map: Record<string, string> = {
      institution: "institution",
      type: "type",
      appliedAt: "applied_at",
      appliedCents: "applied_cents",
      currentCents: "current_cents",
      notes: "notes",
    };
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, col] of Object.entries(map)) {
      if (input[k] !== undefined) patch[col] = input[k];
    }
    const { data, error } = await sb()
      .from("investments")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao atualizar investimento");
    return enrichInvestment(data);
  },

  archiveInvestment: async (id: string) => {
    await requireUserId();
    const { data, error } = await sb()
      .from("investments")
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao arquivar investimento");
    return enrichInvestment(data);
  },

  getSettings: async (): Promise<Settings> => {
    const userId = await requireUserId();
    const client = sb();
    let { data } = await client
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) {
      const { data: created, error } = await client
        .from("settings")
        .insert({ user_id: userId })
        .select("*")
        .single();
      if (error) fail(error, "Erro ao carregar configurações");
      data = created;
    }
    return mapSettings(data);
  },

  updateSettings: async (input: Partial<Settings>): Promise<Settings> => {
    const userId = await requireUserId();
    const current = await api.getSettings();
    const patch: Record<string, unknown> = {};
    if (input.profileName !== undefined) patch.profile_name = input.profileName;
    if (input.profilePhoto !== undefined) patch.profile_photo = input.profilePhoto;
    if (input.theme !== undefined) patch.theme = input.theme;
    if (input.language !== undefined) patch.language = input.language;
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.monthStartDay !== undefined) patch.month_start_day = input.monthStartDay;
    if (input.notificationsEnabled !== undefined)
      patch.notifications_enabled = input.notificationsEnabled;

    const { data, error } = await sb()
      .from("settings")
      .update(patch)
      .eq("id", current.id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao salvar configurações");
    return mapSettings(data);
  },

  exportBackup: async () => {
    const userId = await requireUserId();
    const client = sb();
    const [
      settings,
      accounts,
      categories,
      paymentMethods,
      transactions,
      goals,
      investments,
      periods,
    ] = await Promise.all([
      api.getSettings(),
      client.from("bank_accounts").select("*").eq("user_id", userId),
      client.from("categories").select("*").eq("user_id", userId),
      client.from("payment_methods").select("*").eq("user_id", userId),
      client
        .from("transactions")
        .select(
          "*, account:bank_accounts(*), category:categories(*), payment_method:payment_methods(*)"
        )
        .eq("user_id", userId),
      api.listGoals(true),
      client.from("investments").select("*").eq("user_id", userId),
      client.from("month_periods").select("*").eq("user_id", userId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: "5.0.0",
      format: "financas-backup-json",
      storage: "supabase",
      data: {
        settings,
        accounts: (accounts.data ?? []).map(mapAccount),
        categories: (categories.data ?? []).map(mapCategory),
        paymentMethods: (paymentMethods.data ?? []).map(mapPm),
        transactions: (transactions.data ?? []).map(mapTx),
        goals,
        investments: (investments.data ?? []).map(enrichInvestment),
        periods: (periods.data ?? []).map(mapPeriod),
      },
    };
  },

  listPeriods: async () => {
    const userId = await requireUserId();
    const { data, error } = await sb()
      .from("month_periods")
      .select("*")
      .eq("user_id", userId)
      .order("year_month", { ascending: false });
    if (error) fail(error, "Erro ao listar períodos");
    return (data ?? []).map(mapPeriod);
  },

  getPeriod: async (yearMonth: string) => {
    const userId = await requireUserId();
    const p = await ensurePeriod(userId, yearMonth);
    return mapPeriod(p);
  },

  closePeriod: async (yearMonth: string) => {
    const userId = await requireUserId();
    const p = await ensurePeriod(userId, yearMonth);
    if (p.status === "FECHADO") throw new ApiError("Período já fechado", 400);

    const { data: accounts } = await sb()
      .from("bank_accounts")
      .select("initial_balance_cents")
      .eq("user_id", userId)
      .eq("archived", false);
    const { data: txs } = await sb()
      .from("transactions")
      .select("type, amount_cents, date")
      .eq("user_id", userId);

    const initial = (accounts ?? []).reduce(
      (s, a) => s + (a.initial_balance_cents as number),
      0
    );
    let ent = 0;
    let sai = 0;
    for (const t of txs ?? []) {
      if (yearMonthFromIso(t.date as string) > yearMonth) continue;
      if (t.type === "ENTRADA") ent += t.amount_cents as number;
      else sai += t.amount_cents as number;
    }
    const finalBalanceCents = initial + ent - sai;
    const closedAt = new Date().toISOString();

    const { data, error } = await sb()
      .from("month_periods")
      .update({
        status: "FECHADO",
        closed_at: closedAt,
        final_balance_cents: finalBalanceCents,
        snapshot_json: JSON.stringify({ closedAt, finalBalanceCents }),
      })
      .eq("id", p.id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao fechar período");
    return mapPeriod(data);
  },

  reopenPeriod: async (yearMonth: string) => {
    const userId = await requireUserId();
    const p = await ensurePeriod(userId, yearMonth);
    const { data, error } = await sb()
      .from("month_periods")
      .update({
        status: "ABERTO",
        closed_at: null,
        final_balance_cents: null,
        snapshot_json: null,
      })
      .eq("id", p.id)
      .select("*")
      .single();
    if (error) fail(error, "Erro ao reabrir período");
    return mapPeriod(data);
  },

  getReportOverview: async (year?: number): Promise<ReportOverview> => {
    const userId = await requireUserId();
    const y = year ?? new Date().getUTCFullYear();
    const start = new Date(Date.UTC(y, 0, 1)).toISOString();
    const end = new Date(Date.UTC(y + 1, 0, 1)).toISOString();

    const [{ data: txs }, { data: accounts }, { data: invs }, { data: goals }, { data: periods }] =
      await Promise.all([
        sb()
          .from("transactions")
          .select("*, category:categories(name)")
          .eq("user_id", userId)
          .gte("date", start)
          .lt("date", end),
        sb()
          .from("bank_accounts")
          .select("initial_balance_cents")
          .eq("user_id", userId)
          .eq("archived", false),
        sb().from("investments").select("*").eq("user_id", userId).eq("archived", false),
        sb().from("goals").select("*").eq("user_id", userId),
        sb()
          .from("month_periods")
          .select("*")
          .eq("user_id", userId)
          .like("year_month", `${y}%`),
      ]);

    const months: Record<
      string,
      { entradasCents: number; saidasCents: number; byCategory: Record<string, number> }
    > = {};
    for (let m = 0; m < 12; m++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      months[key] = { entradasCents: 0, saidasCents: 0, byCategory: {} };
    }

    for (const t of txs ?? []) {
      const key = yearMonthFromIso(t.date as string);
      if (!months[key]) continue;
      if (t.type === "ENTRADA") months[key].entradasCents += t.amount_cents as number;
      else {
        months[key].saidasCents += t.amount_cents as number;
        const cat = (t.category as any)?.name ?? "Outros";
        months[key].byCategory[cat] =
          (months[key].byCategory[cat] ?? 0) + (t.amount_cents as number);
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
    const totalEntradas = monthly.reduce((s, m) => s + m.entradasCents, 0);
    const totalSaidas = monthly.reduce((s, m) => s + m.saidasCents, 0);
    const patrimonioBase = (accounts ?? []).reduce(
      (s, a) => s + (a.initial_balance_cents as number),
      0
    );

    return {
      exportMeta: {
        preparedFormats: ["json", "csv", "xlsx", "pdf"],
        implementedFormats: ["json"],
      },
      year: y,
      monthly,
      quarterly,
      semesters: [
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
      ],
      annual: {
        receitasCents: totalEntradas,
        despesasCents: totalSaidas,
        fluxoCaixaCents: totalEntradas - totalSaidas,
        patrimonioBaseCents: patrimonioBase,
      },
      investments: investmentsSummaryFrom(invs ?? []),
      goals: goalsSummaryFrom(goals ?? []),
      periods: (periods ?? []).map(mapPeriod),
      generatedAt: new Date().toISOString(),
    };
  },
};
