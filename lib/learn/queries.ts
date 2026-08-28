/**
 * Leituras da área do aluno (`/aprender`).
 *
 * Como em `lib/catalog/queries.ts`, o Drizzle não passa por RLS: a
 * autorização é feita aqui, sempre partindo do `profileId` da sessão. Toda
 * função que devolve conteúdo de aula exige matrícula ativa — o equivalente
 * em código da policy `lessons_read` em `db/rls.sql`.
 */
import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  categories,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  modules,
  videoAssets,
} from "@/db/schema";
import { getPlaybackUrl } from "@/lib/bunny/client";
import { ptBR } from "@/lib/i18n/text";
import {
  ACCESSIBLE_ENROLLMENT_STATUSES,
  computeProgressPct,
} from "@/lib/learn/progress";
import type { CourseLevel } from "@/lib/catalog/queries";

export type LessonType = "video" | "text" | "quiz" | "assignment" | "live";
export type ProgressStatus = "not_started" | "in_progress" | "completed";


export type EnrolledCourse = {
  enrollmentId: string;
  courseId: string;
  courseSlug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  categorySlug: string | null;
  progressPct: number;
  lessonCount: number;
  completedLessons: number;
  lastEventAt: Date | null;
  /** Aula para retomar: a primeira não concluída, na ordem do curso. */
  nextLessonId: string | null;
  nextLessonTitle: string | null;
};

export async function listEnrolledCourses(
  profileId: string,
): Promise<EnrolledCourse[]> {
  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      progressPct: enrollments.progressPct,
      courseId: courses.id,
      courseSlug: courses.slug,
      titleI18n: courses.titleI18n,
      summaryI18n: courses.summaryI18n,
      level: courses.level,
      categorySlug: categories.slug,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(categories, eq(categories.id, courses.categoryId))
    .where(
      and(
        eq(enrollments.profileId, profileId),
        inArray(enrollments.status, [...ACCESSIBLE_ENROLLMENT_STATUSES]),
      ),
    )
    .orderBy(desc(enrollments.enrolledAt));

  if (rows.length === 0) return [];

  const courseIds = rows.map((r) => r.courseId);
  const enrollmentIds = rows.map((r) => r.enrollmentId);

  const lessonRows = await db
    .select({
      lessonId: lessons.id,
      courseId: modules.courseId,
      titleI18n: lessons.titleI18n,
      moduleOrder: modules.order,
      lessonOrder: lessons.order,
    })
    .from(modules)
    .innerJoin(lessons, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .orderBy(asc(modules.order), asc(lessons.order));

  const progressRows = await db
    .select({
      enrollmentId: lessonProgress.enrollmentId,
      lessonId: lessonProgress.lessonId,
      status: lessonProgress.status,
      lastEventAt: lessonProgress.lastEventAt,
    })
    .from(lessonProgress)
    .where(inArray(lessonProgress.enrollmentId, enrollmentIds));

  return rows.map((r) => {
    const courseLessons = lessonRows.filter((l) => l.courseId === r.courseId);
    const progressByLesson = new Map(
      progressRows
        .filter((p) => p.enrollmentId === r.enrollmentId)
        .map((p) => [p.lessonId, p]),
    );

    const completedLessons = courseLessons.filter(
      (l) => progressByLesson.get(l.lessonId)?.status === "completed",
    ).length;

    const next = courseLessons.find(
      (l) => progressByLesson.get(l.lessonId)?.status !== "completed",
    );

    const lastEventAt = [...progressByLesson.values()]
      .map((p) => p.lastEventAt)
      .filter((d): d is Date => d instanceof Date)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      enrollmentId: r.enrollmentId,
      courseId: r.courseId,
      courseSlug: r.courseSlug,
      title: ptBR(r.titleI18n, "(sem título)"),
      summary: ptBR(r.summaryI18n),
      level: r.level,
      categorySlug: r.categorySlug,
      progressPct: computeProgressPct(completedLessons, courseLessons.length),
      lessonCount: courseLessons.length,
      completedLessons,
      lastEventAt: lastEventAt ?? null,
      nextLessonId: next?.lessonId ?? courseLessons[0]?.lessonId ?? null,
      nextLessonTitle: next ? ptBR(next.titleI18n, "(sem título)") : null,
    };
  });
}

export type EnrollmentRef = { id: string; courseId: string };

export async function findEnrollment(
  courseId: string,
  profileId: string,
): Promise<EnrollmentRef | null> {
  const [row] = await db
    .select({ id: enrollments.id, courseId: enrollments.courseId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.profileId, profileId),
        inArray(enrollments.status, [...ACCESSIBLE_ENROLLMENT_STATUSES]),
      ),
    )
    .limit(1);
  return row ?? null;
}

export type PlayerLesson = {
  id: string;
  title: string;
  type: LessonType;
  durationSeconds: number | null;
  order: number;
  moduleId: string;
  status: ProgressStatus;
  watchPositionSeconds: number;
};

export type PlayerModule = {
  id: string;
  title: string;
  order: number;
  lessons: PlayerLesson[];
};

