import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { GastoPorCategoria } from "../../types";
import { formatCentsToBRL } from "../../lib/format";

interface Props {
  data: GastoPorCategoria[];
}

export function GastosPorCategoriaChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-md p-5">
        <h3 className="font-display font-semibold text-base mb-4">Gastos por categoria — este mês</h3>
        <div className="h-[260px] flex items-center justify-center text-ink-muted text-sm">
          Nenhuma saída lançada este mês ainda.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-md p-5">
      <h3 className="font-display font-semibold text-base mb-4">Gastos por categoria — este mês</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="totalCents"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.color} stroke="var(--color-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value) => formatCentsToBRL(Number(value))}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
