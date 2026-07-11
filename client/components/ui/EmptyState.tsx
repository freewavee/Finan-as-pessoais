import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-line rounded-xl py-14 px-6 text-center">
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center mb-4">
          <Icon size={20} className="text-primary" />
        </div>
      )}
      <p className="font-display font-semibold text-ink mb-1">{title}</p>
      {description && <p className="text-sm text-ink-muted max-w-sm mx-auto mb-4">{description}</p>}
      {action}
    </div>
  );
}
