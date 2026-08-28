/**
 * Leituras do catálogo público (`/cursos` e `/cursos/[slug]`).
 *
 * Drizzle roda com o papel do pooler, então RLS NÃO é aplicado aqui — a
 * regra de visibilidade da policy `courses_read_published` é reproduzida em
 * `publishedAndPublic()` e precisa continuar espelhando `db/rls.sql`.
 *
 * Sobre a ementa: a policy `lessons_read` só libera a linha da aula para
 * quem está matriculado (ou para aulas de preview). A página pública mostra
 * apenas título/duração/tipo das aulas — nunca `content_ref`, que é onde
 * mora o conteúdo de fato. Ver `getCourseCurriculum`.
 */
import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, courses, lessons, modules, profiles } from "@/db/schema";
import { ptBR } from "@/lib/i18n/text";

export type CourseLevel = "intro" | "intermediate" | "advanced";

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  intro: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

/**
 * Cada categoria carrega o sotaque visual de um produto Invent. Categoria
 * sem produto correspondente cai no cinza institucional.
 */
const CATEGORY_ACCENT: Record<string, string> = {
  fiscal: "bg-product-tax",
  financeiro: "bg-product-bank",
  contratos: "bg-product-contract",
  sap: "bg-invent-ink",
};

const CATEGORY_GRADIENT: Record<string, string> = {
  fiscal: "from-product-tax to-invent-black",
  financeiro: "from-product-bank to-invent-black",
  contratos: "from-product-contract to-invent-black",
  sap: "from-invent-gray-700 to-invent-black",
};

export function accentForCategory(slug: string | null): string {
  return (slug && CATEGORY_ACCENT[slug]) || "bg-invent-gray-700";
}

export function gradientForCategory(slug: string | null): string {
  return (slug && CATEGORY_GRADIENT[slug]) || "from-invent-gray-700 to-invent-black";
}

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  categorySlug: string | null;
  categoryName: string | null;
  estimatedMinutes: number | null;
  lessonCount: number;
  publishedAt: Date | null;
};

export type CatalogFilters = {
  category?: string;
  level?: CourseLevel;
  q?: string;
};

/** Espelha `courses_read_published` em `db/rls.sql` para o visitante anônimo. */
function publishedAndPublic() {
  return and(eq(courses.status, "published"), eq(courses.visibility, "public"));
}

export type CatalogCategory = {
  slug: string;
  name: string;
  courseCount: number;
};

export async function listCatalogCategories(): Promise<CatalogCategory[]> {
  const rows = await db
    .select({
      slug: categories.slug,
      nameI18n: categories.nameI18n,
      order: categories.order,
      courseCount: count(courses.id),
    })
    .from(categories)
    .leftJoin(courses, and(eq(courses.categoryId, categories.id), publishedAndPublic()))
    .groupBy(categories.id, categories.slug, categories.nameI18n, categories.order)
    .orderBy(asc(categories.order));

  return rows.map((r) => ({
    slug: r.slug,
    name: ptBR(r.nameI18n, r.slug),
    courseCount: Number(r.courseCount),
  }));
}

export async function listPublishedCourses(
  filters: CatalogFilters = {},
): Promise<CatalogCourse[]> {
  const conditions = [publishedAndPublic()];

  if (filters.category) {
    conditions.push(eq(categories.slug, filters.category));
  }
  if (filters.level) {
    conditions.push(eq(courses.level, filters.level));
  }
  if (filters.q) {
    const term = `%${filters.q}%`;
    const match = or(
      ilike(sql`${courses.titleI18n} ->> 'pt-BR'`, term),
      ilike(sql`${courses.summaryI18n} ->> 'pt-BR'`, term),
    );
    if (match) conditions.push(match);
  }

  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      titleI18n: courses.titleI18n,
      summaryI18n: courses.summaryI18n,
      level: courses.level,
      estimatedMinutes: courses.estimatedMinutes,
      publishedAt: courses.publishedAt,
      categorySlug: categories.slug,
      categoryNameI18n: categories.nameI18n,
    })
    .from(courses)
    .leftJoin(categories, eq(categories.id, courses.categoryId))
    .where(and(...conditions))
    .orderBy(desc(courses.publishedAt));

  const lessonCounts = await countLessonsByCourse(rows.map((r) => r.id));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: ptBR(r.titleI18n, "(sem título)"),
    summary: ptBR(r.summaryI18n),
    level: r.level,
    categorySlug: r.categorySlug,
    categoryName: r.categoryNameI18n ? ptBR(r.categoryNameI18n, "") : null,
    estimatedMinutes: r.estimatedMinutes,
    lessonCount: lessonCounts.get(r.id) ?? 0,
    publishedAt: r.publishedAt,
  }));
}

