/**
 * Schema Drizzle — single source of truth do banco da Universidade Invent.
 *
 * Convenções:
 * - Todas as tabelas têm id uuid + createdAt + updatedAt.
 * - RLS habilitado em TODAS as tabelas. Políticas em db/rls.sql.
 * - Strings de UI são JSONB i18n (chave por locale) — pt-BR no MVP, en/es depois.
 * - Soft delete não é usado por default; usamos status enums (draft/archived).
 *
 * Ver CLAUDE.md para regras de RLS, conexão e idempotência.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// =============================================================================
// Enums
// =============================================================================

export const userRoleEnum = pgEnum("user_role", ["admin", "instrutor", "aluno"]);
export const alunoSubtypeEnum = pgEnum("aluno_subtype", [
  "cliente",
  "parceiro",
  "lead",
]);
export const personaEnum = pgEnum("persona", ["decisor", "influenciador"]);
export const companyTierEnum = pgEnum("company_tier", [
  "cliente",
  "parceiro",
  "prospect",
]);
export const sapProductEnum = pgEnum("sap_product", [
  "B1",
  "S4HC",
  "both",
  "none",
]);

export const courseStatusEnum = pgEnum("course_status", [
  "draft",
  "published",
  "archived",
]);
export const courseVisibilityEnum = pgEnum("course_visibility", [
  "public",
  "enrolled_only",
  "company_only",
  "invite_only",
]);
export const courseLevelEnum = pgEnum("course_level", [
  "intro",
  "intermediate",
  "advanced",
]);

export const lessonTypeEnum = pgEnum("lesson_type", [
  "video",
  "text",
  "quiz",
  "assignment",
  "live",
]);

export const videoProviderEnum = pgEnum("video_provider", ["bunny", "mux"]);
export const videoStatusEnum = pgEnum("video_status", [
  "uploading",
  "processing",
  "ready",
  "errored",
]);

export const enrollmentSourceEnum = pgEnum("enrollment_source", [
  "self",
  "admin",
  "company_bulk",
  "lead_magnet",
]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "expired",
  "cancelled",
]);
export const lessonProgressStatusEnum = pgEnum("lesson_progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);

// =============================================================================
// Identity
// =============================================================================

/**
 * profiles estende auth.users (1:1 via id). Criação é feita pela trigger
 * handle_new_user() em db/rls.sql — não inserir manualmente em código.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // FK lógica para auth.users(id)
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("aluno"),
  alunoSubtype: alunoSubtypeEnum("aluno_subtype"),
  persona: personaEnum("persona"),
  jobTitle: text("job_title"),
  phoneE164: varchar("phone_e164", { length: 20 }),
  whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(false),
  locale: varchar("locale", { length: 8 }).notNull().default("pt-BR"),
  hubspotContactId: text("hubspot_contact_id"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    cnpj: varchar("cnpj", { length: 14 }),
    sapProduct: sapProductEnum("sap_product").notNull().default("none"),
    tier: companyTierEnum("tier").notNull().default("prospect"),
    hubspotCompanyId: text("hubspot_company_id"),
    accountOwnerId: uuid("account_owner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    cnpjUnique: unique("companies_cnpj_unique").on(t.cnpj),
  }),
);

export const profileCompanies = pgTable(
  "profile_companies",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    relationship: text("relationship").notNull().default("employee"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.profileId, t.companyId] }),
  }),
);

// =============================================================================
// Catalog
// =============================================================================

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nameI18n: jsonb("name_i18n").notNull(), // { "pt-BR": "SAP" }
  parentId: uuid("parent_id"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nameI18n: jsonb("name_i18n").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    titleI18n: jsonb("title_i18n").notNull(),
    summaryI18n: jsonb("summary_i18n"),
    descriptionI18n: jsonb("description_i18n"), // markdown
    coverUrl: text("cover_url"),
    trailerVideoId: uuid("trailer_video_id"),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    level: courseLevelEnum("level").notNull().default("intro"),
    status: courseStatusEnum("status").notNull().default("draft"),
    visibility: courseVisibilityEnum("visibility").notNull().default("public"),
    targetPersonas: text("target_personas").array(),
    sapModule: text("sap_module").array(),
    instructorOwnerId: uuid("instructor_owner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    language: varchar("language", { length: 8 }).notNull().default("pt-BR"),
    estimatedMinutes: integer("estimated_minutes"),
    priceCents: integer("price_cents").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusVisibilityCategoryIdx: index("courses_status_visibility_category_idx").on(
      t.status,
      t.visibility,
      t.categoryId,
    ),
  }),
);

export const courseTags = pgTable(
  "course_tags",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.courseId, t.tagId] }),
  }),
);

export const courseInstructors = pgTable(
  "course_instructors",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("lead"), // 'lead' | 'co'
  },
  (t) => ({
    pk: primaryKey({ columns: [t.courseId, t.profileId] }),
  }),
);

export const modules = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    titleI18n: jsonb("title_i18n").notNull(),
    summaryI18n: jsonb("summary_i18n"),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    courseOrderUnique: unique("modules_course_order_unique").on(t.courseId, t.order),
  }),
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    titleI18n: jsonb("title_i18n").notNull(),
    order: integer("order").notNull(),
    type: lessonTypeEnum("type").notNull(),
    durationSeconds: integer("duration_seconds"),
    isPreview: boolean("is_preview").notNull().default(false),
    passingRequired: boolean("passing_required").notNull().default(false),
    /**
     * Polimórfico:
     *  - { kind:'video', videoAssetId }
     *  - { kind:'text', mdx }
     *  - { kind:'quiz', quizId }
     *  - { kind:'assignment', assignmentId }
     *  - { kind:'live', joinUrl, scheduledAt }
     */
    contentRef: jsonb("content_ref").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    moduleOrderUnique: unique("lessons_module_order_unique").on(t.moduleId, t.order),
  }),
);

