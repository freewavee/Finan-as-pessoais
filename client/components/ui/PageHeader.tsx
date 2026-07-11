import { ReactNode } from "react";
import { useDensity } from "../../contexts/DensityContext";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { isCompact } = useDensity();
  return (
    <div
      className={`flex items-start justify-between flex-wrap gap-3 ${
        isCompact ? "mb-4" : "mb-6"
      }`}
    >
      <div className="min-w-0">
        <h1 className="font-display font-bold text-xl md:text-2xl tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="text-ink-muted text-sm mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