async function countLessonsByCourse(
  courseIds: string[],
): Promise<Map<string, number>> {
  if (courseIds.length === 0) return new Map();
  const rows = await db
    .select({ courseId: modules.courseId, total: count(lessons.id) })
    .from(modules)
    .leftJoin(lessons, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .groupBy(modules.courseId);
  return new Map(rows.map((r) => [r.courseId, Number(r.total)]));
}

export type CurriculumLesson = {
  id: string;
  title: string;
  type: "video" | "text" | "quiz" | "assignment" | "live";
  durationSeconds: number | null;
  isPreview: boolean;
  order: number;
};

export type CurriculumModule = {
  id: string;
  title: string;
  summary: string;
  order: number;
  lessons: CurriculumLesson[];
};

export type PublicCourse = CatalogCourse & {
  description: string;
  instructorName: string | null;
  modules: CurriculumModule[];
  totalLessonSeconds: number;
};

/**
 * Ementa do curso: metadados das aulas, sem `content_ref`. O conteúdo em si
 * só é resolvido em `lib/learn/queries.ts`, depois de checar matrícula.
 */
export async function getCourseCurriculum(
  courseId: string,
): Promise<CurriculumModule[]> {
  const mods = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order));
  if (mods.length === 0) return [];

  const lessonRows = await db
    .select({
      id: lessons.id,
      moduleId: lessons.moduleId,
      titleI18n: lessons.titleI18n,
      type: lessons.type,
      durationSeconds: lessons.durationSeconds,
      isPreview: lessons.isPreview,
      order: lessons.order,
    })
    .from(lessons)
    .where(
      inArray(
        lessons.moduleId,
        mods.map((m) => m.id),
      ),
    )
    .orderBy(asc(lessons.order));

  return mods.map((m) => ({
    id: m.id,
    title: ptBR(m.titleI18n, "(sem título)"),
    summary: ptBR(m.summaryI18n),
    order: m.order,
    lessons: lessonRows
      .filter((l) => l.moduleId === m.id)
      .map((l) => ({
        id: l.id,
        title: ptBR(l.titleI18n, "(sem título)"),
        type: l.type,
        durationSeconds: l.durationSeconds,
        isPreview: l.isPreview,
        order: l.order,
      })),
  }));
}

export async function getPublicCourseBySlug(
  slug: string,
): Promise<PublicCourse | null> {
  const [row] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      titleI18n: courses.titleI18n,
      summaryI18n: courses.summaryI18n,
      descriptionI18n: courses.descriptionI18n,
      level: courses.level,
      estimatedMinutes: courses.estimatedMinutes,
      publishedAt: courses.publishedAt,
      categorySlug: categories.slug,
      categoryNameI18n: categories.nameI18n,
      instructorName: profiles.fullName,
    })
    .from(courses)
    .leftJoin(categories, eq(categories.id, courses.categoryId))
    .leftJoin(profiles, eq(profiles.id, courses.instructorOwnerId))
    .where(and(eq(courses.slug, slug), publishedAndPublic()))
    .limit(1);

  if (!row) return null;

  const curriculum = await getCourseCurriculum(row.id);
  const allLessons = curriculum.flatMap((m) => m.lessons);

  return {
    id: row.id,
    slug: row.slug,
    title: ptBR(row.titleI18n, "(sem título)"),
    summary: ptBR(row.summaryI18n),
    description: ptBR(row.descriptionI18n),
    level: row.level,
    categorySlug: row.categorySlug,
    categoryName: row.categoryNameI18n ? ptBR(row.categoryNameI18n, "") : null,
    estimatedMinutes: row.estimatedMinutes,
    lessonCount: allLessons.length,
    publishedAt: row.publishedAt,
    instructorName: row.instructorName,
    modules: curriculum,
    totalLessonSeconds: allLessons.reduce(
      (acc, l) => acc + (l.durationSeconds ?? 0),
      0,
    ),
  };
}
