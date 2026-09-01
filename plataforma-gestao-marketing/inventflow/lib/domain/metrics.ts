import type { Health, TaskStatus } from "@/db/schema";
import { addDays, daysBetween, startOfWeek, toDayString } from "./dates";

/**
 * Cálculos da página de relatórios.
 *
 * Todas as funções são puras e recebem linhas simples: o relatório precisa ser
 * auditável — quem discorda de um número deve conseguir ler a função que o
 * produziu. As definições seguem as do escopo (§06) e valem para todo mundo.
 */

/* ------------------------------ Prazo ---------------------------------- */

export interface DeliveryRow {
  /** Mês da entrega, `YYYY-MM`. */
  month: string;
  /** Conclusão real. */
  actualDate: string;
  /** Data planejada ORIGINAL. Nula quando o item nunca teve baseline. */
  baselineDate: string | null;
  kind: "projeto" | "marco";
}

export interface OnTimePoint {
  month: string;
  total: number;
  onTime: number;
  /** Nulo quando não houve entrega no mês — não desenhar 0% onde não há dado. */
  ratio: number | null;
}

/** "No prazo" = conclusão real ≤ data planejada original registrada na aprovação. */
export function onTimeByMonth(rows: DeliveryRow[], months: string[]): OnTimePoint[] {
  return months.map((month) => {
    const inMonth = rows.filter((r) => r.month === month && r.baselineDate !== null);
    const onTime = inMonth.filter((r) => daysBetween(r.actualDate, r.baselineDate!) >= 0);
    return {
      month,
      total: inMonth.length,
      onTime: onTime.length,
      ratio: inMonth.length === 0 ? null : onTime.length / inMonth.length,
    };
  });
}

export function deliveriesByMonth(
  rows: DeliveryRow[],
  months: string[],
): { month: string; projetos: number; marcos: number }[] {
  return months.map((month) => ({
    month,
    projetos: rows.filter((r) => r.month === month && r.kind === "projeto").length,
    marcos: rows.filter((r) => r.month === month && r.kind === "marco").length,
  }));
}

/* ------------------------------ Esforço -------------------------------- */

export interface EffortRow {
  portfolioId: string;
  portfolioName: string;
  parent: "projeto" | "iniciativa";
  estimateHours: number;
  status: TaskStatus;
}

export interface EffortByPortfolio {
  portfolioId: string;
  portfolioName: string;
  planned: number;
  delivered: number;
}

/**
 * "Realizado" é a soma das estimativas das tarefas concluídas — a plataforma
 * não aponta horas por decisão de escopo (§04). O nome do eixo diz isso na tela.
 */
export function effortByPortfolio(rows: EffortRow[]): EffortByPortfolio[] {
  const map = new Map<string, EffortByPortfolio>();
  for (const row of rows) {
    const entry = map.get(row.portfolioId) ?? {
      portfolioId: row.portfolioId,
      portfolioName: row.portfolioName,
      planned: 0,
      delivered: 0,
    };
    entry.planned += row.estimateHours;
    if (row.status === "concluida") entry.delivered += row.estimateHours;
    map.set(row.portfolioId, entry);
  }
  return [...map.values()].sort((a, b) => b.planned - a.planned);
}

/** Divisão do esforço entre trabalho com fim (projeto) e rotina (iniciativa). */
export function effortSplit(rows: EffortRow[]): { projeto: number; iniciativa: number } {
  return rows.reduce(
    (acc, r) => {
      acc[r.parent] += r.estimateHours;
      return acc;
    },
    { projeto: 0, iniciativa: 0 },
  );
}

/* ------------------------------ Portfólio ------------------------------ */

export function healthCounts(healths: Health[]): Record<Health, number> {
  return {
    verde: healths.filter((h) => h === "verde").length,
    amarelo: healths.filter((h) => h === "amarelo").length,
    vermelho: healths.filter((h) => h === "vermelho").length,
  };
}

/* --------------------------- Fluxo e tempo ----------------------------- */

export interface TaskEventRow {
  taskId: string;
  toStatus: TaskStatus;
  fromStatus: TaskStatus | null;
  at: Date;
}

export interface TaskFlowRow {
  id: string;
  status: TaskStatus;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  parent: "projeto" | "iniciativa";
}

/** Diagrama de fluxo acumulado: quantas tarefas em cada status, dia a dia. */
export function cumulativeFlow(
  tasks: TaskFlowRow[],
  events: TaskEventRow[],
  days: string[],
): { day: string; counts: Record<TaskStatus, number> }[] {
  const byTask = new Map<string, TaskEventRow[]>();
  for (const e of events) {
    const list = byTask.get(e.taskId) ?? [];
    list.push(e);
    byTask.set(e.taskId, list);
  }
  for (const list of byTask.values()) list.sort((a, b) => a.at.getTime() - b.at.getTime());

  return days.map((day) => {
    const cutoff = Date.parse(`${day}T23:59:59Z`);
    const counts: Record<TaskStatus, number> = {
      a_fazer: 0,
      em_execucao: 0,
      bloqueada: 0,
      em_revisao: 0,
      concluida: 0,
    };
    for (const task of tasks) {
      if (task.createdAt.getTime() > cutoff) continue;
      const history = byTask.get(task.id) ?? [];
      let status: TaskStatus = "a_fazer";
      for (const e of history) {
        if (e.at.getTime() > cutoff) break;
        status = e.toStatus;
      }
      counts[status] += 1;
    }
    return { day, counts };
  });
}

/** Cycle time em dias: da primeira entrada em execução até a conclusão. */
export function cycleTimeDays(task: TaskFlowRow): number | null {
  if (!task.completedAt) return null;
  const from = task.startedAt ?? task.createdAt;
  return Math.max(0, (task.completedAt.getTime() - from.getTime()) / 86_400_000);
}

