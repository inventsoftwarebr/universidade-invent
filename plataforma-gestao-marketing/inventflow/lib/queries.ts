import { and, asc, desc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  initiativeCheckins,
  initiatives,
  milestones,
  people,
  portfolios,
  projects,
  statusUpdates,
  taskEvents,
  tasks,
  type Health,
  type Initiative,
  type Milestone,
  type Person,
  type Portfolio,
  type Project,
  type Task,
} from "@/db/schema";
import { computeHealth, completionRatio, type HealthResult } from "@/lib/domain/health";
import { today, toDayString, daysBetween } from "@/lib/domain/dates";

/* ---------------------------------------------------------------- *
 * Tipos de leitura
 * ---------------------------------------------------------------- */

export interface ProjectOverview {
  project: Project;
  portfolio: Portfolio;
  owner: Person;
  health: HealthResult;
  progress: number;
  taskCount: number;
  lateCount: number;
  blockedCount: number;
  nextMilestone: Milestone | null;
  overdueMilestones: number;
  lastStatusUpdateOn: string | null;
}

export interface InitiativeOverview {
  initiative: Initiative;
  portfolio: Portfolio;
  owner: Person;
  lastCheckinOn: string | null;
  daysSinceCheckin: number | null;
  overdue: boolean;
  history: { periodEnd: string; value: number | null }[];
  openTasks: number;
}

export interface TaskWithParent extends Task {
  parentTitle: string;
  parentKind: "projeto" | "iniciativa";
  parentSlug: string;
  assigneeName: string | null;
}

/* ---------------------------------------------------------------- *
 * Auxiliares
 * ---------------------------------------------------------------- */

/** Dia em que cada tarefa entrou no estado atual de bloqueio. */
async function blockedSinceByTask(taskIds: string[]): Promise<Map<string, string>> {
  if (taskIds.length === 0) return new Map();
  const rows = await db
    .select({ taskId: taskEvents.taskId, at: taskEvents.at })
    .from(taskEvents)
    .where(and(inArray(taskEvents.taskId, taskIds), eq(taskEvents.toStatus, "bloqueada")))
    .orderBy(asc(taskEvents.at));

  const map = new Map<string, string>();
  for (const row of rows) map.set(row.taskId, toDayString(row.at));
  return map;
}

function hours(value: string | null): number {
  return value === null ? 0 : Number(value);
}

/* ---------------------------------------------------------------- *
 * Projetos
 * ---------------------------------------------------------------- */

export async function loadProjectOverviews(options?: {
  statuses?: Project["status"][];
}): Promise<ProjectOverview[]> {
  const day = today();

  const rows = await db.query.projects.findMany({
    where: options?.statuses ? inArray(projects.status, options.statuses) : undefined,
    with: {
      portfolio: true,
      owner: true,
      milestones: { orderBy: asc(milestones.dueDate) },
      tasks: true,
      statusUpdates: { orderBy: desc(statusUpdates.createdAt), limit: 1 },
    },
    orderBy: [asc(projects.title)],
  });

  const blockedTaskIds = rows.flatMap((p) =>
    p.tasks.filter((t) => t.status === "bloqueada").map((t) => t.id),
  );
  const blockedSince = await blockedSinceByTask(blockedTaskIds);

  return rows.map((row) => {
    const lastUpdate = row.statusUpdates[0] ?? null;
    const lastStatusUpdateOn = lastUpdate ? toDayString(lastUpdate.createdAt) : null;

    const health = computeHealth({
      today: day,
      status: row.status,
      lastStatusUpdateOn,
      createdOn: toDayString(row.createdAt),
      tasks: row.tasks.map((t) => ({
        status: t.status,
        dueDate: t.dueDate,
        blockedSince: blockedSince.get(t.id) ?? null,
      })),
      milestones: row.milestones.map((m) => ({ dueDate: m.dueDate, status: m.status })),
      override:
        row.healthOverride && row.healthOverrideReason
          ? { health: row.healthOverride, reason: row.healthOverrideReason }
          : null,
    });

    const pending = row.milestones.filter((m) => m.status === "pendente");

    return {
      project: row,
      portfolio: row.portfolio,
      owner: row.owner,
      health,
      progress: completionRatio(row.tasks),
      taskCount: row.tasks.length,
      lateCount: row.tasks.filter(
        (t) => t.status !== "concluida" && t.dueDate !== null && daysBetween(t.dueDate, day) > 0,
      ).length,
      blockedCount: row.tasks.filter((t) => t.status === "bloqueada").length,
      nextMilestone: pending.find((m) => daysBetween(day, m.dueDate) >= 0) ?? pending[0] ?? null,
      overdueMilestones: pending.filter((m) => daysBetween(m.dueDate, day) > 0).length,
      lastStatusUpdateOn,
    };
  });
}

