import { ReactNode } from "react";
import { useDensity } from "../../contexts/DensityContext";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, empty }: DataTableProps<T>) {
  const { isCompact } = useDensity();
  const cellPad = isCompact ? "px-3 py-2" : "px-4 py-3";
  const textSize = isCompact ? "text-xs" : "text-sm";

  if (rows.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className={`w-full ${textSize} text-left`}>
        <thead>
          <tr className="border-b border-line text-ink-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${cellPad} font-medium whitespace-nowrap ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="group hover:bg-surface-hover/60 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={`${cellPad} ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
