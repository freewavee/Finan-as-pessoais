import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EntradasSaidasMes } from "../../types";
import { formatCentsToBRL } from "../../lib/format";
import { formatMonthLabel } from "../../lib/format";

interface Props {
  data: EntradasSaidasMes[];
}

export function EntradasSaidasChart({ data }: Props) {
  const hasData = data.some((d) => d.entradasCents > 0 || d.saidasCents > 0);
  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month),
    Entradas: d.entradasCents / 100,
    Saídas: d.saidasCents / 100,
  }));

  if (!hasData) {
    return (
      <div className="bg-surface border border-line rounded-md p-5">
        <h3 className="font-display font-semibold text-base mb-4">Entradas x Saídas — últimos 12 meses</h3>
        <div className="h-[260px] flex items-center justify-center text-ink-muted text-sm">
          Ainda não há transações nesse período.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-md p-5">
      <h3 className="font-display font-semibold text-base mb-4">Entradas x Saídas — últimos 12 meses</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
            contentStyle={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-text)" }}
            formatter={(value) => formatCentsToBRL(Math.round(Number(value) * 100))}
          />
          <Bar dataKey="Entradas" fill="var(--color-income)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Saídas" fill="var(--color-expense)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