export interface ProjectDetail extends ProjectOverview {
  milestoneList: Milestone[];
  taskList: (Task & { assigneeName: string | null })[];
  updates: { id: string; summary: string; declaredHealth: Health; at: Date; author: string }[];
  blockedSince: Map<string, string>;
}

export async function loadProjectDetail(slug: string): Promise<ProjectDetail | null> {
  const row = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      portfolio: true,
      owner: true,
      milestones: { orderBy: [asc(milestones.sortOrder), asc(milestones.dueDate)] },
      tasks: { with: { assignee: true }, orderBy: [asc(tasks.dueDate)] },
      statusUpdates: {
        orderBy: desc(statusUpdates.createdAt),
        limit: 12,
        with: { author: true },
      },
    },
  });

  if (!row) return null;

  const day = today();
  const blockedSince = await blockedSinceByTask(
    row.tasks.filter((t) => t.status === "bloqueada").map((t) => t.id),
  );
  const lastUpdate = row.statusUpdates[0] ?? null;
  const lastStatusUpdateOn = lastUpdate ? toDayString(lastUpdate.createdAt) : null;

  const health = computeHealth({
    today: day,
    status: row.status,
    lastStatusUpdateOn,
    createdOn: toDayString(row.createdAt),
    tasks: row.tasks.map((t) => ({
      status: t.status,
      dueDate: t.dueDate,
      blockedSince: blockedSince.get(t.id) ?? null,
    })),
    milestones: row.milestones.map((m) => ({ dueDate: m.dueDate, status: m.status })),
    override:
      row.healthOverride && row.healthOverrideReason
        ? { health: row.healthOverride, reason: row.healthOverrideReason }
        : null,
  });

  const pending = row.milestones.filter((m) => m.status === "pendente");

  return {
    project: row,
    portfolio: row.portfolio,
    owner: row.owner,
    health,
    progress: completionRatio(row.tasks),
    taskCount: row.tasks.length,
    lateCount: row.tasks.filter(
      (t) => t.status !== "concluida" && t.dueDate !== null && daysBetween(t.dueDate, day) > 0,
    ).length,
    blockedCount: row.tasks.filter((t) => t.status === "bloqueada").length,
    nextMilestone: pending.find((m) => daysBetween(day, m.dueDate) >= 0) ?? pending[0] ?? null,
    overdueMilestones: pending.filter((m) => daysBetween(m.dueDate, day) > 0).length,
    lastStatusUpdateOn,
    milestoneList: row.milestones,
    taskList: row.tasks.map((t) => ({ ...t, assigneeName: t.assignee?.name ?? null })),
    updates: row.statusUpdates.map((u) => ({
      id: u.id,
      summary: u.summary,
      declaredHealth: u.declaredHealth,
      at: u.createdAt,
      author: u.author.name,
    })),
    blockedSince,
  };
}

/* ---------------------------------------------------------------- *
 * Iniciativas
 * ---------------------------------------------------------------- */

export async function loadInitiativeOverviews(): Promise<InitiativeOverview[]> {
  const day = today();

  const rows = await db.query.initiatives.findMany({
    with: {
      portfolio: true,
      owner: true,
      checkins: { orderBy: desc(initiativeCheckins.periodEnd), limit: 12 },
      tasks: true,
    },
    orderBy: [asc(initiatives.title)],
  });

  const limitByCadence: Record<string, number> = {
    diaria: 2,
    semanal: 11,
    quinzenal: 21,
    mensal: 45,
  };

  return rows.map((row) => {
    const last = row.checkins[0] ?? null;
    const lastCheckinOn = last?.periodEnd ?? null;
    const daysSince = lastCheckinOn ? daysBetween(lastCheckinOn, day) : null;

    return {
      initiative: row,
      portfolio: row.portfolio,
      owner: row.owner,
      lastCheckinOn,
      daysSinceCheckin: daysSince,
      overdue:
        row.status === "ativa" &&
        (daysSince === null || daysSince > (limitByCadence[row.cadence] ?? 11)),
      history: [...row.checkins]
        .reverse()
        .map((c) => ({
          periodEnd: c.periodEnd,
          value: c.indicatorValue === null ? null : Number(c.indicatorValue),
        })),
      openTasks: row.tasks.filter((t) => t.status !== "concluida").length,
    };
  });
}

