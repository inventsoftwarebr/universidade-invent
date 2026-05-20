/**
 * Leituras lado-servidor para o editor de cursos do instrutor.
 *
 * Usa Drizzle direto (bypass RLS via Supavisor) — autorização é feita
 * antes pela camada `requireRole + assertCourseOwner` em actions.ts.
 */
import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  categories,
  courses,
  lessons,
  modules,
  videoAssets,
} from "@/db/schema";

export type InstructorCourseRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  level: "intro" | "intermediate" | "advanced";
  estimatedMinutes: number | null;
  updatedAt: Date;
  publishedAt: Date | null;
  moduleCount: number;
  lessonCount: number;
};

function ptBR(json: unknown, fallback = ""): string {
  if (!json || typeof json !== "object") return fallback;
  const obj = json as Record<string, string>;
  return obj["pt-BR"] ?? obj.en ?? Object.values(obj)[0] ?? fallback;
}

export async function listInstructorCourses(
  instructorId: string,
  isAdmin: boolean,
): Promise<InstructorCourseRow[]> {
  const rows = await db
    .select()
    .from(courses)
    .where(isAdmin ? undefined : eq(courses.instructorOwnerId, instructorId))
    .orderBy(desc(courses.updatedAt));

  if (rows.length === 0) return [];

  const courseIds = rows.map((r) => r.id);
  const mods = await db
    .select({ id: modules.id, courseId: modules.courseId })
    .from(modules)
    .where(inArray(modules.courseId, courseIds));
  const moduleIds = mods.map((m) => m.id);

  const lessonRows = moduleIds.length
    ? await db
        .select({ moduleId: lessons.moduleId })
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds))
    : [];

  const lessonsByModule = new Map<string, number>();
  for (const l of lessonRows) {
    lessonsByModule.set(l.moduleId, (lessonsByModule.get(l.moduleId) ?? 0) + 1);
  }
  const modulesByCourse = new Map<string, number>();
  const lessonsByCourse = new Map<string, number>();
  for (const m of mods) {
    modulesByCourse.set(m.courseId, (modulesByCourse.get(m.courseId) ?? 0) + 1);
    lessonsByCourse.set(
      m.courseId,
      (lessonsByCourse.get(m.courseId) ?? 0) + (lessonsByModule.get(m.id) ?? 0),
    );
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: ptBR(r.titleI18n, "(sem título)"),
    status: r.status,
    level: r.level,
    estimatedMinutes: r.estimatedMinutes,
    updatedAt: r.updatedAt,
    publishedAt: r.publishedAt,
    moduleCount: modulesByCourse.get(r.id) ?? 0,
    lessonCount: lessonsByCourse.get(r.id) ?? 0,
  }));
}

export type EditorLesson = {
  id: string;
  moduleId: string;
  order: number;
  type: "video" | "text" | "quiz" | "assignment" | "live";
  title: string;
  durationSeconds: number | null;
  isPreview: boolean;
  passingRequired: boolean;
  contentRef: Record<string, unknown>;
  video: {
    id: string;
    providerAssetId: string;
    status: "uploading" | "processing" | "ready" | "errored";
  } | null;
};

export type EditorModule = {
  id: string;
  order: number;
  title: string;
  summary: string;
  lessons: EditorLesson[];
};

export type EditorCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "enrolled_only" | "company_only" | "invite_only";
  level: "intro" | "intermediate" | "advanced";
  categoryId: string | null;
  estimatedMinutes: number | null;
  publishedAt: Date | null;
  instructorOwnerId: string | null;
  modules: EditorModule[];
};

