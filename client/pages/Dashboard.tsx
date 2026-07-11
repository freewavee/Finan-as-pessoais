import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  LineChart,
  Plus,
  Landmark,
  Target,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { fetchAllTransactions, computeChartsData } from "../lib/aggregate";
import type {
  Account,
  Category,
  PaymentMethod,
  DashboardSummary,
  ChartsData,
  Transaction,
} from "../types";
import { SummaryCard } from "../components/SummaryCard";
import { SummaryCardSkeleton, ChartSkeleton, TransactionRowSkeleton } from "../components/Skeleton";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EntradasSaidasChart } from "../components/charts/EntradasSaidasChart";
import { GastosPorCategoriaChart } from "../components/charts/GastosPorCategoriaChart";
import { EvolucaoSaldoChart } from "../components/charts/EvolucaoSaldoChart";
import { useToast } from "../lib/toast";
import { PageHeader } from "../components/ui/PageHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { formatCentsToBRL, formatDate } from "../lib/format";
import { useNewQueryParam } from "../hooks/useNewQueryParam";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PIE_COLORS = ["#3B82F6", "#22C55E", "#A855F7", "#F59E0B", "#EF4444", "#06B6D4"];

export function Dashboard() {
  const { show } = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [lastTransactions, setLastTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const openNew = useCallback(() => setModalOpen(true), []);
  useNewQueryParam(openNew);

  const loadAll = useCallback(async () => {
    try {
      const [summaryData, allTransactions, accountsData, categoriesData, methodsData] =
        await Promise.all([
          api.getDashboard(),
          fetchAllTransactions(),
          api.listAccounts(),
          api.listCategories(),
          api.listPaymentMethods(),
        ]);
      setSummary(summaryData);
      setCharts(computeChartsData(allTransactions, accountsData));
      setLastTransactions(allTransactions.slice(0, 10));
      setAccounts(accountsData);
      setCategories(categoriesData);
      setPaymentMethods(methodsData);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(
        err.message ??
          "Não foi possível falar com a API. Confirme que o backend está rodando."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleCreateTransaction(input: Parameters<typeof api.createTransaction>[0]) {
    await api.createTransaction(input);
    await loadAll();
    setModalOpen(false);
    show("Transação adicionada.");
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    try {
      await api.deleteTransaction(deleting.id);
      await loadAll();
      show("Transação removida.");
    } catch (err: any) {
      show(err.message ?? "Não foi possível excluir.", "error");
    } finally {
      setDeleting(null);
    }
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="border border-expense/30 bg-expense/10 rounded-xl p-6 text-sm">
          <p className="font-medium text-expense mb-1">Não deu pra carregar o painel</p>
          <p className="text-ink-muted">{loadError}</p>
        </div>
      </div>
    );
  }

  const investPie =
    summary?.investments.byType.map((t) => ({
      name: t.type,
      value: t.currentCents / 100,
    })) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8">
      <PageHeader
        title="Dashboard"
        description={
          loading ? "Carregando…" : `Centro financeiro · ${summary?.referenceMonth ?? ""}`
        }
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Nova transação
          </button>
        }
      />

      {loading ? (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </section>
        </>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <SummaryCard
              label="Patrimônio líquido"
              icon={Landmark}
              valueCents={summary!.patrimonioLiquidoCents}
              emphasis
              index={0}
            />
            <SummaryCard
              label="Saldo consolidado"
              icon={Wallet}
              valueCents={summary!.saldoConsolidadoCents}
              index={1}
            />
            <SummaryCard
              label="Receitas do período"
              icon={TrendingUp}
              valueCents={summary!.receitasMesCents}
              tone="income"
              index={2}
            />
            <SummaryCard
              label="Despesas do período"
              icon={TrendingDown}
              valueCents={summary!.despesasMesCents}
              tone="expense"
              index={3}
            />
            <SummaryCard
              label="Economia acumulada"
              icon={PiggyBank}
              valueCents={summary!.economiaAcumuladaCents}
              tone={summary!.economiaAcumuladaCents >= 0 ? "income" : "expense"}
              index={4}
            />
            <SummaryCard
              label="Metas em andamento"
              icon={Target}
              rawValue={String(summary!.goals.activeCount)}
              note={`${summary!.goals.overallPercent}% geral`}
              index={5}
            />
            <SummaryCard
              label="Investimentos"
              icon={LineChart}
              valueCents={summary!.investments.patrimonioInvestidoCents}
              note={`${summary!.investments.rentabilidadePercent.toFixed(1)}% rent.`}
              index={6}
            />
            <SummaryCard
              label="Resumo do mês"
              icon={Sparkles}
              valueCents={summary!.monthlySummary.economiaCents}
              note="economia mensal"
              index={7}
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EntradasSaidasChart data={charts!.entradasSaidasPorMes} />
            <GastosPorCategoriaChart data={charts!.gastosPorCategoria} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EvolucaoSaldoChart data={charts!.evolucaoSaldo} />
            <div className="bg-surface border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm">Investimentos por classe</h2>
                <Link to="/investimentos" className="text-xs text-link hover:underline">
                  Ver carteira
                </Link>
              </div>
              {investPie.length === 0 ? (
                <p className="text-sm text-ink-muted py-12 text-center">
                  Sem investimentos cadastrados.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={investPie}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      animationDuration={600}
                    >
                      {investPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCentsToBRL(Math.round(Number(v) * 100))}
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-sm">Metas em andamento</h2>
                <Link to="/metas" className="text-xs text-link hover:underline">
                  Todas
                </Link>
              </div>
              {(summary!.goals.top ?? []).length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-8">Nenhuma meta ativa.</p>
              ) : (
                <ul className="space-y-4">
                  {(summary!.goals.top ?? []).map((g) => (
                    <li key={g.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate pr-2">{g.name}</span>
                        <span className="text-ink-muted tabular-money shrink-0">
                          {g.percentComplete}%
                        </span>
                      </div>
                      <ProgressBar percent={g.percentComplete} color={g.color} height={6} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-surface border border-line rounded-xl p-5">
              <h2 className="font-display font-semibold text-sm mb-4">Próximos vencimentos</h2>
              {(summary!.goals.upcomingDeadlines ?? []).length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-8">
                  Sem prazos de metas nos próximos 60 dias.
                </p>
              ) : (
                <ul className="space-y-3">
                  {(summary!.goals.upcomingDeadlines ?? []).map((g) => (
                    <li
                      key={g.id}
                      className="flex justify-between text-sm border-b border-line last:border-0 pb-2"
                    >
                      <span className="truncate pr-2">{g.name}</span>
                      <span className="text-ink-muted shrink-0 tabular-money">
                        {g.deadline ? formatDate(g.deadline) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-semibold text-lg">Últimos lançamentos</h2>
              <Link to="/transacoes" className="text-xs text-link hover:underline flex items-center gap-1">
                <Receipt size={12} /> Ver todos
              </Link>
            </div>
            <TransactionList transactions={lastTransactions} onDeleteRequest={setDeleting} />
          </section>
        </>
      )}

      {loading && (
        <div className="bg-surface border border-line rounded-xl p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <TransactionRowSkeleton key={i} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova transação">
        <TransactionForm
          accounts={accounts}
          categories={categories}
          paymentMethods={paymentMethods}
          onSubmit={handleCreateTransaction}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir transação"
        description={`Tem certeza que quer excluir "${deleting?.description}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
