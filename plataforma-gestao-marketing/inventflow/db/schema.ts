import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  jsonb,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ *
 * Enums
 * ------------------------------------------------------------------ */

export const profileEnum = pgEnum("profile", [
  "diretoria",
  "gestao",
  "owner",
  "executor",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "ideia",
  "em_avaliacao",
  "aprovado",
  "em_execucao",
  "em_revisao",
  "concluido",
  "pausado",
  "cancelado",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "a_fazer",
  "em_execucao",
  "bloqueada",
  "em_revisao",
  "concluida",
]);

export const initiativeStatusEnum = pgEnum("initiative_status", [
  "ativa",
  "pausada",
  "encerrada",
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "pendente",
  "concluido",
  "cancelado",
]);

export const healthEnum = pgEnum("health", ["verde", "amarelo", "vermelho"]);

export const priorityEnum = pgEnum("priority", ["p0", "p1", "p2", "p3"]);

export const cadenceEnum = pgEnum("cadence", [
  "diaria",
  "semanal",
  "quinzenal",
  "mensal",
]);

/* ------------------------------------------------------------------ *
 * Pessoas e estrutura
 * ------------------------------------------------------------------ */

export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Object ID do Microsoft Entra ID. Nulo enquanto o SSO não estiver ligado. */
  entraObjectId: text("entra_object_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  jobTitle: text("job_title").notNull(),
  profile: profileEnum("profile").notNull(),
  /** Horas úteis por semana. Padrão 30: as outras 10 são reunião e imprevisto. */
  weeklyCapacityHours: integer("weekly_capacity_hours").notNull().default(30),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const absences = pgTable("absences", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id").references(() => people.id),
  /** Índice do token de cor no design system (0-5). */
  colorIndex: integer("color_index").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ------------------------------------------------------------------ *
 * Projetos — têm início, meio e fim
 * ------------------------------------------------------------------ */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => people.id),
    objective: text("objective").notNull().default(""),
    status: projectStatusEnum("status").notNull().default("ideia"),
    priority: priorityEnum("priority").notNull().default("p2"),
    startDate: date("start_date"),
    /**
     * Data-alvo congelada no momento da aprovação. NUNCA é reescrita.
     * É contra ela que "entrega no prazo" é medida — sem isso, basta
     * empurrar o prazo para o indicador ficar sempre verde.
     */
    baselineDueDate: date("baseline_due_date"),
    /** Data-alvo vigente. Muda a cada replanejamento. */
    dueDate: date("due_date"),
    actualEndDate: date("actual_end_date"),
    estimatedHours: numeric("estimated_hours", { precision: 8, scale: 1 }),
    healthOverride: healthEnum("health_override"),
    healthOverrideReason: text("health_override_reason"),
    healthOverrideAt: timestamp("health_override_at", { withTimezone: true }),
    /** Justificativa obrigatória ao pausar ou cancelar. */
    stopReason: text("stop_reason"),
    productTags: text("product_tags").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_status_idx").on(t.status),
    index("projects_portfolio_idx").on(t.portfolioId),
    check(
      "projects_override_needs_reason",
      sql`${t.healthOverride} is null or ${t.healthOverrideReason} is not null`,
    ),
  ],
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** Data planejada original — mesma lógica de baseline do projeto. */
    baselineDate: date("baseline_date").notNull(),
    dueDate: date("due_date").notNull(),
    actualDate: date("actual_date"),
    status: milestoneStatusEnum("status").notNull().default("pendente"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("milestones_project_idx").on(t.projectId)],
);

export const statusUpdates = pgTable(
  "status_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => people.id),
    summary: text("summary").notNull(),
    declaredHealth: healthEnum("declared_health").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("status_updates_project_idx").on(t.projectId, t.createdAt)],
);

/* ------------------------------------------------------------------ *
 * Iniciativas — contínuas, sem data de fim
 * ------------------------------------------------------------------ */

export const initiatives = pgTable("initiatives", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => people.id),
  description: text("description").notNull().default(""),
  cadence: cadenceEnum("cadence").notNull(),
  /** Regra inviolável: iniciativa sem indicador não pode ser ativada. */
  indicatorName: text("indicator_name").notNull(),
  indicatorUnit: text("indicator_unit").notNull(),
  targetValue: numeric("target_value", { precision: 12, scale: 2 }),
  status: initiativeStatusEnum("status").notNull().default("ativa"),
  stopReason: text("stop_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const initiativeCheckins = pgTable(
  "initiative_checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    indicatorValue: numeric("indicator_value", { precision: 12, scale: 2 }),
    whatRan: text("what_ran").notNull(),
    whatBlocked: text("what_blocked").notNull().default(""),
    authorId: uuid("author_id")
      .notNull()
      .references(() => people.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("checkins_initiative_idx").on(t.initiativeId, t.periodStart)],
);