export async function getInstructorCourseBySlug(
  slug: string,
): Promise<EditorCourse | null> {
  const [c] = await db.select().from(courses).where(eq(courses.slug, slug));
  if (!c) return null;

  const mods = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, c.id))
    .orderBy(asc(modules.order));

  const moduleIds = mods.map((m) => m.id);
  const lessonRows = moduleIds.length
    ? await db
        .select()
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds))
        .orderBy(asc(lessons.order))
    : [];

  // Resolver video assets referenciados nas aulas
  const videoIds = lessonRows
    .map((l) => {
      const ref = (l.contentRef as Record<string, unknown> | null) ?? {};
      const v = ref?.videoAssetId;
      return typeof v === "string" ? v : null;
    })
    .filter((v): v is string => v !== null);

  const videos = videoIds.length
    ? await db
        .select({
          id: videoAssets.id,
          providerAssetId: videoAssets.providerAssetId,
          status: videoAssets.status,
        })
        .from(videoAssets)
        .where(inArray(videoAssets.id, videoIds))
    : [];
  const videosById = new Map(videos.map((v) => [v.id, v]));

  return {
    id: c.id,
    slug: c.slug,
    title: ptBR(c.titleI18n, "(sem título)"),
    summary: ptBR(c.summaryI18n),
    description: ptBR(c.descriptionI18n),
    status: c.status,
    visibility: c.visibility,
    level: c.level,
    categoryId: c.categoryId,
    estimatedMinutes: c.estimatedMinutes,
    publishedAt: c.publishedAt,
    instructorOwnerId: c.instructorOwnerId,
    modules: mods.map((m) => ({
      id: m.id,
      order: m.order,
      title: ptBR(m.titleI18n),
      summary: ptBR(m.summaryI18n),
      lessons: lessonRows
        .filter((l) => l.moduleId === m.id)
        .map((l) => {
          const ref = (l.contentRef as Record<string, unknown> | null) ?? {};
          const videoId =
            typeof ref?.videoAssetId === "string" ? ref.videoAssetId : null;
          const v = videoId ? (videosById.get(videoId) ?? null) : null;
          return {
            id: l.id,
            moduleId: l.moduleId,
            order: l.order,
            type: l.type,
            title: ptBR(l.titleI18n),
            durationSeconds: l.durationSeconds,
            isPreview: l.isPreview,
            passingRequired: l.passingRequired,
            contentRef: ref,
            video: v ?? null,
          };
        }),
    })),
  };
}

export async function listCategories(): Promise<
  { id: string; slug: string; name: string }[]
> {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.order));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: ptBR(r.nameI18n, r.slug),
  }));
}

/**
 * Carrega curso somente se o usuário é dono OU admin.
 * Lança erro se não autorizado.
 */
export async function assertCourseOwnership(
  courseId: string,
  userId: string,
  role: "admin" | "instrutor" | "aluno",
): Promise<void> {
  if (role === "admin") return;
  const [c] = await db
    .select({ owner: courses.instructorOwnerId })
    .from(courses)
    .where(eq(courses.id, courseId));
  if (!c || c.owner !== userId) {
    throw new Error("forbidden");
  }
}

/** Mesmo check, mas a partir de um lessonId (joinable). */
export async function assertLessonOwnership(
  lessonId: string,
  userId: string,
  role: "admin" | "instrutor" | "aluno",
): Promise<{ courseId: string; moduleId: string }> {
  const [row] = await db
    .select({
      courseId: modules.courseId,
      moduleId: lessons.moduleId,
      owner: courses.instructorOwnerId,
    })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(lessons.id, lessonId));
  if (!row) throw new Error("not_found");
  if (role !== "admin" && row.owner !== userId) {
    throw new Error("forbidden");
  }
  return { courseId: row.courseId, moduleId: row.moduleId };
}

export async function assertModuleOwnership(
  moduleId: string,
  userId: string,
  role: "admin" | "instrutor" | "aluno",
): Promise<{ courseId: string }> {
  const [row] = await db
    .select({
      courseId: modules.courseId,
      owner: courses.instructorOwnerId,
    })
    .from(modules)
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(modules.id, moduleId));
  if (!row) throw new Error("not_found");
  if (role !== "admin" && row.owner !== userId) {
    throw new Error("forbidden");
  }
  return { courseId: row.courseId };
}

/** Helper: próximo `order` disponível em uma coleção (course/module). */
export async function nextModuleOrder(courseId: string): Promise<number> {
  const [last] = await db
    .select({ order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(desc(modules.order))
    .limit(1);
  return (last?.order ?? 0) + 1;
}

export async function nextLessonOrder(moduleId: string): Promise<number> {
  const [last] = await db
    .select({ order: lessons.order })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId))
    .orderBy(desc(lessons.order))
    .limit(1);
  return (last?.order ?? 0) + 1;
}

/** Slugify simples — para gerar slug de curso a partir do título. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Garante que o slug é único — adiciona sufixo numérico se conflito. */
export async function uniqueCourseSlug(base: string): Promise<string> {
  const slug = slugify(base) || "curso";
  let candidate = slug;
  let counter = 2;
  while (true) {
    const [conflict] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, candidate))
      .limit(1);
    if (!conflict) return candidate;
    candidate = `${slug}-${counter++}`;
    if (counter > 50) throw new Error("could_not_generate_slug");
  }
}

export { ptBR };
