import { motion } from "framer-motion";

interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({
  percent,
  color = "var(--color-primary)",
  height = 8,
  className = "",
}: ProgressBarProps) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`w-full rounded-full bg-surface-hover overflow-hidden ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${p}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}
