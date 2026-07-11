import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Lock, Unlock } from "lucide-react";
import { api } from "../../services/api";
import type { MonthPeriod } from "../../types";
import { formatCentsToBRL } from "../../lib/format";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../lib/toast";

export function Fechamento() {
  const { show } = useToast();
  const [periods, setPeriods] = useState<MonthPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<string | null>(null);
  const [reopening, setReopening] = useState<string | null>(null);
  const [yearMonthInput, setYearMonthInput] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const load = useCallback(async () => {
    const data = await api.listPeriods();
    setPeriods(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleClose() {
    if (!closing) return;
    try {
      await api.closePeriod(closing);
      await load();
      show(`Mês ${closing} fechado com snapshot.`);
    } catch (err: any) {
      show(err.message ?? "Erro ao fechar", "error");
    } finally {
      setClosing(null);
    }
  }

  async function handleReopen() {
    if (!reopening) return;
    try {
      await api.reopenPeriod(reopening);
      await load();
      show(`Mês ${reopening} reaberto.`);
    } catch (err: any) {
      show(err.message ?? "Erro ao reabrir", "error");
    } finally {
      setReopening(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Fechamento mensal"
        description="Congela o período, gera snapshot e bloqueia alterações acidentais"
      />

      <div className="bg-surface border border-line rounded-xl p-5 flex flex-wrap gap-3 items-end">
        <label className="text-sm flex-1 min-w-[160px]">
          <span className="block text-ink-muted mb-1">Mês a fechar</span>
          <input
            type="month"
            value={yearMonthInput}
            onChange={(e) => setYearMonthInput(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 bg-bg text-ink text-sm"
          />
        </label>
        <button
          onClick={() => setClosing(yearMonthInput)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
        >
          <Lock size={15} /> Fechar mês
        </button>
      </div>

      <div className="bg-primary-soft/40 border border-primary/20 rounded-xl p-4 text-sm text-ink-muted">
        Ao fechar: os lançamentos daquele mês não podem ser criados/editados/excluídos até reabrir.
        Um resumo financeiro é gravado em snapshot para consultas históricas e comparações.
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Carregando períodos…</p>
      ) : periods.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nenhum período ainda"
          description="Períodos são criados ao lançar a primeira transação do mês, ou ao fechar manualmente."
        />
      ) : (
        <ul className="space-y-2">
          {periods.map((p) => {
            let snap: any = null;
            if (p.snapshotJson) {
              try {
                snap = JSON.parse(p.snapshotJson);
              } catch {
                snap = null;
              }
            }
            const summary = snap?.summary;
            return (
              <li
                key={p.id}
                className="bg-surface border border-line rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium tabular-money">{p.yearMonth}</p>
                  <p className="text-xs text-ink-muted">
                    {p.status === "FECHADO" ? (
                      <span className="text-primary">Fechado</span>
                    ) : (
                      <span className="text-income">Aberto</span>
                    )}
                    {p.finalBalanceCents != null && (
                      <> · saldo final {formatCentsToBRL(p.finalBalanceCents)}</>
                    )}
                    {summary?.receitasMesCents != null && (
                      <>
                        {" "}
                        · receitas {formatCentsToBRL(summary.receitasMesCents)} · despesas{" "}
                        {formatCentsToBRL(summary.despesasMesCents)}
                      </>
                    )}
                  </p>
                </div>
                {p.status === "FECHADO" ? (
                  <button
                    onClick={() => setReopening(p.yearMonth)}
                    className="flex items-center gap-1.5 text-sm border border-line px-3 py-1.5 rounded-lg hover:bg-surface-hover"
                  >
                    <Unlock size={14} /> Reabrir
                  </button>
                ) : (
                  <button
                    onClick={() => setClosing(p.yearMonth)}
                    className="flex items-center gap-1.5 text-sm border border-line px-3 py-1.5 rounded-lg hover:bg-surface-hover"
                  >
                    <Lock size={14} /> Fechar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!closing}
        title="Fechar mês"
        description={`Confirma o fechamento de ${closing}? Lançamentos desse mês ficarão bloqueados.`}
        confirmLabel="Fechar"
        onConfirm={handleClose}
        onCancel={() => setClosing(null)}
      />
      <ConfirmDialog
        open={!!reopening}
        title="Reabrir mês"
        description={`Reabrir ${reopening} permite editar lançamentos novamente. O snapshot histórico é mantido.`}
        confirmLabel="Reabrir"
        onConfirm={handleReopen}
        onCancel={() => setReopening(null)}
      />
    </div>
  );
}