export async function loadInitiative(slug: string) {
  return db.query.initiatives.findFirst({
    where: eq(initiatives.slug, slug),
    with: {
      portfolio: true,
      owner: true,
      checkins: { orderBy: desc(initiativeCheckins.periodEnd), with: { author: true } },
      tasks: { with: { assignee: true } },
    },
  });
}

/* ---------------------------------------------------------------- *
 * Minha Semana
 * ---------------------------------------------------------------- */

export async function loadMyTasks(personId: string): Promise<TaskWithParent[]> {
  const rows = await db.query.tasks.findMany({
    where: and(eq(tasks.assigneeId, personId), sql`${tasks.status} <> 'concluida'`),
    with: { project: true, initiative: true, assignee: true },
    orderBy: [asc(tasks.dueDate)],
  });

  return rows.map((t) => ({
    ...t,
    parentTitle: t.project?.title ?? t.initiative?.title ?? "—",
    parentKind: t.project ? ("projeto" as const) : ("iniciativa" as const),
    parentSlug: t.project?.slug ?? t.initiative?.slug ?? "",
    assigneeName: t.assignee?.name ?? null,
  }));
}

/** Check-ins que a pessoa deve fazer e ainda não fez. */
export async function loadPendingCheckins(personId: string): Promise<InitiativeOverview[]> {
  const all = await loadInitiativeOverviews();
  return all.filter((i) => i.initiative.ownerId === personId && i.overdue);
}

/* ---------------------------------------------------------------- *
 * Listas de apoio
 * ---------------------------------------------------------------- */

export async function listPeople(): Promise<Person[]> {
  return db.select().from(people).where(eq(people.active, true)).orderBy(asc(people.name));
}

export async function listPortfolios(): Promise<Portfolio[]> {
  return db.select().from(portfolios).orderBy(asc(portfolios.sortOrder));
}

export async function listActiveParents(): Promise<{
  projects: { id: string; title: string }[];
  initiatives: { id: string; title: string }[];
}> {
  const [projectRows, initiativeRows] = await Promise.all([
    db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(inArray(projects.status, ["aprovado", "em_execucao", "em_revisao"]))
      .orderBy(asc(projects.title)),
    db
      .select({ id: initiatives.id, title: initiatives.title })
      .from(initiatives)
      .where(eq(initiatives.status, "ativa"))
      .orderBy(asc(initiatives.title)),
  ]);
  return { projects: projectRows, initiatives: initiativeRows };
}

/* ---------------------------------------------------------------- *
 * Relatórios
 * ---------------------------------------------------------------- */

export interface ReportData {
  overviews: ProjectOverview[];
  initiatives: InitiativeOverview[];
  people: Person[];
  absences: { personId: string; startDate: string; endDate: string }[];
  deliveries: {
    month: string;
    actualDate: string;
    baselineDate: string | null;
    kind: "projeto" | "marco";
  }[];
  effort: {
    portfolioId: string;
    portfolioName: string;
    parent: "projeto" | "iniciativa";
    estimateHours: number;
    status: Task["status"];
  }[];
  flowTasks: {
    id: string;
    status: Task["status"];
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    parent: "projeto" | "iniciativa";
  }[];
  events: {
    taskId: string;
    fromStatus: Task["status"] | null;
    toStatus: Task["status"];
    at: Date;
  }[];
  capacityTasks: {
    assigneeId: string | null;
    dueDate: string | null;
    estimateHours: number;
    status: Task["status"];
  }[];
  openTasks: {
    id: string;
    title: string;
    status: Task["status"];
    createdAt: Date;
    assignee: string;
  }[];
}

