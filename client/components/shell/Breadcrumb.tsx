import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { breadcrumbsFor } from "../../lib/navigation";

export function Breadcrumb({ pathname }: { pathname: string }) {
  const crumbs = breadcrumbsFor(pathname);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm text-ink-muted overflow-hidden">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight size={14} className="shrink-0 opacity-50" />}
              {last || !c.path ? (
                <span className="text-ink font-medium truncate">{c.label}</span>
              ) : (
                <Link
                  to={c.path}
                  className="hover:text-ink transition-colors truncate hidden sm:inline"
                >
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
