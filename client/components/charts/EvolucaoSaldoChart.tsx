import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EvolucaoSaldoMes } from "../../types";
import { formatCentsToBRL, formatMonthLabel } from "../../lib/format";

interface Props {
  data: EvolucaoSaldoMes[];
}

export function EvolucaoSaldoChart({ data }: Props) {
  const chartData = data.map((d) => ({ month: formatMonthLabel(d.month), Saldo: d.saldoCents / 100 }));

  return (
    <div className="bg-surface border border-line rounded-md p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display font-semibold text-base">Evolução do saldo — últimos 12 meses</h3>
        <span className="text-xs text-ink-muted">contas, ainda sem investimentos</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value) => formatCentsToBRL(Math.round(Number(value) * 100))}
          />
          <Area type="monotone" dataKey="Saldo" stroke="var(--color-primary)" fill="url(#saldoGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
