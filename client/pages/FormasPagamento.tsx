import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Wand2, CreditCard, Pencil } from "lucide-react";
import { api } from "../lib/api";
import { PaymentMethod } from "../types";
import { DEFAULT_PAYMENT_METHODS } from "../lib/defaults";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../lib/toast";

export function FormasPagamento() {
  const { show } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<PaymentMethod | null>(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);

  const load = useCallback(async () => {
    const data = await api.listPaymentMethods();
    setMethods(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  function openCreate() {
    setEditing(null);
    setName("");
    setModalOpen(true);
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m);
    setName(m.name);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.updatePaymentMethod(editing.id, { name: name.trim() });
        show("Forma de pagamento atualizada.");
      } else {
        await api.createPaymentMethod({ name: name.trim() });
        show("Forma de pagamento criada.");
      }
      await load();
      setName("");
      setEditing(null);
      setModalOpen(false);
    } catch (err: any) {
      show(err.message ?? "Não foi possível salvar.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await api.archivePaymentMethod(deleting.id);
      await load();
      show("Forma de pagamento arquivada.");
    } catch (err: any) {
      show(err.message ?? "Não foi possível arquivar.", "error");
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreateDefaults() {
    setCreatingDefaults(true);
    try {
      const existing = new Set(methods.map((m) => m.name.toLowerCase()));
      const missing = DEFAULT_PAYMENT_METHODS.filter((n) => !existing.has(n.toLowerCase()));
      for (const n of missing) {
        await api.createPaymentMethod({ name: n });
      }
      await load();
      show(
        missing.length > 0
          ? `${missing.length} formas de pagamento criadas.`
          : "Você já tem todas as padrão."
      );
    } catch (err: any) {
      show(err.message ?? "Não foi possível criar as formas padrão.", "error");
    } finally {
      setCreatingDefaults(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl">Formas de pagamento</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCreateDefaults}
            disabled={creatingDefaults}
            className="flex items-center gap-2 border border-line hover:bg-surface-hover text-ink px-4 py-2.5 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            <Wand2 size={15} />
            {creatingDefaults ? "Criando..." : "Criar padrão"}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors"
          >
            <Plus size={16} />
            Nova
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-muted text-sm">Carregando...</p>
      ) : methods.length === 0 ? (
        <div className="border border-dashed border-line rounded-md py-12 text-center text-ink-muted text-sm">
          Nenhuma forma de pagamento cadastrada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {methods.map((m) => (
            <div key={m.id} className="group flex items-center gap-3 bg-surface border border-line rounded-md p-4">
              <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                <CreditCard size={16} className="text-primary" />
              </div>
              <span className="flex-1 text-sm text-ink">{m.name}</span>
              <button
                onClick={() => openEdit(m)}
                className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-primary transition-opacity"
                aria-label={`Editar ${m.name}`}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setDeleting(m)}
                className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-expense transition-opacity"
                aria-label={`Excluir ${m.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar forma de pagamento" : "Nova forma de pagamento"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-sm block">
            <span className="block text-ink-muted mb-1">Nome</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vale-refeição, Boleto..."
              className="w-full border border-line rounded px-3 py-2 bg-bg text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {submitting ? "Salvando..." : editing ? "Salvar" : "Criar"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Arquivar forma de pagamento"
        description={`"${deleting?.name}" vai sair das listas, mas o histórico de transações continua intacto.`}
        confirmLabel="Arquivar"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
