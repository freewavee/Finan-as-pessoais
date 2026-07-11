import { api } from "./api";
import { Account, Category, Transaction, ChartsData } from "../types";

/**
 * Fase 2 reescrita: ZERO endpoint novo no backend. Os 3 gráficos e a
 * contagem de transações do mês são calculados aqui, em cima do que a API
 * da Fase 1 já expõe (GET /transactions paginado + GET /accounts).
 *
 * Trade-off honesto: isso busca o HISTÓRICO INTEIRO de transações a cada
 * carregamento do dashboard, em vez de pedir pro banco já agregado. Pra um
 * app de um usuário só, nos primeiros anos de uso, isso não é problema
 * nenhum (algumas centenas/milhares de linhas, poucos KB). Se um dia o
 * histórico ficar grande o suficiente pra isso pesar, a correção é mover
 * essa agregação de volta pro backend (era exatamente o que o endpoint
 * /charts fazia) — guardei a lógica de agregação isolada aqui embaixo
 * exatamente pra essa migração ser um corta-e-cola, não uma reescrita.
 */

const FETCH_PAGE_SIZE = 200;

export async function fetchAllTransactions(): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let page = 1;
  while (true) {
    const res = await api.listTransactions({ page, pageSize: FETCH_PAGE_SIZE });
    all.push(...res.transactions);
    if (all.length >= res.total || res.transactions.length === 0) break;
    page += 1;
  }
  return all;
}

function yearMonthOf(dateIso: string): string {
  return dateIso.slice(0, 7); // "2026-07-15T00:00:00.000Z" -> "2026-07"
}

function buildLastNMonths(referenceDate: Date, n: number): string[] {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function computeChartsData(
  transactions: Transaction[],
  accounts: Account[],
  referenceDate: Date = new Date(),
  months = 12
): ChartsData {
  const monthLabels = buildLastNMonths(referenceDate, months);
  const windowStart = monthLabels[0];

  const initialBalanceCents = accounts.reduce((sum, a) => sum + a.initialBalanceCents, 0);

  // Saldo de tudo que aconteceu ANTES da janela de N meses, pra "evolução
  // do saldo" começar do valor real em vez de zero.
  let runningBalance = initialBalanceCents;
  for (const t of transactions) {
    if (yearMonthOf(t.date) < windowStart) {
      runningBalance += t.type === "ENTRADA" ? t.amountCents : -t.amountCents;
    }
  }

  const entradasSaidasPorMes = monthLabels.map((month) => {
    let entradasCents = 0;
    let saidasCents = 0;
    for (const t of transactions) {
      if (yearMonthOf(t.date) === month) {
        if (t.type === "ENTRADA") entradasCents += t.amountCents;
        else saidasCents += t.amountCents;
      }
    }
    runningBalance += entradasCents - saidasCents;
    return { month, entradasCents, saidasCents, saldoCents: runningBalance };
  });

  const evolucaoSaldo = entradasSaidasPorMes.map((m) => ({ month: m.month, saldoCents: m.saldoCents }));

  const currentMonth = monthLabels[monthLabels.length - 1];
  const categoryTotals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type === "SAIDA" && yearMonthOf(t.date) === currentMonth) {
      categoryTotals.set(t.categoryId, (categoryTotals.get(t.categoryId) ?? 0) + t.amountCents);
    }
  }
  const gastosPorCategoria = Array.from(categoryTotals.entries())
    .map(([categoryId, totalCents]) => {
      const tx = transactions.find((t) => t.categoryId === categoryId);
      return {
        categoryId,
        name: tx?.category.name ?? "Sem categoria",
        color: tx?.category.color ?? "#8C9086",
        totalCents,
      };
    })
    .sort((a, b) => b.totalCents - a.totalCents);

  return {
    entradasSaidasPorMes: entradasSaidasPorMes.map(({ month, entradasCents, saidasCents }) => ({
      month,
      entradasCents,
      saidasCents,
    })),
    evolucaoSaldo,
    gastosPorCategoria,
  };
}

export function countTransactionsInMonth(transactions: Transaction[], referenceDate: Date = new Date()): number {
  const month = `${referenceDate.getUTCFullYear()}-${String(referenceDate.getUTCMonth() + 1).padStart(2, "0")}`;
  return transactions.filter((t) => yearMonthOf(t.date) === month).length;
}
