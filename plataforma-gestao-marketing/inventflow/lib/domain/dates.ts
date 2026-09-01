/**
 * Datas de prazo circulam como string `YYYY-MM-DD` (o tipo `date` do Postgres),
 * nunca como `Date`. Prazo é um dia do calendário, não um instante: tratá-lo
 * como instante produz o clássico bug de "venceu ontem" para quem está em UTC.
 * Instantes de evento (criado em, concluído em) continuam sendo `timestamptz`.
 */

export const TIMEZONE = "America/Sao_Paulo";

/** Hoje no fuso de São Paulo, como `YYYY-MM-DD`. */
export function today(now: Date = new Date()): string {
  return toDayString(now);
}

export function toDayString(instant: Date): string {
  // `en-CA` formata como YYYY-MM-DD, que é exatamente o formato do tipo date.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Diferença em dias corridos entre dois dias de calendário (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function addDays(day: string, amount: number): string {
  const base = Date.parse(`${day}T00:00:00Z`) + amount * 86_400_000;
  return new Date(base).toISOString().slice(0, 10);
}

/** Dia da semana com segunda = 0 … domingo = 6. */
export function weekdayIndex(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function startOfWeek(day: string): string {
  return addDays(day, -weekdayIndex(day));
}

export function endOfWeek(day: string): string {
  return addDays(startOfWeek(day), 6);
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function endOfMonth(day: string): string {
  const [y, m] = day.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${day.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

/** Dias úteis entre dois dias, inclusive nas pontas. Não considera feriados. */
export function businessDaysBetween(from: string, to: string): number {
  let count = 0;
  for (let d = from; daysBetween(d, to) >= 0; d = addDays(d, 1)) {
    if (weekdayIndex(d) < 5) count += 1;
  }
  return count;
}

/** Soma dias úteis a uma data — base do relógio de SLA. */
export function addBusinessDays(day: string, amount: number): string {
  let remaining = amount;
  let cursor = day;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (weekdayIndex(cursor) < 5) remaining -= 1;
  }
  return cursor;
}

/** `2026-03-09` → `09/03/2026`. */
export function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

/** `2026-03-09` → `9 de mar`. */
export function formatDayShort(day: string): string {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [, m, d] = day.split("-") as [string, string, string];
  return `${Number(d)} de ${months[Number(m) - 1]}`;
}

/** `2026-03` → `mar/26`. */
export function formatMonth(month: string): string {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [y, m] = month.split("-") as [string, string];
  return `${months[Number(m) - 1]}/${y.slice(2)}`;
}

/** Lista de meses `YYYY-MM` terminando no mês de `day`. */
export function lastMonths(day: string, count: number): string[] {
  const [y, m] = day.split("-").map(Number) as [number, number];
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/** Segundas-feiras das próximas `count` semanas, a partir da semana de `day`. */
export function nextWeekStarts(day: string, count: number): string[] {
  const first = startOfWeek(day);
  return Array.from({ length: count }, (_, i) => addDays(first, i * 7));
}

export function relativeDayLabel(day: string, ref: string): string {
  const diff = daysBetween(ref, day);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff < 0) return `${Math.abs(diff)} dias atrás`;
  return `em ${diff} dias`;
}
