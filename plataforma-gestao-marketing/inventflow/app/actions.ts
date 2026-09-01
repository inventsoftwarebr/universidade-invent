"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  auditLog,
  initiativeCheckins,
  initiatives,
  milestones,
  projects,
  statusUpdates,
  taskEvents,
  tasks,
} from "@/db/schema";
import { canEditProject, canEditTask, requireUser, setSession, clearSession } from "@/lib/auth";
import {
  canOverrideHealth,
  canTransitionProject,
  canTransitionTask,
} from "@/lib/domain/rules";
import { addDays, startOfWeek, today } from "@/lib/domain/dates";
import type { ActionState } from "@/lib/action-state";

/**
 * Server Actions.
 *
 * Toda entrada é validada no servidor com Zod — o cliente nunca é a autoridade —
 * e toda transição passa pelos guardas de `lib/domain/rules`, que são os mesmos
 * cobertos por teste. As mensagens de erro voltam em português e dizem o que
 * falta fazer, não o que o sistema não conseguiu.
 */

function fail(...errors: string[]): ActionState {
  return { ok: false, errors };
}

const ok: ActionState = { ok: true, errors: [] };

/* ------------------------------- sessão -------------------------------- */

export async function entrarComo(formData: FormData): Promise<void> {
  const personId = z.uuid().safeParse(formData.get("personId"));
  if (!personId.success) redirect("/entrar?erro=1");
  await setSession(personId.data);
  redirect("/");
}

export async function sair(): Promise<void> {
  await clearSession();
  redirect("/entrar");
}

/* -------------------------------- tarefas ------------------------------- */

const criarTarefaSchema = z.object({
  title: z.string().trim().min(3, "Descreva a tarefa em pelo menos 3 caracteres."),
  parent: z.string().trim().min(1, "Toda tarefa pertence a um projeto ou a uma iniciativa."),
  assigneeId: z.union([z.uuid(), z.literal("")]).optional(),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional(),
  estimateHours: z.union([z.coerce.number().positive().max(200), z.literal("")]).optional(),
  priority: z.enum(["p0", "p1", "p2", "p3"]).default("p2"),
});

export async function criarTarefa(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = criarTarefaSchema.safeParse({
    title: formData.get("title"),
    parent: formData.get("parent"),
    assigneeId: formData.get("assigneeId") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    estimateHours: formData.get("estimateHours") ?? "",
    priority: formData.get("priority") ?? "p2",
  });

  if (!parsed.success) {
    return fail(...parsed.error.issues.map((i) => i.message));
  }

  // O campo `parent` chega como "projeto:<id>" ou "iniciativa:<id>": é a
  // tradução em formulário da regra de que toda tarefa tem exatamente um pai.
  const [kind, parentId] = parsed.data.parent.split(":");
  if ((kind !== "projeto" && kind !== "iniciativa") || !z.uuid().safeParse(parentId).success) {
    return fail("Selecione o projeto ou a iniciativa a que esta tarefa pertence.");
  }

  const [created] = await db
    .insert(tasks)
    .values({
      title: parsed.data.title,
      projectId: kind === "projeto" ? parentId! : null,
      initiativeId: kind === "iniciativa" ? parentId! : null,
      assigneeId: parsed.data.assigneeId || null,
      createdById: user.id,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate || null,
      estimateHours:
        typeof parsed.data.estimateHours === "number" ? String(parsed.data.estimateHours) : null,
    })
    .returning();

  if (created) {
    await db.insert(auditLog).values({
      actorId: user.id,
      entity: "task",
      entityId: created.id,
      action: "created",
      payload: { title: created.title },
    });
  }

  revalidatePath("/", "layout");
  return ok;
}

const moverTarefaSchema = z.object({
  taskId: z.uuid(),
  to: z.enum(["a_fazer", "em_execucao", "bloqueada", "em_revisao", "concluida"]),
  blockedReason: z.string().trim().optional(),
  assigneeId: z.union([z.uuid(), z.literal("")]).optional(),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional(),
});

