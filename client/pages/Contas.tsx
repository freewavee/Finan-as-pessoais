import { useEffect, useState, useCallback } from "react";
import { Plus, Wallet, Archive } from "lucide-react";
import { api } from "../lib/api";
import { Account } from "../types";
import { formatCentsToBRL } from "../lib/format";
import { AccountForm } from "../components/AccountForm";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SummaryCardSkeleton } from "../components/Skeleton";
import { useToast } from "../lib/toast";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { RowActions } from "../components/ui/RowActions";
import { useNewQueryParam } from "../hooks/useNewQueryParam";

const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  CORRENTE: "Conta corrente",
  POUPANCA: "Poupança",
  CARTEIRA: "Carteira",
  INVESTIMENTO: "Investimento",
  OUTRO: "Outro",
};

export function Contas() {
  const { show } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [archiving, setArchiving] = useState<Account | null>(null);

  const openCreate = useCallback(() => setModalOpen(true), []);
  useNewQueryParam(openCreate);

  const load = useCallback(async () => {
    const data = await api.listAccounts();
    setAccounts(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleCreate(input: Parameters<typeof api.createAccount>[0]) {
    await api.createAccount(input);
    await load();
    setModalOpen(false);
    show("Conta criada.");
  }

  async function handleConfirmArchive() {
    if (!archiving) return;
    try {
      await api.archiveAccount(archiving.id);
      await load();
      show("Conta arquivada.");
    } catch (err: any) {
      show(err.message ?? "Não foi possível arquivar.", "error");
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Contas"
        description="Saldos iniciais e contas ativas"
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Nova conta
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhuma conta cadastrada"
          description="Crie uma carteira ou conta bancária para começar."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((a) => (
            <div key={a.id} className="bg-surface border border-line rounded-xl p-5 group hover:border-primary/30 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center">
                  <Wallet size={16} className="text-primary" />
                </div>
                <RowActions>
                  <button
                    onClick={() => setArchiving(a)}
                    className="p-1.5 text-ink-muted hover:text-expense"
                    aria-label={`Arquivar ${a.name}`}
                  >
                    <Archive size={15} />
                  </button>
                </RowActions>
              </div>
              <p className="text-ink font-medium">{a.name}</p>
              <p className="text-xs text-ink-muted mb-3">{ACCOUNT_TYPE_LABELS[a.type]}</p>
              <p className="tabular-money text-lg">{formatCentsToBRL(a.initialBalanceCents)}</p>
              <p className="text-xs text-ink-muted">saldo inicial</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova conta">
        <AccountForm onSubmit={handleCreate} />
      </Modal>

      <ConfirmDialog
        open={!!archiving}
        title="Arquivar conta"
        description={`"${archiving?.name}" vai sair das listas de lançamento, mas o histórico de transações continua intacto.`}
        confirmLabel="Arquivar"
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}
