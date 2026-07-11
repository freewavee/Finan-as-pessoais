// Espelha backend/src/lib/money.ts — o frontend também trabalha em centavos
// e só converte pra reais na hora de exibir. Nunca faça matemática com o
// resultado de formatCentsToBRL, ele é só texto de exibição.

export function centsToReais(cents: number): number {
  return cents / 100;
}

export function reaisToCents(value: number): number {
  return Math.round(value * 100);
}

export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centsToReais(cents));
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}
