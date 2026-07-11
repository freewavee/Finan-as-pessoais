import { useState } from "react";
import { Account, Category, PaymentMethod, TransactionType } from "../types";
import { reaisToCents } from "../lib/format";

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSubmit: (input: {
    date: string;
    amountCents: number;
    type: TransactionType;
    description: string;
    accountId: string;
    categoryId: string;
    paymentMethodId: string;
  }) => Promise<void>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full border border-line rounded px-3 py-2 bg-bg text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-primary";

export function TransactionForm({ accounts, categories, paymentMethods, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("SAIDA");
  const [date, setDate] = useState(todayIsoDate());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNumber = Number(amount.replace(",", "."));
    if (!amountNumber || amountNumber <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (!description.trim()) {
      setError("Informe uma descrição.");
      return;
    }
    const category = filteredCategories.find((c) => c.id === categoryId) ?? filteredCategories[0];
    if (!category) {
      setError("Cadastre ao menos uma categoria desse tipo primeiro.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        date,
        amountCents: reaisToCents(amountNumber),
        type,
        description: description.trim(),
        accountId,
        categoryId: category.id,
        paymentMethodId,
      });
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setError(err.message ?? "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-md border border-line overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setType("SAIDA")}
          className={`flex-1 py-2 transition-colors ${
            type === "SAIDA" ? "bg-expense text-white" : "bg-transparent text-ink-muted"
          }`}
        >
          Saída
        </button>
        <button
          type="button"
          onClick={() => setType("ENTRADA")}
          className={`flex-1 py-2 transition-colors ${
            type === "ENTRADA" ? "bg-income text-white" : "bg-transparent text-ink-muted"
          }`}
        >
          Entrada
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block text-ink-muted mb-1">Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="block text-ink-muted mb-1">Valor (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} tabular-money`}
          />
        </label>
      </div>

      <label className="text-sm block">
        <span className="block text-ink-muted mb-1">Descrição</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Mercado, Uber, salário..."
          className={inputClass}
        />
      </label>

      <label className="text-sm block">
        <span className="block text-ink-muted mb-1">Categoria</span>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          <option value="">Selecione...</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block text-ink-muted mb-1">Conta</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-ink-muted mb-1">Forma de pagamento</span>
          <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className={inputClass}>
            {paymentMethods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-expense text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded transition-all disabled:opacity-50"
      >
        {submitting ? "Salvando..." : "Adicionar lançamento"}
      </button>
    </form>
  );
}
