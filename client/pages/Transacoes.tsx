import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { api } from "../lib/api";
import { Account, Category, PaymentMethod, Transaction } from "../types";
import { TransactionList } from "../components/TransactionList";
import { TransactionForm } from "../components/TransactionForm";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TransactionRowSkeleton } from "../components/Skeleton";
import { useToast } from "../lib/toast";
import { PageHeader } from "../components/ui/PageHeader";
import { useNewQueryParam } from "../hooks/useNewQueryParam";

const PAGE_SIZE = 20;

const selectClass =
  "border border-line rounded px-3 py-2 bg-surface text-ink text-sm focus:outline-none focus:ring-1 focus:ring-primary";

export function Transacoes() {
  const { show } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "ENTRADA" | "SAIDA">("");

  const openCreate = useCallback(() => setModalOpen(true), []);
  useNewQueryParam(openCreate);

  const loadTransactions = useCallback(async () => {
    const res = await api.listTransactions({
      page,
      pageSize: PAGE_SIZE,
      accountId: accountFilter || undefined,
      categoryId: categoryFilter || undefined,
      type: typeFilter || undefined,
    });
    setTransactions(res.transactions);
    setTotal(res.total);
  }, [page, accountFilter, categoryFilter, typeFilter]);

  useEffect(() => {
    async function loadStatic() {
      const [accountsData, categoriesData, methodsData] = await Promise.all([
        api.listAccounts(),
        api.listCategories(),
        api.listPaymentMethods(),
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
      setPaymentMethods(methodsData);
    }
    loadStatic();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTransactions().finally(() => setLoading(false));
  }, [loadTransactions]);

  async function handleCreateTransaction(input: Parameters<typeof api.createTransaction>[0]) {
    await api.createTransaction(input);
    await loadTransactions();
    setModalOpen(false);
    show("Transação adicionada.");
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    try {
      await api.deleteTransaction(deleting.id);
      await loadTransactions();
      show("Transação removida.");
    } catch (err: any) {
      show(err.message ?? "Não foi possível excluir.", "error");
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Transações"
        description="Histórico completo de lançamentos"
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

      <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
        <select
          value={typeFilter}
          onChange={(e) => {
            setPage(1);
            setTypeFilter(e.target.value as "" | "ENTRADA" | "SAIDA");
          }}
          className={selectClass}
        >
          <option value="">Todos os tipos</option>
          <option value="ENTRADA">Entradas</option>
          <option value="SAIDA">Saídas</option>
        </select>
        <select
          value={accountFilter}
          onChange={(e) => {
            setPage(1);
            setAccountFilter(e.target.value);
          }}
          className={selectClass}
        >
          <option value="">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1);
            setCategoryFilter(e.target.value);
          }}
          className={selectClass}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-line rounded-md p-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <TransactionRowSkeleton key={i} />)
        ) : (
          <TransactionList transactions={transactions} onDeleteRequest={setDeleting} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-ink-muted">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded border border-line disabled:opacity-40 hover:text-ink"
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded border border-line disabled:opacity-40 hover:text-ink"
          >
            Próxima
          </button>
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