export async function moverTarefa(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = moverTarefaSchema.safeParse({
    taskId: formData.get("taskId"),
    to: formData.get("to"),
    blockedReason: formData.get("blockedReason") ?? "",
    assigneeId: formData.get("assigneeId") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });

  if (!parsed.success) return fail("Dados inválidos para mover a tarefa.");

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, parsed.data.taskId),
    with: { project: true, initiative: true },
  });
  if (!task) return fail("Tarefa não encontrada.");

  const parentOwnerId = task.project?.ownerId ?? task.initiative?.ownerId ?? null;
  if (!canEditTask(user, task, parentOwnerId)) {
    return fail("Esta tarefa não é sua. Fale com o responsável ou com a coordenação.");
  }

  // O formulário de transição pode trazer os campos que faltavam — é assim que a
  // obrigatoriedade acontece no momento certo, sem travar a criação.
  const assigneeId = parsed.data.assigneeId || task.assigneeId;
  const dueDate = parsed.data.dueDate || task.dueDate;
  const blockedReason = parsed.data.blockedReason?.trim() || task.blockedReason;

  const guard = canTransitionTask({
    from: task.status,
    to: parsed.data.to,
    assigneeId,
    dueDate,
    blockedReason: parsed.data.to === "bloqueada" ? (parsed.data.blockedReason?.trim() ?? null) : blockedReason,
  });
  if (!guard.ok) return { ok: false, errors: guard.errors };

  const now = new Date();
  const to = parsed.data.to;

  await db
    .update(tasks)
    .set({
      status: to,
      assigneeId,
      dueDate,
      blockedReason: to === "bloqueada" ? blockedReason : null,
      blockedUntil: to === "bloqueada" ? addDays(today(), 7) : null,
      // A primeira entrada em execução é a origem do cycle time e não se reescreve.
      startedAt: to === "em_execucao" && !task.startedAt ? now : task.startedAt,
      completedAt: to === "concluida" ? now : null,
      updatedAt: now,
    })
    .where(eq(tasks.id, task.id));

  await db.insert(taskEvents).values({
    taskId: task.id,
    fromStatus: task.status,
    toStatus: to,
    actorId: user.id,
    at: now,
  });

  revalidatePath("/", "layout");
  return ok;
}

/* ------------------------------- projetos ------------------------------- */

const registrarStatusSchema = z.object({
  projectId: z.uuid(),
  summary: z.string().trim().min(10, "Escreva ao menos duas linhas sobre a semana."),
  declaredHealth: z.enum(["verde", "amarelo", "vermelho"]),
  overrideReason: z.string().trim().optional(),
  override: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function registrarStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = registrarStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    summary: formData.get("summary"),
    declaredHealth: formData.get("declaredHealth"),
    overrideReason: formData.get("overrideReason") ?? "",
    override: formData.get("override") ?? "",
  });

  if (!parsed.success) return fail(...parsed.error.issues.map((i) => i.message));

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, parsed.data.projectId),
  });
  if (!project) return fail("Projeto não encontrado.");
  if (!canEditProject(user, project)) {
    return fail("Só o owner do projeto ou a coordenação atualizam o status.");
  }

  const wantsOverride = parsed.data.override === "on";
  const guard = canOverrideHealth(
    wantsOverride ? parsed.data.declaredHealth : null,
    parsed.data.overrideReason ?? null,
  );
  if (!guard.ok) return { ok: false, errors: guard.errors };

  await db.insert(statusUpdates).values({
    projectId: project.id,
    authorId: user.id,
    summary: parsed.data.summary,
    declaredHealth: parsed.data.declaredHealth,
  });

  await db
    .update(projects)
    .set({
      healthOverride: wantsOverride ? parsed.data.declaredHealth : null,
      healthOverrideReason: wantsOverride ? (parsed.data.overrideReason ?? null) : null,
      healthOverrideAt: wantsOverride ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, project.id));

  revalidatePath("/", "layout");
  return ok;
}

const mudarStatusProjetoSchema = z.object({
  projectId: z.uuid(),
  to: z.enum([
    "ideia",
    "em_avaliacao",
    "aprovado",
    "em_execucao",
    "em_revisao",
    "concluido",
    "pausado",
    "cancelado",
  ]),
  stopReason: z.string().trim().optional(),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional(),
});

