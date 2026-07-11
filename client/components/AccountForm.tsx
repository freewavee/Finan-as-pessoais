import { useState } from "react";
import { AccountType } from "../types";
import { reaisToCents } from "../lib/format";

interface AccountFormProps {
  onSubmit: (input: { name: string; type: AccountType; initialBalanceCents: number }) => Promise<void>;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "CORRENTE", label: "Conta corrente" },
  { value: "POUPANCA", label: "Poupança" },
  { value: "CARTEIRA", label: "Carteira" },
  { value: "INVESTIMENTO", label: "Investimento" },
  { value: "OUTRO", label: "Outro" },
];

const inputClass =
  "w-full border border-line rounded px-3 py-2 bg-bg text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-primary";

export function AccountForm({ onSubmit }: AccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CORRENTE");
  const [initialBalance, setInitialBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Informe um nome pra conta.");
      return;
    }
    setSubmitting(true);
    try {
      const balanceNumber = Number((initialBalance || "0").replace(",", "."));
      await onSubmit({ name: name.trim(), type, initialBalanceCents: reaisToCents(balanceNumber || 0) });
      setName("");
      setInitialBalance("");
    } catch (err: any) {
      setError(err.message ?? "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="text-sm block">
        <span className="block text-ink-muted mb-1">Nome</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Nubank, Carteira, Inter..."
          className={inputClass}
        />
      </label>

      <label className="text-sm block">
        <span className="block text-ink-muted mb-1">Tipo</span>
        <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className={inputClass}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm block">
        <span className="block text-ink-muted mb-1">Saldo inicial (R$)</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className={`${inputClass} tabular-money`}
        />
      </label>

      {error && <p className="text-expense text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded transition-all disabled:opacity-50"
      >
        {submitting ? "Salvando..." : "Criar conta"}
      </button>
    </form>
  );
}
