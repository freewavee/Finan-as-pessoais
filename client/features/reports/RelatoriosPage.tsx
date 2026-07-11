import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { api } from "../../services/api";
import type { ReportOverview } from "../../types";
import { formatCentsToBRL, formatMonthLabel } from "../../lib/format";
import { PageHeader } from "../../components/ui/PageHeader";
import { ChartSkeleton, SummaryCardSkeleton } from "../../components/Skeleton";
import { SummaryCard } from "../../components/SummaryCard";
import { useToast } from "../../lib/toast";

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

/**
 * Central de relatórios. Exportação PDF/Excel/CSV preparada via exportMeta
 * e botões desabilitados com toast — arquitetura pronta para Fase futura.
 */
export function Relatorios() {
  const { show } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mensal" | "trimestral" | "semestral" | "anual">("mensal");

  useEffect(() => {
    setLoading(true);
    api
      .getReportOverview(year)
      .then(setData)
      .catch((e) => show(e.message ?? "Erro ao carregar relatório", "error"))
      .finally(() => setLoading(false));
  }, [year, show]);

  function onExport(format: string) {
    if (format === "json" && data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${year}.json`;
      a.click();
      URL.revokeObjectURL(url);
      show("Relatório JSON baixado.");
      return;
    }
    show(`Exportação ${format.toUpperCase()} chega em breve — arquitetura já preparada.`, "error");
  }

  const monthlyChart =
    data?.monthly.map((m) => ({
      month: formatMonthLabel(m.month),
      entradas: m.entradasCents / 100,
      saidas: m.saidasCents / 100,
      economia: m.economiaCents / 100,
    })) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análises mensais, trimestrais, semestrais e anuais"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-line rounded-lg px-3 py-2 bg-surface text-sm text-ink"
            >
              {[year, year - 1, year - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ExportBtn icon={FileText} label="JSON" onClick={() => onExport("json")} />
            <ExportBtn icon={FileSpreadsheet} label="Excel" onClick={() => onExport("xlsx")} disabled />
            <ExportBtn icon={Download} label="CSV" onClick={() => onExport("csv")} disabled />
            <ExportBtn icon={FileText} label="PDF" onClick={() => onExport("pdf")} disabled />
          </div>
        }
      />

      <div className="flex gap-1 p-1 rounded-lg border border-line bg-surface w-fit flex-wrap">
        {(
          [
            ["mensal", "Mensal"],
            ["trimestral", "Trimestral"],
            ["semestral", "Semestral"],
            ["anual", "Anual"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              tab === id ? "bg-surface-active text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </div>
          <ChartSkeleton height={280} />
        </>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Receitas"
              icon={FileText}
              valueCents={data.annual.receitasCents}
              tone="income"
              index={0}
            />
            <SummaryCard
              label="Despesas"
              icon={FileText}
              valueCents={data.annual.despesasCents}
              tone="expense"
              index={1}
            />
            <SummaryCard
              label="Fluxo de caixa"
              icon={FileText}
              valueCents={data.annual.fluxoCaixaCents}
              tone={data.annual.fluxoCaixaCents >= 0 ? "income" : "expense"}
              index={2}
            />
            <SummaryCard
              label="Patrimônio base"
              icon={FileText}
              valueCents={data.annual.patrimonioBaseCents}
              index={3}
            />
          </section>

          {tab === "mensal" && (
            <div className="space-y-6">
              <Panel title="Receitas × Despesas (mensal)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => formatCentsToBRL(Math.round(Number(v) * 100))}
                      contentStyle={tooltipStyle}
                    />
                    <Legend />
                    <Bar dataKey="entradas" name="Receitas" fill="#22C55E" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="saidas" name="Despesas" fill="#EF4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Economia mensal">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => formatCentsToBRL(Math.round(Number(v) * 100))}
                      contentStyle={tooltipStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="economia"
                      name="Economia"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Categorias (mês corrente)">
                <CategoryTable
                  rows={
                    data.monthly.find((m) => m.month === data.monthly[new Date().getMonth()]?.month)
                      ?.byCategory ??
                    data.monthly.filter((m) => m.saidasCents > 0).slice(-1)[0]?.byCategory ??
                    []
                  }
                />
              </Panel>
            </div>
          )}

          {tab === "trimestral" && (
            <Panel title="Comparativo trimestral">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.quarterly.map((q) => ({
                    ...q,
                    entradas: q.entradasCents / 100,
                    saidas: q.saidasCents / 100,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="quarter" tick={{ fill: "var(--color-text-muted)" }} />
                  <YAxis tick={{ fill: "var(--color-text-muted)" }} />
                  <Tooltip
                    formatter={(v) => formatCentsToBRL(Math.round(Number(v) * 100))}
                    contentStyle={tooltipStyle}
                  />
                  <Legend />
                  <Bar dataKey="entradas" name="Receitas" fill="#22C55E" />
                  <Bar dataKey="saidas" name="Despesas" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          )}

          {tab === "semestral" && (
            <Panel title="Comparação entre semestres">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {data.semesters.map((s) => (
                  <div key={s.semester} className="border border-line rounded-lg p-4">
                    <p className="text-xs text-ink-muted mb-2">{s.semester}</p>
                    <p className="text-sm">
                      Receitas:{" "}
                      <span className="tabular-money text-income">
                        {formatCentsToBRL(s.entradasCents)}
                      </span>
                    </p>
                    <p className="text-sm">
                      Despesas:{" "}
                      <span className="tabular-money text-expense">
                        {formatCentsToBRL(s.saidasCents)}
                      </span>
                    </p>
                    <p className="text-sm font-medium mt-1">
                      Economia:{" "}
                      <span className="tabular-money">{formatCentsToBRL(s.economiaCents)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {tab === "anual" && (
            <div className="grid md:grid-cols-2 gap-4">
              <Panel title="Investimentos">
                <p className="text-sm text-ink-muted">
                  Patrimônio:{" "}
                  <span className="tabular-money text-ink">
                    {formatCentsToBRL(data.investments.patrimonioInvestidoCents)}
                  </span>
                </p>
                <p className="text-sm text-ink-muted">
                  Rentabilidade: {data.investments.rentabilidadePercent.toFixed(2)}%
                </p>
              </Panel>
              <Panel title="Metas">
                <p className="text-sm text-ink-muted">
                  Ativas: {data.goals.activeCount} · Concluídas: {data.goals.completedCount}
                </p>
                <p className="text-sm text-ink-muted">
                  Progresso geral: {data.goals.overallPercent}%
                </p>
              </Panel>
              <Panel title="Exportação">
                <p className="text-xs text-ink-muted mb-2">
                  Formatados preparados: {data.exportMeta.preparedFormats.join(", ")}
                </p>
                <p className="text-xs text-ink-muted">
                  Implementados agora: {data.exportMeta.implementedFormats.join(", ")}
                </p>
              </Panel>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 md:p-5">
      <h2 className="font-display font-semibold text-sm mb-3">{title}</h2>
      {children}
    </div>
  );
}

function CategoryTable({ rows }: { rows: { name: string; totalCents: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">Sem despesas categorizadas no período.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {rows
        .sort((a, b) => b.totalCents - a.totalCents)
        .map((r) => (
          <li key={r.name} className="flex justify-between py-2 text-sm">
            <span>{r.name}</span>
            <span className="tabular-money text-expense">{formatCentsToBRL(r.totalCents)}</span>
          </li>
        ))}
    </ul>
  );
}

function ExportBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Em breve" : label}
      className="flex items-center gap-1.5 border border-line rounded-lg px-2.5 py-2 text-xs text-ink-muted hover:text-ink hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
