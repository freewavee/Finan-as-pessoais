import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { formatCentsToBRL } from "../lib/format";

interface SummaryCardProps {
  label: string;
  icon: LucideIcon;
  tone?: "neutral" | "income" | "expense";
  emphasis?: boolean;
  index?: number;
  /** Valor monetário em centavos — formatado como BRL. Use OU esta, OU `rawValue`. */
  valueCents?: number;
  /** Valor já formatado pra exibição direta (ex: contagem de transações). */
  rawValue?: string;
  note?: string;
}

export function SummaryCard({
  label,
  icon: Icon,
  tone = "neutral",
  emphasis,
  index = 0,
  valueCents,
  rawValue,
  note,
}: SummaryCardProps) {
  const toneClass = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-ink";
  const display = rawValue ?? (valueCents !== undefined ? formatCentsToBRL(valueCents) : "—");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={`rounded-md border pb-4 pt-5 px-5 transition-colors ${
        emphasis ? "bg-surface-active border-primary/40" : "bg-surface border-line hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs uppercase tracking-wider ${emphasis ? "text-ink/70" : "text-ink-muted"}`}>
          {label}
        </p>
        <Icon size={16} className={emphasis ? "text-primary" : "text-ink-muted"} />
      </div>
      <p className={`tabular-money text-2xl font-medium ${emphasis ? "text-ink" : toneClass}`}>{display}</p>
      {note && <p className="text-xs text-ink-muted mt-1">{note}</p>}
    </motion.div>
  );
}
