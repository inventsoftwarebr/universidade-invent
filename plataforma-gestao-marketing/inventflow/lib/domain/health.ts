import type { Health, ProjectStatus, TaskStatus } from "@/db/schema";
import { daysBetween } from "./dates";

/**
 * Farol de saúde do projeto.
 *
 * O cálculo é puro de propósito: recebe o retrato do projeto e devolve o farol
 * mais os motivos. Isso o torna testável sem banco e — mais importante — faz
 * cada vermelho vir acompanhado da razão, para o farol abrir a conversa em vez
 * de substituí-la.
 */

export interface HealthTask {
  status: TaskStatus;
  dueDate: string | null;
  /** Dia em que a tarefa entrou em "bloqueada". */
  blockedSince: string | null;
}

export interface HealthMilestone {
  dueDate: string;
  status: "pendente" | "concluido" | "cancelado";
}

export interface HealthInput {
  today: string;
  status: ProjectStatus;
  /** Dia da última atualização de status escrita pelo owner. */
  lastStatusUpdateOn: string | null;
  /** Fallback quando o projeto nunca recebeu atualização de status. */
  createdOn: string;
  tasks: HealthTask[];
  milestones: HealthMilestone[];
  override: { health: Health; reason: string } | null;
}

export interface HealthResult {
  health: Health;
  /** O que o sistema calculou, mesmo quando o owner sobrescreveu. */
  computed: Health;
  overridden: boolean;
  reasons: string[];
}

/** Projetos fora destes estados não têm farol — não há prazo correndo. */
const TRACKED: ProjectStatus[] = ["aprovado", "em_execucao", "em_revisao"];

export const STALE_WARN_DAYS = 8;
export const STALE_CRIT_DAYS = 15;
export const MILESTONE_RISK_DAYS = 5;
export const MILESTONE_RISK_PROGRESS = 0.7;
export const BLOCK_CRIT_DAYS = 5;
export const LATE_WARN_RATIO = 0.1;
export const LATE_CRIT_RATIO = 0.25;

export function computeHealth(input: HealthInput): HealthResult {
  const { today, tasks, milestones } = input;

  if (!TRACKED.includes(input.status)) {
    return {
      health: "verde",
      computed: "verde",
      overridden: false,
      reasons: ["Projeto fora de execução — sem prazo correndo."],
    };
  }

  const red: string[] = [];
  const yellow: string[] = [];

  // Marcos
  const pending = milestones.filter((m) => m.status === "pendente");
  const overdue = pending.filter((m) => daysBetween(m.dueDate, today) > 0);
  if (overdue.length > 0) {
    red.push(
      overdue.length === 1
        ? "1 marco vencido."
        : `${overdue.length} marcos vencidos.`,
    );
  }

  // Progresso serve tanto para o risco de marco quanto para leitura na tela.
  const progress = completionRatio(tasks);
  const soon = pending.filter((m) => {
    const left = daysBetween(today, m.dueDate);
    return left >= 0 && left <= MILESTONE_RISK_DAYS;
  });
  if (soon.length > 0 && progress < MILESTONE_RISK_PROGRESS) {
    yellow.push(
      `Marco em ${daysBetween(today, soon[0]!.dueDate)} dia(s) com ${Math.round(progress * 100)}% concluído.`,
    );
  }

  // Silêncio é sinal, não neutralidade.
  const since = input.lastStatusUpdateOn ?? input.createdOn;
  const stale = daysBetween(since, today);
  if (stale >= STALE_CRIT_DAYS) {
    red.push(`Status sem atualização há ${stale} dias.`);
  } else if (stale >= STALE_WARN_DAYS) {
    yellow.push(`Status sem atualização há ${stale} dias.`);
  }

  // Tarefas atrasadas. O denominador é o total de tarefas do projeto, não só as
  // abertas: com as abertas, um único atraso no fim do projeto levaria a 100% e
  // o vermelho perderia significado.
  const lateRatio = tasks.length === 0 ? 0 : lateTasks(tasks, today).length / tasks.length;
  if (lateRatio > LATE_CRIT_RATIO) {
    red.push(`${Math.round(lateRatio * 100)}% das tarefas atrasadas.`);
  } else if (lateRatio >= LATE_WARN_RATIO) {
    yellow.push(`${Math.round(lateRatio * 100)}% das tarefas atrasadas.`);
  }

  // Bloqueios
  const longBlocks = tasks.filter(
    (t) =>
      t.status === "bloqueada" &&
      t.blockedSince !== null &&
      daysBetween(t.blockedSince, today) > BLOCK_CRIT_DAYS,
  );
  if (longBlocks.length > 0) {
    red.push(`${longBlocks.length} tarefa(s) bloqueada(s) há mais de ${BLOCK_CRIT_DAYS} dias.`);
  } else if (tasks.some((t) => t.status === "bloqueada")) {
    yellow.push("Há tarefa bloqueada.");
  }

  const computed: Health = red.length > 0 ? "vermelho" : yellow.length > 0 ? "amarelo" : "verde";
  const reasons = red.length > 0 ? red : yellow.length > 0 ? yellow : ["Sem sinal de risco."];

  if (input.override) {
    return {
      health: input.override.health,
      computed,
      overridden: input.override.health !== computed,
      reasons: [`Farol declarado pelo owner: ${input.override.reason}`, ...reasons],
    };
  }

  return { health: computed, computed, overridden: false, reasons };
}

export function lateTasks(tasks: HealthTask[], today: string): HealthTask[] {
  return tasks.filter(
    (t) => t.status !== "concluida" && t.dueDate !== null && daysBetween(t.dueDate, today) > 0,
  );
}

export function completionRatio(tasks: { status: TaskStatus }[]): number {
  if (tasks.length === 0) return 0;
  return tasks.filter((t) => t.status === "concluida").length / tasks.length;
}

export const HEALTH_LABEL: Record<Health, string> = {
  verde: "Verde",
  amarelo: "Amarelo",
  vermelho: "Vermelho",
};