export type PlayerData = {
  enrollmentId: string;
  course: {
    id: string;
    slug: string;
    title: string;
    categorySlug: string | null;
  };
  lesson: PlayerLesson & {
    /** Só presente em aulas de texto. */
    markdown: string | null;
    /** Só presente em aulas de vídeo com asset pronto. */
    video: {
      playbackUrl: string | null;
      status: "uploading" | "processing" | "ready" | "errored";
      durationSeconds: number | null;
    } | null;
  };
  modules: PlayerModule[];
  previousLessonId: string | null;
  nextLessonId: string | null;
  completedLessons: number;
  totalLessons: number;
};

/**
 * Monta a tela da aula. Retorna `null` quando o curso não existe, a aula não
 * pertence a ele, ou o usuário não tem matrícula ativa — a página trata os
 * três casos como "vá se matricular".
 */
export async function getPlayerData(
  courseSlug: string,
  lessonId: string,
  profileId: string,
): Promise<PlayerData | null> {
  const [course] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      titleI18n: courses.titleI18n,
      status: courses.status,
      categorySlug: categories.slug,
    })
    .from(courses)
    .leftJoin(categories, eq(categories.id, courses.categoryId))
    .where(eq(courses.slug, courseSlug))
    .limit(1);

  if (!course || course.status !== "published") return null;

  const enrollment = await findEnrollment(course.id, profileId);
  if (!enrollment) return null;

  const mods = await db
    .select({ id: modules.id, titleI18n: modules.titleI18n, order: modules.order })
    .from(modules)
    .where(eq(modules.courseId, course.id))
    .orderBy(asc(modules.order));
  if (mods.length === 0) return null;

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(
      inArray(
        lessons.moduleId,
        mods.map((m) => m.id),
      ),
    )
    .orderBy(asc(lessons.order));

  const current = lessonRows.find((l) => l.id === lessonId);
  if (!current) return null;

  const progressRows = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.enrollmentId, enrollment.id));
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  const moduleOrder = new Map(mods.map((m) => [m.id, m.order]));
  const ordered = [...lessonRows].sort((a, b) => {
    const ma = moduleOrder.get(a.moduleId) ?? 0;
    const mb = moduleOrder.get(b.moduleId) ?? 0;
    return ma === mb ? a.order - b.order : ma - mb;
  });

  const toPlayerLesson = (row: (typeof lessonRows)[number]): PlayerLesson => {
    const progress = progressByLesson.get(row.id);
    return {
      id: row.id,
      title: ptBR(row.titleI18n, "(sem título)"),
      type: row.type,
      durationSeconds: row.durationSeconds,
      order: row.order,
      moduleId: row.moduleId,
      status: progress?.status ?? "not_started",
      watchPositionSeconds: progress?.watchPositionSeconds ?? 0,
    };
  };

  const index = ordered.findIndex((l) => l.id === current.id);
  const contentRef = (current.contentRef as Record<string, unknown> | null) ?? {};

  return {
    enrollmentId: enrollment.id,
    course: {
      id: course.id,
      slug: course.slug,
      title: ptBR(course.titleI18n, "(sem título)"),
      categorySlug: course.categorySlug,
    },
    lesson: {
      ...toPlayerLesson(current),
      markdown: typeof contentRef.mdx === "string" ? contentRef.mdx : null,
      video: await resolveVideo(contentRef),
    },
    modules: mods.map((m) => ({
      id: m.id,
      title: ptBR(m.titleI18n, "(sem título)"),
      order: m.order,
      lessons: ordered.filter((l) => l.moduleId === m.id).map(toPlayerLesson),
    })),
    previousLessonId: index > 0 ? (ordered[index - 1]?.id ?? null) : null,
    nextLessonId: index >= 0 ? (ordered[index + 1]?.id ?? null) : null,
    completedLessons: ordered.filter(
      (l) => progressByLesson.get(l.id)?.status === "completed",
    ).length,
    totalLessons: ordered.length,
  };
}

async function resolveVideo(
  contentRef: Record<string, unknown>,
): Promise<PlayerData["lesson"]["video"]> {
  const videoAssetId =
    typeof contentRef.videoAssetId === "string" ? contentRef.videoAssetId : null;
  if (!videoAssetId) return null;

  const [asset] = await db
    .select({
      providerAssetId: videoAssets.providerAssetId,
      status: videoAssets.status,
      durationSeconds: videoAssets.durationSeconds,
    })
    .from(videoAssets)
    .where(eq(videoAssets.id, videoAssetId))
    .limit(1);
  if (!asset) return null;

  return {
    // Sem env da Bunny (dev/preview) o player cai no estado "vídeo
    // indisponível" em vez de derrubar a página inteira.
    playbackUrl:
      asset.status === "ready" ? safePlaybackUrl(asset.providerAssetId) : null,
    status: asset.status,
    durationSeconds: asset.durationSeconds,
  };
}

function safePlaybackUrl(providerAssetId: string): string | null {
  try {
    return getPlaybackUrl(providerAssetId);
  } catch {
    return null;
  }
}