export async function loadReportData(): Promise<ReportData> {
  const [overviews, initiativeOverviews, peopleRows, absenceRows] = await Promise.all([
    loadProjectOverviews(),
    loadInitiativeOverviews(),
    listPeople(),
    db.query.absences.findMany(),
  ]);

  const [projectDeliveries, milestoneDeliveries] = await Promise.all([
    db
      .select({
        actualDate: projects.actualEndDate,
        baselineDate: projects.baselineDueDate,
      })
      .from(projects)
      .where(and(eq(projects.status, "concluido"), isNotNull(projects.actualEndDate))),
    db
      .select({ actualDate: milestones.actualDate, baselineDate: milestones.baselineDate })
      .from(milestones)
      .where(and(eq(milestones.status, "concluido"), isNotNull(milestones.actualDate))),
  ]);

  const rawDeliveries: {
    actualDate: string | null;
    baselineDate: string | null;
    kind: "projeto" | "marco";
  }[] = [
    ...projectDeliveries.map((d) => ({ ...d, kind: "projeto" as const })),
    ...milestoneDeliveries.map((d) => ({ ...d, kind: "marco" as const })),
  ];

  const deliveries = rawDeliveries.flatMap((d) =>
    d.actualDate === null
      ? []
      : [
          {
            actualDate: d.actualDate,
            baselineDate: d.baselineDate,
            kind: d.kind,
            month: d.actualDate.slice(0, 7),
          },
        ],
  );

  const taskRows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      createdAt: tasks.createdAt,
      startedAt: tasks.startedAt,
      completedAt: tasks.completedAt,
      dueDate: tasks.dueDate,
      estimateHours: tasks.estimateHours,
      assigneeId: tasks.assigneeId,
      assigneeName: people.name,
      projectId: tasks.projectId,
      portfolioId: sql<string | null>`coalesce(${projects.portfolioId}, ${initiatives.portfolioId})`,
      portfolioName: portfolios.name,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(initiatives, eq(tasks.initiativeId, initiatives.id))
    .leftJoin(
      portfolios,
      or(eq(portfolios.id, projects.portfolioId), eq(portfolios.id, initiatives.portfolioId)),
    )
    .leftJoin(people, eq(tasks.assigneeId, people.id));

  const events = await db
    .select({
      taskId: taskEvents.taskId,
      fromStatus: taskEvents.fromStatus,
      toStatus: taskEvents.toStatus,
      at: taskEvents.at,
    })
    .from(taskEvents)
    .orderBy(asc(taskEvents.at));

  return {
    overviews,
    initiatives: initiativeOverviews,
    people: peopleRows,
    absences: absenceRows.map((a) => ({
      personId: a.personId,
      startDate: a.startDate,
      endDate: a.endDate,
    })),
    deliveries,
    effort: taskRows
      .filter((t) => t.portfolioId !== null && t.portfolioName !== null)
      .map((t) => ({
        portfolioId: t.portfolioId!,
        portfolioName: t.portfolioName!,
        parent: t.projectId ? ("projeto" as const) : ("iniciativa" as const),
        estimateHours: hours(t.estimateHours),
        status: t.status,
      })),
    flowTasks: taskRows.map((t) => ({
      id: t.id,
      status: t.status,
      createdAt: t.createdAt,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
      parent: t.projectId ? ("projeto" as const) : ("iniciativa" as const),
    })),
    events,
    capacityTasks: taskRows.map((t) => ({
      assigneeId: t.assigneeId,
      dueDate: t.dueDate,
      estimateHours: hours(t.estimateHours),
      status: t.status,
    })),
    openTasks: taskRows.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      createdAt: t.createdAt,
      assignee: t.assigneeName ?? "sem responsável",
    })),
  };
}

/** Indicadores individuais para a aba "Individual" e para Minha Semana. */
export async function loadPersonStats(personId: string): Promise<{
  completed: number;
  onTime: number;
  open: number;
  late: number;
}> {
  const day = today();
  const rows = await db
    .select({
      status: tasks.status,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
    })
    .from(tasks)
    .where(eq(tasks.assigneeId, personId));

  const completed = rows.filter((r) => r.status === "concluida" && r.completedAt !== null);
  const onTime = completed.filter(
    (r) => r.dueDate !== null && daysBetween(toDayString(r.completedAt!), r.dueDate) >= 0,
  );
  const open = rows.filter((r) => r.status !== "concluida");

  return {
    completed: completed.length,
    onTime: onTime.length,
    open: open.length,
    late: open.filter((r) => r.dueDate !== null && daysBetween(r.dueDate, day) > 0).length,
  };
}
