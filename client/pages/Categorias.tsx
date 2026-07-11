import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Wand2, Tags } from "lucide-react";
import { api } from "../lib/api";
import { Category, CategoryType } from "../types";
import { DEFAULT_CATEGORIES, getCategoryIcon } from "../lib/defaults";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CategoryForm } from "../components/CategoryForm";
import { useToast } from "../lib/toast";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { RowActions } from "../components/ui/RowActions";
import { SummaryCardSkeleton } from "../components/Skeleton";
import { useNewQueryParam } from "../hooks/useNewQueryParam";

function groupOf(name: string): string {
  const found = DEFAULT_CATEGORIES.find((d) => d.name.toLowerCase() === name.toLowerCase());
  return found?.group ?? "Outras";
}

export function Categorias() {
  const { show } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CategoryType>("SAIDA");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);

  const openCreate = useCallback(() => setModalOpen(true), []);
  useNewQueryParam(openCreate);

  const load = useCallback(async () => {
    const data = await api.listCategories();
    setCategories(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleCreate(input: { name: string; type: CategoryType; icon: string; color: string }) {
    await api.createCategory(input);
    await load();
    setModalOpen(false);
    show("Categoria criada.");
  }

  async function handleEdit(input: { name: string; type: CategoryType; icon: string; color: string }) {
    if (!editing) return;
    await api.updateCategory(editing.id, input);
    await load();
    setEditing(null);
    show("Categoria atualizada.");
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await api.archiveCategory(deleting.id);
      await load();
      show("Categoria arquivada.");
    } catch (err: any) {
      show(err.message ?? "Não foi possível arquivar.", "error");
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreateDefaults() {
    setCreatingDefaults(true);
    try {
      const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));
      const missing = DEFAULT_CATEGORIES.filter((d) => !existingNames.has(d.name.toLowerCase()));
      for (const d of missing) {
        await api.createCategory({ name: d.name, type: d.type, icon: d.icon, color: d.color });
      }
      await load();
      show(
        missing.length > 0
          ? `${missing.length} categorias padrão criadas.`
          : "Você já tem todas as categorias padrão."
      );
    } catch (err: any) {
      show(err.message ?? "Não foi possível criar as categorias padrão.", "error");
    } finally {
      setCreatingDefaults(false);
    }
  }

  const filtered = categories.filter((c) => c.type === tab);
  const groups = Array.from(new Set(filtered.map((c) => groupOf(c.name))));

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize entradas e saídas por categoria"
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleCreateDefaults}
              disabled={creatingDefaults}
              className="flex items-center gap-2 border border-line hover:bg-surface-hover text-ink px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Wand2 size={15} />
              {creatingDefaults ? "Criando..." : "Criar padrão"}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus size={16} />
              Nova
            </button>
          </div>
        }
      />

      <div className="flex rounded-md border border-line overflow-hidden text-sm w-fit">
        <button
          onClick={() => setTab("SAIDA")}
          className={`px-4 py-2 transition-colors ${tab === "SAIDA" ? "bg-surface-active text-ink" : "text-ink-muted"}`}
        >
          Saídas
        </button>
        <button
          onClick={() => setTab("ENTRADA")}
          className={`px-4 py-2 transition-colors ${tab === "ENTRADA" ? "bg-surface-active text-ink" : "text-ink-muted"}`}
        >
          Entradas
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={`Nenhuma categoria de ${tab === "SAIDA" ? "saída" : "entrada"}`}
          description="Crie categorias ou use o botão de padrões."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <p className="text-xs uppercase tracking-wider text-ink-muted mb-2">{group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered
                  .filter((c) => groupOf(c.name) === group)
                  .map((c) => {
                    const Icon = getCategoryIcon(c.icon);
                    return (
                      <div
                        key={c.id}
                        className="group flex items-center gap-3 bg-surface border border-line rounded-md p-3"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${c.color}22`, color: c.color }}
                        >
                          <Icon size={15} />
                        </div>
                        <span className="flex-1 text-sm text-ink truncate">{c.name}</span>
                        <RowActions>
                          <button
                            onClick={() => setEditing(c)}
                            className="p-1.5 text-ink-muted hover:text-primary"
                            aria-label={`Editar ${c.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleting(c)}
                            className="p-1.5 text-ink-muted hover:text-expense"
                            aria-label={`Excluir ${c.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </RowActions>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova categoria">
        <CategoryForm onSubmit={handleCreate} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar categoria">
        {editing && <CategoryForm initialValue={editing} onSubmit={handleEdit} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Arquivar categoria"
        description={`"${deleting?.name}" vai sair das listas, mas o histórico de transações que já usam ela continua intacto.`}
        confirmLabel="Arquivar"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