/* ------------------------------------------------------------------ *
 * Tarefas — toda tarefa tem pai
 * ------------------------------------------------------------------ */

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    initiativeId: uuid("initiative_id").references(() => initiatives.id, {
      onDelete: "cascade",
    }),
    assigneeId: uuid("assignee_id").references(() => people.id),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => people.id),
    status: taskStatusEnum("status").notNull().default("a_fazer"),
    priority: priorityEnum("priority").notNull().default("p2"),
    dueDate: date("due_date"),
    estimateHours: numeric("estimate_hours", { precision: 6, scale: 1 }),
    /** Primeira entrada em "em_execucao" — origem do cycle time. */
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    blockedReason: text("blocked_reason"),
    blockedOwnerId: uuid("blocked_owner_id").references(() => people.id),
    blockedUntil: date("blocked_until"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_assignee_idx").on(t.assigneeId, t.status),
    index("tasks_project_idx").on(t.projectId),
    index("tasks_initiative_idx").on(t.initiativeId),
    // Regra inviolável nº 1 do modelo, garantida pelo banco e não só pela aplicação.
    check(
      "tasks_must_have_exactly_one_parent",
      sql`num_nonnulls(${t.projectId}, ${t.initiativeId}) = 1`,
    ),
    check(
      "tasks_blocked_needs_reason",
      sql`${t.status} <> 'bloqueada' or ${t.blockedReason} is not null`,
    ),
  ],
);

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnId: uuid("depends_on_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.dependsOnId] }),
    check("task_dependency_not_self", sql`${t.taskId} <> ${t.dependsOnId}`),
  ],
);

/**
 * Histórico de transições. É daqui que saem cycle time, lead time,
 * fluxo acumulado, envelhecimento e retrabalho — nenhum desses
 * indicadores é reconstituível a partir do estado atual da tarefa.
 */
export const taskEvents = pgTable(
  "task_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    fromStatus: taskStatusEnum("from_status"),
    toStatus: taskStatusEnum("to_status").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => people.id),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("task_events_task_idx").on(t.taskId, t.at)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => people.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "comments_must_have_exactly_one_target",
      sql`num_nonnulls(${t.taskId}, ${t.projectId}) = 1`,
    ),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => people.id),
    entity: text("entity").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),
    payload: jsonb("payload"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId, t.at)],
);

/* ------------------------------------------------------------------ *
 * Relations
 * ------------------------------------------------------------------ */

export const peopleRelations = relations(people, ({ many }) => ({
  ownedProjects: many(projects),
  tasks: many(tasks),
  absences: many(absences),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  owner: one(people, { fields: [portfolios.ownerId], references: [people.id] }),
  projects: many(projects),
  initiatives: many(initiatives),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  portfolio: one(portfolios, {
    fields: [projects.portfolioId],
    references: [portfolios.id],
  }),
  owner: one(people, { fields: [projects.ownerId], references: [people.id] }),
  milestones: many(milestones),
  tasks: many(tasks),
  statusUpdates: many(statusUpdates),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, { fields: [milestones.projectId], references: [projects.id] }),
}));

export const initiativesRelations = relations(initiatives, ({ one, many }) => ({
  portfolio: one(portfolios, {
    fields: [initiatives.portfolioId],
    references: [portfolios.id],
  }),
  owner: one(people, { fields: [initiatives.ownerId], references: [people.id] }),
  checkins: many(initiativeCheckins),
  tasks: many(tasks),
}));

export const initiativeCheckinsRelations = relations(initiativeCheckins, ({ one }) => ({
  initiative: one(initiatives, {
    fields: [initiativeCheckins.initiativeId],
    references: [initiatives.id],
  }),
  author: one(people, {
    fields: [initiativeCheckins.authorId],
    references: [people.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  initiative: one(initiatives, {
    fields: [tasks.initiativeId],
    references: [initiatives.id],
  }),
  assignee: one(people, { fields: [tasks.assigneeId], references: [people.id] }),
  events: many(taskEvents),
  comments: many(comments),
}));

export const taskEventsRelations = relations(taskEvents, ({ one }) => ({
  task: one(tasks, { fields: [taskEvents.taskId], references: [tasks.id] }),
}));

export const statusUpdatesRelations = relations(statusUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [statusUpdates.projectId],
    references: [projects.id],
  }),
  author: one(people, { fields: [statusUpdates.authorId], references: [people.id] }),
}));

/* ------------------------------------------------------------------ *
 * Tipos
 * ------------------------------------------------------------------ */

export type Person = typeof people.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Initiative = typeof initiatives.$inferSelect;
export type InitiativeCheckin = typeof initiativeCheckins.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskEvent = typeof taskEvents.$inferSelect;
export type StatusUpdate = typeof statusUpdates.$inferSelect;

export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type InitiativeStatus = (typeof initiativeStatusEnum.enumValues)[number];
export type Health = (typeof healthEnum.enumValues)[number];
export type Profile = (typeof profileEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type Cadence = (typeof cadenceEnum.enumValues)[number];