/** Lead time em dias: da criação à conclusão — é o que o solicitante sente. */
export function leadTimeDays(task: TaskFlowRow): number | null {
  if (!task.completedAt) return null;
  return Math.max(0, (task.completedAt.getTime() - task.createdAt.getTime()) / 86_400_000);
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)]!;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface CycleTimeSummary {
  label: string;
  count: number;
  average: number | null;
  /** O P85 é o número que serve para prometer prazo, não a média. */
  p85: number | null;
}

export function cycleTimeByParent(tasks: TaskFlowRow[]): CycleTimeSummary[] {
  return (["projeto", "iniciativa"] as const).map((parent) => {
    const values = tasks
      .filter((t) => t.parent === parent)
      .map(cycleTimeDays)
      .filter((v): v is number => v !== null);
    return {
      label: parent === "projeto" ? "Tarefa de projeto" : "Tarefa de iniciativa",
      count: values.length,
      average: mean(values),
      p85: percentile(values, 85),
    };
  });
}

/**
 * Retrabalho: proporção de tarefas que voltaram de "em revisão" para
 * "em execução" pelo menos uma vez.
 */
export function reworkRate(taskIds: string[], events: TaskEventRow[]): number | null {
  if (taskIds.length === 0) return null;
  const ids = new Set(taskIds);
  const returned = new Set(
    events
      .filter(
        (e) => ids.has(e.taskId) && e.fromStatus === "em_revisao" && e.toStatus === "em_execucao",
      )
      .map((e) => e.taskId),
  );
  return returned.size / taskIds.length;
}

/* --------------------------- Envelhecimento ---------------------------- */

export interface AgingPoint {
  id: string;
  title: string;
  status: TaskStatus;
  days: number;
  assignee: string;
}

/** Há quantos dias cada item em andamento está aberto. */
export function agingWip(
  tasks: { id: string; title: string; status: TaskStatus; createdAt: Date; assignee: string }[],
  now: Date = new Date(),
): AgingPoint[] {
  const open: TaskStatus[] = ["em_execucao", "em_revisao", "bloqueada"];
  return tasks
    .filter((t) => open.includes(t.status))
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      assignee: t.assignee,
      days: Math.max(0, daysBetween(toDayString(t.createdAt), toDayString(now))),
    }))
    .sort((a, b) => b.days - a.days);
}

/* ------------------------------ Capacidade ----------------------------- */

export interface CapacityTask {
  assigneeId: string | null;
  dueDate: string | null;
  estimateHours: number;
  status: TaskStatus;
}

export interface CapacityCell {
  weekStart: string;
  allocated: number;
  capacity: number;
  ratio: number;
}

export interface CapacityRow {
  personId: string;
  personName: string;
  cells: CapacityCell[];
}

/**
 * Carga por pessoa e semana. A tarefa pesa na semana do seu prazo — é a
 * aproximação que o time consegue manter sem apontar horas, e é suficiente
 * para a pergunta do weekly: quem vai estourar nas próximas semanas?
 */
export function capacityGrid(
  people: { id: string; name: string; weeklyCapacityHours: number }[],
  tasks: CapacityTask[],
  weeks: string[],
  absences: { personId: string; startDate: string; endDate: string }[] = [],
): CapacityRow[] {
  return people.map((person) => ({
    personId: person.id,
    personName: person.name,
    cells: weeks.map((weekStart) => {
      const weekEnd = addDays(weekStart, 6);
      const allocated = tasks
        .filter(
          (t) =>
            t.assigneeId === person.id &&
            t.status !== "concluida" &&
            t.dueDate !== null &&
            startOfWeek(t.dueDate) === weekStart,
        )
        .reduce((sum, t) => sum + t.estimateHours, 0);

      const away = absences.filter(
        (a) =>
          a.personId === person.id &&
          daysBetween(a.startDate, weekEnd) >= 0 &&
          daysBetween(weekStart, a.endDate) >= 0,
      );
      const awayDays = away.reduce((sum, a) => {
        const from = daysBetween(weekStart, a.startDate) > 0 ? a.startDate : weekStart;
        const to = daysBetween(a.endDate, weekEnd) > 0 ? weekEnd : a.endDate;
        return sum + Math.max(0, Math.min(5, daysBetween(from, to) + 1));
      }, 0);

      const capacity = Math.max(
        0,
        person.weeklyCapacityHours * (1 - Math.min(1, awayDays / 5)),
      );
      return {
        weekStart,
        allocated,
        capacity,
        ratio: capacity === 0 ? (allocated > 0 ? 2 : 0) : allocated / capacity,
      };
    }),
  }));
}

/* ------------------------------ Iniciativas ---------------------------- */

export const CADENCE_DAYS: Record<string, number> = {
  diaria: 1,
  semanal: 7,
  quinzenal: 14,
  mensal: 30,
};

/** Um check-in é considerado em dia até 1,5× a cadência combinada. */
export function checkinAdherence(
  initiatives: { cadence: string; lastCheckinOn: string | null }[],
  today: string,
): { onTime: number; late: number; ratio: number | null } {
  if (initiatives.length === 0) return { onTime: 0, late: 0, ratio: null };
  let onTime = 0;
  for (const i of initiatives) {
    const limit = (CADENCE_DAYS[i.cadence] ?? 7) * 1.5;
    if (i.lastCheckinOn && daysBetween(i.lastCheckinOn, today) <= limit) onTime += 1;
  }
  return {
    onTime,
    late: initiatives.length - onTime,
    ratio: onTime / initiatives.length,
  };
}
