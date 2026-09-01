import type { ProjectStatus, TaskStatus, Health } from "@/db/schema";

/**
 * Guardas de transição de status.
 *
 * Os campos que sustentam o relatório são exigidos NA TRANSIÇÃO, nunca no
 * cadastro: formulário longo na criação mata a adoção, campo pedido na hora
 * certa é aceito. Estas funções são a tradução literal dessa política.
 */

export type Guard = { ok: true } | { ok: false; errors: string[] };

const ok: Guard = { ok: true };
const fail = (...errors: string[]): Guard => ({ ok: false, errors });

/* ------------------------------- Tarefas ------------------------------- */

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  a_fazer: ["em_execucao", "bloqueada"],
  em_execucao: ["a_fazer", "bloqueada", "em_revisao", "concluida"],
  bloqueada: ["a_fazer", "em_execucao"],
  em_revisao: ["em_execucao", "concluida"],
  concluida: ["em_execucao"],
};

export interface TaskTransitionInput {
  from: TaskStatus;
  to: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  blockedReason: string | null;
}

export function canTransitionTask(input: TaskTransitionInput): Guard {
  const { from, to } = input;
  if (from === to) return ok;

  if (!TASK_TRANSITIONS[from].includes(to)) {
    return fail(`Transição inválida: ${taskStatusLabel(from)} → ${taskStatusLabel(to)}.`);
  }

  const errors: string[] = [];

  // Regra 2 do contrato: toda tarefa tem responsável e prazo antes de andar.
  if (from === "a_fazer") {
    if (!input.assigneeId) errors.push("Defina o responsável antes de iniciar a tarefa.");
    if (!input.dueDate) errors.push("Defina o prazo antes de iniciar a tarefa.");
  }

  // Regra 5: bloqueio é declarado, com motivo, no mesmo dia.
  if (to === "bloqueada" && !input.blockedReason?.trim()) {
    errors.push("Descreva o motivo do bloqueio e quem destrava.");
  }

  return errors.length > 0 ? { ok: false, errors } : ok;
}

/* ------------------------------- Projetos ------------------------------ */

const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  ideia: ["em_avaliacao", "cancelado"],
  em_avaliacao: ["aprovado", "ideia", "cancelado"],
  aprovado: ["em_execucao", "pausado", "cancelado"],
  em_execucao: ["em_revisao", "pausado", "cancelado", "concluido"],
  em_revisao: ["em_execucao", "concluido", "cancelado"],
  concluido: ["em_execucao"],
  pausado: ["em_execucao", "aprovado", "cancelado"],
  cancelado: ["ideia"],
};

export interface ProjectTransitionInput {
  from: ProjectStatus;
  to: ProjectStatus;
  ownerId: string | null;
  dueDate: string | null;
  stopReason: string | null;
}

export function canTransitionProject(input: ProjectTransitionInput): Guard {
  const { from, to } = input;
  if (from === to) return ok;

  if (!PROJECT_TRANSITIONS[from].includes(to)) {
    return fail(
      `Transição inválida: ${projectStatusLabel(from)} → ${projectStatusLabel(to)}.`,
    );
  }

  const errors: string[] = [];

  // A data-alvo da aprovação vira a baseline contra a qual "no prazo" é medido.
  if (to === "aprovado") {
    if (!input.ownerId) errors.push("Todo projeto aprovado tem um único owner.");
    if (!input.dueDate) errors.push("Defina a data-alvo antes de aprovar o projeto.");
  }

  // Regra 9: projeto cancelado é resultado, não fracasso — mas o motivo fica.
  if ((to === "pausado" || to === "cancelado") && !input.stopReason?.trim()) {
    errors.push(
      to === "pausado"
        ? "Explique por que o projeto está sendo pausado."
        : "Explique por que o projeto está sendo cancelado.",
    );
  }

  return errors.length > 0 ? { ok: false, errors } : ok;
}

/** O override do farol só existe com justificativa escrita. */
export function canOverrideHealth(health: Health | null, reason: string | null): Guard {
  if (health === null) return ok;
  return reason?.trim()
    ? ok
    : fail("Justifique por escrito o farol declarado — ele diverge do calculado.");
}

/* ------------------------------ Iniciativas ---------------------------- */

export function canActivateInitiative(indicatorName: string | null): Guard {
  return indicatorName?.trim()
    ? ok
    : fail(
        "Iniciativa sem indicador é rotina invisível: defina o que vai ser medido antes de ativar.",
      );
}

/* -------------------------------- Rótulos ------------------------------ */

export function taskStatusLabel(status: TaskStatus): string {
  return {
    a_fazer: "A fazer",
    em_execucao: "Em execução",
    bloqueada: "Bloqueada",
    em_revisao: "Em revisão",
    concluida: "Concluída",
  }[status];
}

export function projectStatusLabel(status: ProjectStatus): string {
  return {
    ideia: "Ideia",
    em_avaliacao: "Em avaliação",
    aprovado: "Aprovado",
    em_execucao: "Em execução",
    em_revisao: "Em revisão",
    concluido: "Concluído",
    pausado: "Pausado",
    cancelado: "Cancelado",
  }[status];
}

export const TASK_BOARD_ORDER: TaskStatus[] = [
  "a_fazer",
  "em_execucao",
  "bloqueada",
  "em_revisao",
  "concluida",
];

export const PROJECT_ACTIVE_STATUSES: ProjectStatus[] = [
  "aprovado",
  "em_execucao",
  "em_revisao",
];

export function nextTaskStatuses(from: TaskStatus): TaskStatus[] {
  return TASK_TRANSITIONS[from];
}

export function nextProjectStatuses(from: ProjectStatus): ProjectStatus[] {
  return PROJECT_TRANSITIONS[from];
}
