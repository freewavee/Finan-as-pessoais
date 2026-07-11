import { useState } from "react";
import { Category, CategoryType } from "../types";
import { AVAILABLE_ICON_KEYS, getCategoryIcon } from "../lib/defaults";

interface CategoryFormProps {
  initialValue?: Category;
  onSubmit: (input: { name: string; type: CategoryType; icon: string; color: string }) => Promise<void>;
}

const SWATCHES = [
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#facc15",
  "#6366f1",
  "#64748b",
];

const inputClass =
  "w-full border border-line rounded px-3 py-2 bg-bg text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-primary";

export function CategoryForm({ initialValue, onSubmit }: CategoryFormProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [type, setType] = useState<CategoryType>(initialValue?.type ?? "SAIDA");
  const [icon, setIcon] = useState(initialValue?.icon ?? AVAILABLE_ICON_KEYS[0]);
  const [color, setColor] = useState(initialValue?.color ?? SWATCHES[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Informe um nome pra categoria.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), type, icon, color });
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

      <label className="text-sm block">
        <span className="block text-ink-muted mb-1">Nome</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Mercado, Salário..."
          className={inputClass}
        />
      </label>

      <div className="text-sm">
        <span className="block text-ink-muted mb-2">Cor</span>
        <div className="flex flex-wrap gap-2">
          {SWATCHES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setColor(s)}
              aria-label={`Cor ${s}`}
              className={`w-7 h-7 rounded-full transition-transform ${
                color === s ? "ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110" : ""
              }`}
              style={{ backgroundColor: s }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded-full overflow-hidden border-0 bg-transparent cursor-pointer"
            aria-label="Cor personalizada"
          />
        </div>
      </div>

      <div className="text-sm">
        <span className="block text-ink-muted mb-2">Ícone</span>
        <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto pr-1">
          {AVAILABLE_ICON_KEYS.map((key) => {
            const Icon = getCategoryIcon(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                aria-label={key}
                className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                  icon === key ? "bg-primary-soft text-primary" : "bg-bg text-ink-muted hover:bg-surface-hover"
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-expense text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
      >
        {submitting ? "Salvando..." : initialValue ? "Salvar alterações" : "Criar categoria"}
      </button>
    </form>
  );
}
