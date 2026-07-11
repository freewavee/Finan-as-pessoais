export type AccountType = "CORRENTE" | "POUPANCA" | "CARTEIRA" | "INVESTIMENTO" | "OUTRO";
export type CategoryType = "ENTRADA" | "SAIDA";
export type TransactionType = "ENTRADA" | "SAIDA";
export type GoalStatus = "ATIVA" | "CONCLUIDA" | "ARQUIVADA";
export type GoalPriority = "BAIXA" | "MEDIA" | "ALTA";
export type Density = "comfortable" | "compact";

export type InvestmentType =
  | "TESOURO"
  | "CDB"
  | "LCI"
  | "LCA"
  | "ACOES"
  | "ETFS"
  | "FIIS"
  | "CRIPTO"
  | "FUNDOS"
  | "PREVIDENCIA"
  | "CONTA_REMUNERADA"
  | "OUTROS";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  archived: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  type: CategoryType;
  archived: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  archived: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  amountCents: number;
  type: TransactionType;
  description: string;
  notes: string | null;
  accountId: string;
  categoryId: string;
  paymentMethodId: string;
  account: Account;
  category: Category;
  paymentMethod: PaymentMethod;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amountCents: number;
  date: string;
  notes: string | null;
}

export interface Goal {
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
  percentComplete: number;
  forecastDate: string | null;
  contributions: GoalContribution[];
}

export interface Investment {
  id: string;
  institution: string;
  type: InvestmentType;
  appliedAt: string;
  appliedCents: number;
  currentCents: number;
  notes: string | null;
  archived: boolean;
  rentabilidadeCents: number;
  rentabilidadePercent: number;
}

export interface InvestmentsSummary {
  count: number;
  patrimonioInvestidoCents: number;
  valorAplicadoCents: number;
  lucroCents: number;
  prejuizoCents: number;
  rentabilidadeCents: number;
  rentabilidadePercent: number;
  byType: { type: string; appliedCents: number; currentCents: number; count: number }[];
  byInstitution: {
    institution: string;
    appliedCents: number;
    currentCents: number;
    count: number;
  }[];
}

export interface GoalsSummary {
  activeCount: number;
  completedCount: number;
  archivedCount: number;
  totalTargetCents: number;
  totalCurrentCents: number;
  overallPercent: number;
  top?: Goal[];
  upcomingDeadlines?: Goal[];
}

export interface DashboardSummary {
  referenceMonth: string;
  saldoAtualCents: number;
  saldoConsolidadoCents: number;
  patrimonioLiquidoCents: number;
  receitasMesCents: number;
  despesasMesCents: number;
  saldoMesCents: number;
  economiaAcumuladaCents: number;
  lastTransactions: Transaction[];
  investments: InvestmentsSummary;
  goals: GoalsSummary;
  monthlySummary: {
    yearMonth: string;
    receitasCents: number;
    despesasCents: number;
    economiaCents: number;
    saldoCents: number;
  };
}

export interface EntradasSaidasMes {
  month: string;
  entradasCents: number;
  saidasCents: number;
}

export interface EvolucaoSaldoMes {
  month: string;
  saldoCents: number;
}

export interface GastoPorCategoria {
  categoryId: string;
  name: string;
  color: string;
  totalCents: number;
}

export interface ChartsData {
  entradasSaidasPorMes: EntradasSaidasMes[];
  evolucaoSaldo: EvolucaoSaldoMes[];
  gastosPorCategoria: GastoPorCategoria[];
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NewAccountInput {
  name: string;
  type: AccountType;
  initialBalanceCents: number;
}

export interface NewTransactionInput {
  date: string;
  amountCents: number;
  type: TransactionType;
  description: string;
  accountId: string;
  categoryId: string;
  paymentMethodId: string;
}

export interface Settings {
  id: string;
  profileName: string;
  profilePhoto: string | null;
  theme: string;
  language: string;
  currency: string;
  monthStartDay: number;
  notificationsEnabled: boolean;
}

export interface MonthPeriod {
  id: string;
  yearMonth: string;
  status: "ABERTO" | "FECHADO" | string;
  initialBalanceCents: number;
  finalBalanceCents: number | null;
  closedAt: string | null;
  snapshotJson?: string | null;
  snapshot?: unknown;
  createdAt: string;
}

export interface ReportOverview {
  exportMeta: {
    preparedFormats: string[];
    implementedFormats: string[];
  };
  year: number;
  monthly: {
    month: string;
    entradasCents: number;
    saidasCents: number;
    economiaCents: number;
    byCategory: { name: string; totalCents: number }[];
  }[];
  quarterly: {
    quarter: string;
    entradasCents: number;
    saidasCents: number;
    economiaCents: number;
  }[];
  semesters: {
    semester: string;
    entradasCents: number;
    saidasCents: number;
    economiaCents: number;
  }[];
  annual: {
    receitasCents: number;
    despesasCents: number;
    fluxoCaixaCents: number;
    patrimonioBaseCents: number;
  };
  investments: InvestmentsSummary;
  goals: Omit<GoalsSummary, "top" | "upcomingDeadlines">;
  periods: MonthPeriod[];
  generatedAt: string;
}
