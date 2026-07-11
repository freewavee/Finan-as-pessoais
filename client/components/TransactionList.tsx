import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Transaction } from "../types";
import { formatCentsToBRL, formatDate } from "../lib/format";
import { getCategoryIcon } from "../lib/defaults";
import { useDensity } from "../contexts/DensityContext";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { DataTable, type Column } from "./ui/DataTable";
import { RowActions } from "./ui/RowActions";
import { EmptyState } from "./ui/EmptyState";
import { ArrowLeftRight } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteRequest: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, onDeleteRequest }: TransactionListProps) {
  const { isCompact } = useDensity();
  const isDesktop = useIsDesktop();

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Nenhum lançamento"
        description="Adicione o primeiro para começar a acompanhar suas finanças."
      />
    );
  }

  if (isDesktop && isCompact) {
    const columns: Column<Transaction>[] = [
      {
        key: "date",
        header: "Data",
        render: (t) => <span className="text-ink-muted whitespace-nowrap">{formatDate(t.date)}</span>,
      },
      {
        key: "desc",
        header: "Descrição",
        render: (t) => <span className="text-ink font-medium">{t.description}</span>,
      },
      {
        key: "cat",
        header: "Categoria",
        render: (t) => t.category.name,
      },
      {
        key: "acc",
        header: "Conta",
        render: (t) => t.account.name,
      },
      {
        key: "amount",
        header: "Valor",
        className: "text-right",
        render: (t) => (
          <span
            className={`tabular-money font-medium ${
              t.type === "ENTRADA" ? "text-income" : "text-expense"
            }`}
          >
            {t.type === "SAIDA" ? "− " : "+ "}
            {formatCentsToBRL(t.amountCents)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (t) => (
          <RowActions>
            <button
              onClick={() => onDeleteRequest(t)}
              className="p-1.5 text-ink-muted hover:text-expense"
              aria-label={`Excluir ${t.description}`}
            >
              <Trash2 size={14} />
            </button>
          </RowActions>
        ),
      },
    ];

    return (
      <DataTable columns={columns} rows={transactions} rowKey={(t) => t.id} />
    );
  }

  const pad = isCompact ? "py-2" : "py-3";

  return (
    <div className="divide-y divide-line">
      <AnimatePresence initial={false}>
        {transactions.map((t) => {
          const Icon = getCategoryIcon(t.category.icon);
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`group flex items-center gap-3 md:gap-4 ${pad} px-1 hover:bg-surface-hover rounded-lg transition-colors`}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                style={{ backgroundColor: `${t.category.color}22`, color: t.category.color }}
              >
                <Icon size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-ink truncate ${isCompact ? "text-xs" : "text-sm"}`}>
                  {t.description}
                </p>
                <p className="text-xs text-ink-muted truncate">
                  {t.category.name} · {t.account.name} · {t.paymentMethod.name}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`tabular-money font-medium ${isCompact ? "text-xs" : "text-sm"} ${
                    t.type === "ENTRADA" ? "text-income" : "text-expense"
                  }`}
                >
                  {t.type === "SAIDA" ? "− " : "+ "}
                  {formatCentsToBRL(t.amountCents)}
                </p>
                <p className="text-xs text-ink-muted">{formatDate(t.date)}</p>
              </div>

              <RowActions>
                <button
                  onClick={() => onDeleteRequest(t)}
                  className="p-1.5 text-ink-muted hover:text-expense"
                  aria-label={`Excluir lançamento ${t.description}`}
                >
                  <Trash2 size={15} />
                </button>
              </RowActions>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