export async function mudarStatusProjeto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = mudarStatusProjetoSchema.safeParse({
    projectId: formData.get("projectId"),
    to: formData.get("to"),
    stopReason: formData.get("stopReason") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) return fail("Dados inválidos para mudar o status do projeto.");

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, parsed.data.projectId),
  });
  if (!project) return fail("Projeto não encontrado.");
  if (!canEditProject(user, project)) {
    return fail("Só o owner do projeto ou a coordenação mudam o status.");
  }

  const dueDate = parsed.data.dueDate || project.dueDate;
  const stopReason = parsed.data.stopReason?.trim() || null;

  const guard = canTransitionProject({
    from: project.status,
    to: parsed.data.to,
    ownerId: project.ownerId,
    dueDate,
    stopReason,
  });
  if (!guard.ok) return { ok: false, errors: guard.errors };

  const to = parsed.data.to;

  await db
    .update(projects)
    .set({
      status: to,
      dueDate,
      // A baseline é congelada na aprovação e nunca reescrita depois.
      baselineDueDate: to === "aprovado" && !project.baselineDueDate ? dueDate : project.baselineDueDate,
      actualEndDate: to === "concluido" ? today() : null,
      stopReason: to === "pausado" || to === "cancelado" ? stopReason : null,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, project.id));

  await db.insert(auditLog).values({
    actorId: user.id,
    entity: "project",
    entityId: project.id,
    action: `status:${project.status}->${to}`,
    payload: { stopReason },
  });

  revalidatePath("/", "layout");
  return ok;
}

const concluirMarcoSchema = z.object({ milestoneId: z.uuid() });

export async function concluirMarco(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = concluirMarcoSchema.safeParse({ milestoneId: formData.get("milestoneId") });
  if (!parsed.success) return fail("Marco inválido.");

  const milestone = await db.query.milestones.findFirst({
    where: eq(milestones.id, parsed.data.milestoneId),
    with: { project: true },
  });
  if (!milestone) return fail("Marco não encontrado.");
  if (!canEditProject(user, milestone.project)) {
    return fail("Só o owner do projeto ou a coordenação concluem marcos.");
  }

  await db
    .update(milestones)
    .set({ status: "concluido", actualDate: today() })
    .where(eq(milestones.id, milestone.id));

  revalidatePath("/", "layout");
  return ok;
}

/* ------------------------------ iniciativas ----------------------------- */

const checkinSchema = z.object({
  initiativeId: z.uuid(),
  indicatorValue: z.union([z.coerce.number(), z.literal("")]).optional(),
  whatRan: z.string().trim().min(5, "Diga em uma linha o que rodou no período."),
  whatBlocked: z.string().trim().optional(),
});

export async function registrarCheckin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = checkinSchema.safeParse({
    initiativeId: formData.get("initiativeId"),
    indicatorValue: formData.get("indicatorValue") ?? "",
    whatRan: formData.get("whatRan"),
    whatBlocked: formData.get("whatBlocked") ?? "",
  });
  if (!parsed.success) return fail(...parsed.error.issues.map((i) => i.message));

  const initiative = await db.query.initiatives.findFirst({
    where: eq(initiatives.id, parsed.data.initiativeId),
  });
  if (!initiative) return fail("Iniciativa não encontrada.");

  const periodDays =
    initiative.cadence === "mensal" ? 28 : initiative.cadence === "quinzenal" ? 14 : 7;
  const periodEnd = addDays(startOfWeek(today()), -1);
  const periodStart = addDays(periodEnd, -(periodDays - 1));

  const existing = await db.query.initiativeCheckins.findFirst({
    where: and(
      eq(initiativeCheckins.initiativeId, initiative.id),
      eq(initiativeCheckins.periodEnd, periodEnd),
    ),
  });
  if (existing) return fail("O check-in deste período já foi registrado.");

  await db.insert(initiativeCheckins).values({
    initiativeId: initiative.id,
    periodStart,
    periodEnd,
    indicatorValue:
      typeof parsed.data.indicatorValue === "number" ? String(parsed.data.indicatorValue) : null,
    whatRan: parsed.data.whatRan,
    whatBlocked: parsed.data.whatBlocked ?? "",
    authorId: user.id,
  });

  revalidatePath("/", "layout");
  return ok;
}

/* --------------------------------- extras ------------------------------- */
