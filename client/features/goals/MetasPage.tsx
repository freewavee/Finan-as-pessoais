import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plus, Trash2, PiggyBank, Target } from "lucide-react";
import { api } from "../../services/api";
import type { Goal, GoalPriority } from "../../types";
import { formatCentsToBRL, reaisToCents } from "../../lib/format";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SummaryCardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../lib/toast";
import { useNewQueryParam } from "../../hooks/useNewQueryParam";
import { RowActions } from "../../components/ui/RowActions";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 bg-bg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

export function Metas() {
  const { show } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<Goal | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [archiving, setArchiving] = useState<Goal | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Geral",
    priority: "MEDIA" as GoalPriority,
    color: "#3B82F6",
    targetReais: "",
    deadline: "",
  });

  const openCreate = useCallback(() => setModalOpen(true), []);
  useNewQueryParam(openCreate);

  const load = useCallback(async () => {
    const data = await api.listGoals();
    setGoals(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createGoal({
        name: form.name.trim(),
        description: form.description || null,
        category: form.category,
        priority: form.priority,
        color: form.color,
        targetCents: reaisToCents(Number(form.targetReais.replace(",", "."))),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      await load();
      setModalOpen(false);
      setForm({
        name: "",
        description: "",
        category: "Geral",
        priority: "MEDIA",
        color: "#3B82F6",
        targetReais: "",
        deadline: "",
      });
      show("Meta criada.");
    } catch (err: any) {
      show(err.message ?? "Erro ao criar meta", "error");
    }
  }

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!contribGoal) return;
    try {
      await api.addGoalContribution(contribGoal.id, {
        amountCents: reaisToCents(Number(contribAmount.replace(",", "."))),
      });
      await load();
      setContribGoal(null);
      setContribAmount("");
      show("Aporte registrado.");
    } catch (err: any) {
      show(err.message ?? "Erro no aporte", "error");
    }
  }

  async function handleComplete(g: Goal) {
    try {
      await api.completeGoal(g.id);
      await load();
      show("Meta concluída!");
    } catch (err: any) {
      show(err.message ?? "Erro", "error");
    }
  }

  async function handleArchive() {
    if (!archiving) return;
    try {
      await api.archiveGoal(archiving.id);
      await load();
      show("Meta arquivada.");
    } catch (err: any) {
      show(err.message ?? "Erro", "error");
    } finally {
      setArchiving(null);
    }
  }

  const active = goals.filter((g) => g.status === "ATIVA");
  const done = goals.filter((g) => g.status === "CONCLUIDA");

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Metas"
        description="Planejamento financeiro com previsão de conclusão"
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} /> Nova meta
          </button>
        }
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta ainda"
          description="Defina objetivos como reserva de emergência, viagem ou entrada de imóvel."
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Criar primeira meta
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section className="grid sm:grid-cols-2 gap-4">
              {active.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onContribute={() => setContribGoal(g)}
                  onComplete={() => handleComplete(g)}
                  onArchive={() => setArchiving(g)}
                />
              ))}
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-ink-muted mb-3">Concluídas</h2>
              <div className="grid sm:grid-cols-2 gap-4 opacity-80">
                {done.map((g) => (
                  <GoalCard key={g.id} goal={g} onArchive={() => setArchiving(g)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova meta">
        <form onSubmit={handleCreate} className="space-y-3">
          <Field label="Nome">
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Descrição">
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Prioridade">
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as GoalPriority })
                }
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor alvo (R$)">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className={inputClass}
                value={form.targetReais}
                onChange={(e) => setForm({ ...form, targetReais: e.target.value })}
              />
            </Field>
            <Field label="Prazo">
              <input
                type="date"
                className={inputClass}
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Cor">
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-line bg-bg"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </Field>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            Criar meta
          </button>
        </form>
      </Modal>

      <Modal
        open={!!contribGoal}
        onClose={() => setContribGoal(null)}
        title={`Aporte — ${contribGoal?.name ?? ""}`}
      >
        <form onSubmit={handleContribute} className="space-y-3">
          <Field label="Valor (R$)">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              className={inputClass}
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            Registrar aporte
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archiving}
        title="Arquivar meta"
        description={`"${archiving?.name}" sairá da lista ativa.`}
        confirmLabel="Arquivar"
        onConfirm={handleArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block text-ink-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

function GoalCard({
  goal,
  onContribute,
  onComplete,
  onArchive,
}: {
  goal: Goal;
  onContribute?: () => void;
  onComplete?: () => void;
  onArchive?: () => void;
}) {
  const priorityColor =
    goal.priority === "ALTA"
      ? "text-expense"
      : goal.priority === "MEDIA"
        ? "text-primary"
        : "text-ink-muted";

  return (
    <div className="group bg-surface border border-line rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-ink truncate">{goal.name}</p>
          <p className="text-xs text-ink-muted">
            {goal.category} ·{" "}
            <span className={priorityColor}>{goal.priority.toLowerCase()}</span>
          </p>
        </div>
        <RowActions>
          {onContribute && goal.status === "ATIVA" && (
            <button
              onClick={onContribute}
              className="p-1.5 text-ink-muted hover:text-primary"
              aria-label="Aporte"
            >
              <PiggyBank size={15} />
            </button>
          )}
          {onComplete && goal.status === "ATIVA" && (
            <button
              onClick={onComplete}
              className="p-1.5 text-ink-muted hover:text-income"
              aria-label="Concluir"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          {onArchive && (
            <button
              onClick={onArchive}
              className="p-1.5 text-ink-muted hover:text-expense"
              aria-label="Arquivar"
            >
              <Trash2 size={15} />
            </button>
          )}
        </RowActions>
      </div>

      <ProgressBar percent={goal.percentComplete} color={goal.color} className="mb-2" />
      <div className="flex justify-between text-xs text-ink-muted mb-1">
        <span className="tabular-money text-ink">
          {formatCentsToBRL(goal.currentCents)}
        </span>
        <span className="tabular-money">{formatCentsToBRL(goal.targetCents)}</span>
      </div>
      <p className="text-xs text-primary font-medium">{goal.percentComplete}% concluído</p>
      {goal.forecastDate && goal.status === "ATIVA" && (
        <p className="text-[11px] text-ink-muted mt-1">
          Previsão: {new Date(goal.forecastDate).toLocaleDateString("pt-BR")}
        </p>
      )}
      {goal.contributions?.length > 0 && (
        <p className="text-[11px] text-ink-muted mt-2">
          {goal.contributions.length} aporte(s) no histórico
        </p>
      )}
    </div>
  );
}