// =============================================================================
// Video assets
// =============================================================================

export const videoAssets = pgTable(
  "video_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: videoProviderEnum("provider").notNull().default("bunny"),
    providerAssetId: text("provider_asset_id").notNull(),
    playbackId: text("playback_id"),
    durationSeconds: integer("duration_seconds"),
    aspectRatio: varchar("aspect_ratio", { length: 16 }),
    status: videoStatusEnum("status").notNull().default("uploading"),
    thumbnailUrl: text("thumbnail_url"),
    captionsUrl: text("captions_url"),
    transcriptText: text("transcript_text"),
    transcriptSegments: jsonb("transcript_segments"), // [{ start, end, text }]
    uploadedBy: uuid("uploaded_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerAssetUnique: unique("video_assets_provider_asset_unique").on(
      t.provider,
      t.providerAssetId,
    ),
  }),
);

// =============================================================================
// Enrollment & progress
// =============================================================================

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    source: enrollmentSourceEnum("source").notNull().default("self"),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    progressPct: integer("progress_pct").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    courseProfileUnique: unique("enrollments_course_profile_unique").on(
      t.courseId,
      t.profileId,
    ),
    profileStatusIdx: index("enrollments_profile_status_idx").on(t.profileId, t.status),
  }),
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    status: lessonProgressStatusEnum("status").notNull().default("not_started"),
    watchPositionSeconds: integer("watch_position_seconds").notNull().default(0),
    watchedSecondsTotal: integer("watched_seconds_total").notNull().default(0),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.enrollmentId, t.lessonId] }),
  }),
);

/**
 * Log append-only de eventos de aula. Particionado por mês (em rls.sql).
 * Fonte para ML, anti-fraude e analytics.
 */
export const lessonEvents = pgTable(
  "lesson_events",
  {
    id: uuid("id").defaultRandom().notNull(),
    enrollmentId: uuid("enrollment_id").notNull(),
    lessonId: uuid("lesson_id").notNull(),
    event: text("event").notNull(), // 'play'|'pause'|'seek'|'heartbeat'|'complete'|'quiz_submit'|'assignment_submit'
    payload: jsonb("payload"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id, t.at] }), // PK composta para partitioning por at
    enrollmentAtIdx: index("lesson_events_enrollment_at_idx").on(t.enrollmentId, t.at),
  }),
);
