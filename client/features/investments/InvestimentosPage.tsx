import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { api } from "../../services/api";
import type { Investment, InvestmentsSummary, InvestmentType } from "../../types";
import { formatCentsToBRL, reaisToCents } from "../../lib/format";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { SummaryCard } from "../../components/SummaryCard";
import { SummaryCardSkeleton, ChartSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../lib/toast";
import { useNewQueryParam } from "../../hooks/useNewQueryParam";
import { useIsDesktop } from "../../hooks/useMediaQuery";
import { RowActions } from "../../components/ui/RowActions";

const TYPES: { value: InvestmentType; label: string }[] = [
  { value: "TESOURO", label: "Tesouro Direto" },
  { value: "CDB", label: "CDB" },
  { value: "LCI", label: "LCI" },
  { value: "LCA", label: "LCA" },
  { value: "ACOES", label: "Ações" },
  { value: "ETFS", label: "ETFs" },
  { value: "FIIS", label: "FIIs" },
  { value: "CRIPTO", label: "Criptomoedas" },
  { value: "FUNDOS", label: "Fundos" },
  { value: "PREVIDENCIA", label: "Previdência" },
  { value: "CONTA_REMUNERADA", label: "Conta Remunerada" },
  { value: "OUTROS", label: "Outros" },
];

const COLORS = ["#3B82F6", "#22C55E", "#A855F7", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 bg-bg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

export function Investimentos() {
  const { show } = useToast();
  const isDesktop = useIsDesktop();
  const [list, setList] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [archiving, setArchiving] = useState<Investment | null>(null);
  const [form, setForm] = useState({
    institution: "",
    type: "CDB" as InvestmentType,
    appliedAt: new Date().toISOString().slice(0, 10),
    appliedReais: "",
    currentReais: "",
    notes: "",
  });

  const openCreate = useCallback(() => setModalOpen(true), []);
  useNewQueryParam(openCreate);

  const load = useCallback(async () => {
    const [items, sum] = await Promise.all([
      api.listInvestments(),
      api.getInvestmentsSummary(),
    ]);
    setList(items);
    setSummary(sum);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const applied = reaisToCents(Number(form.appliedReais.replace(",", ".")));
      const current = form.currentReais
        ? reaisToCents(Number(form.currentReais.replace(",", ".")))
        : applied;
      await api.createInvestment({
        institution: form.institution.trim(),
        type: form.type,
        appliedAt: new Date(form.appliedAt).toISOString(),
        appliedCents: applied,
        currentCents: current,
        notes: form.notes || null,
      });
      await load();
      setModalOpen(false);
      show("Investimento adicionado.");
    } catch (err: any) {
      show(err.message ?? "Erro", "error");
    }
  }

  async function handleArchive() {
    if (!archiving) return;
    try {
      await api.archiveInvestment(archiving.id);
      await load();
      show("Investimento arquivado.");
    } catch (err: any) {
      show(err.message ?? "Erro", "error");
    } finally {
      setArchiving(null);
    }
  }

  const pieData = useMemo(
    () =>
      (summary?.byType ?? []).map((t) => ({
        name: TYPES.find((x) => x.value === t.type)?.label ?? t.type,
        value: t.currentCents / 100,
      })),
    [summary]
  );

  const instData = useMemo(
    () =>
      (summary?.byInstitution ?? []).map((i) => ({
        name: i.institution,
        value: i.currentCents / 100,
      })),
    [summary]
  );

  const columns: Column<Investment>[] = [
    {
      key: "inst",
      header: "Instituição",
      render: (r) => <span className="text-ink font-medium">{r.institution}</span>,
    },
    {
      key: "type",
      header: "Tipo",
      render: (r) => TYPES.find((t) => t.value === r.type)?.label ?? r.type,
    },
    {
      key: "applied",
      header: "Aplicado",
      className: "tabular-money",
      render: (r) => formatCentsToBRL(r.appliedCents),
    },
    {
      key: "current",
      header: "Atual",
      className: "tabular-money",
      render: (r) => formatCentsToBRL(r.currentCents),
    },
    {
      key: "ret",
      header: "Rentab.",
      render: (r) => (
        <span className={r.rentabilidadeCents >= 0 ? "text-income" : "text-expense"}>
          {r.rentabilidadePercent.toFixed(2)}%
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <RowActions>
          <button
            onClick={() => setArchiving(r)}
            className="p-1.5 text-ink-muted hover:text-expense"
            aria-label="Arquivar"
          >
            <Trash2 size={14} />
          </button>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Investimentos"
        description="Gestão patrimonial e rentabilidade da carteira"
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
          >
            <Plus size={16} /> Novo
          </button>
        }
      />

      {loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </div>
          <ChartSkeleton />
        </>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Patrimônio investido"
              icon={TrendingUp}
              valueCents={summary?.patrimonioInvestidoCents ?? 0}
              index={0}
            />
            <SummaryCard
              label="Lucro"
              icon={TrendingUp}
              valueCents={summary?.lucroCents ?? 0}
              tone="income"
              index={1}
            />
            <SummaryCard
              label="Prejuízo"
              icon={TrendingUp}
              valueCents={summary?.prejuizoCents ?? 0}
              tone="expense"
              index={2}
            />
            <SummaryCard
              label="Rentabilidade"
              icon={TrendingUp}
              rawValue={`${(summary?.rentabilidadePercent ?? 0).toFixed(2)}%`}
              note="acumulada"
              index={3}
            />
          </section>

          {list.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Carteira vazia"
              description="Cadastre aplicações em Tesouro, CDB, ações, FIIs e mais."
              action={
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Adicionar investimento
                </button>
              }
            />
          ) : (
            <>
              <section className="grid lg:grid-cols-2 gap-6">
                <ChartCard title="Alocação por tipo">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} animationDuration={600}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) =>
                          formatCentsToBRL(Math.round(Number(v) * 100))
                        }
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Por instituição">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={instData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                      <Tooltip
                        formatter={(v) =>
                          formatCentsToBRL(Math.round(Number(v) * 100))
                        }
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={600} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </section>

              <section className="bg-surface border border-line rounded-xl p-4 md:p-5">
                <h2 className="font-display font-semibold mb-3">Posições</h2>
                {isDesktop ? (
                  <DataTable
                    columns={columns}
                    rows={list}
                    rowKey={(r) => r.id}
                  />
                ) : (
                  <div className="space-y-3">
                    {list.map((r) => (
                      <div
                        key={r.id}
                        className="border border-line rounded-lg p-3 flex justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium text-sm">{r.institution}</p>
                          <p className="text-xs text-ink-muted">
                            {TYPES.find((t) => t.value === r.type)?.label}
                          </p>
                          <p className="tabular-money text-sm mt-1">
                            {formatCentsToBRL(r.currentCents)}
                          </p>
                        </div>
                        <button
                          onClick={() => setArchiving(r)}
                          className="text-ink-muted hover:text-expense self-start"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo investimento">
        <form onSubmit={handleCreate} className="space-y-3">
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block">Instituição</span>
            <input
              required
              className={inputClass}
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              placeholder="Nubank, XP, BTG…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block">Tipo</span>
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as InvestmentType })}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block">Data da aplicação</span>
            <input
              type="date"
              required
              className={inputClass}
              value={form.appliedAt}
              onChange={(e) => setForm({ ...form, appliedAt: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block">Valor aplicado</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className={inputClass}
                value={form.appliedReais}
                onChange={(e) => setForm({ ...form, appliedReais: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block">Valor atual</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.currentReais}
                onChange={(e) => setForm({ ...form, currentReais: e.target.value })}
                placeholder="igual ao aplicado"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block">Observações</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <button
            type="submit"
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            Salvar
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archiving}
        title="Arquivar investimento"
        description={`"${archiving?.institution}" será arquivado.`}
        confirmLabel="Arquivar"
        onConfirm={handleArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 md:p-5">
      <h2 className="font-display font-semibold text-sm mb-3">{title}</h2>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};
