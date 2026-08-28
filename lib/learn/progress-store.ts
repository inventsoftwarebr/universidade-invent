/**
 * Persistência de progresso de aula.
 *
 * Separado de `actions.ts` de propósito: a action cuida de autenticação e
 * validação Zod, este módulo só escreve. Assim a regra de escrita — que é
 * onde mora o risco de regressão (progresso que regride, contador que
 * infla) — pode ser exercitada contra um Postgres real sem sessão HTTP.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { enrollments, lessonEvents, lessonProgress, lessons, modules } from "@/db/schema";
import { computeProgressPct } from "@/lib/learn/progress";

export type ProgressEvent = "play" | "pause" | "seek" | "heartbeat" | "complete";

export type WriteProgressInput = {
  enrollmentId: string;
  lessonId: string;
  positionSeconds: number;
  watchedDeltaSeconds: number;
  event: ProgressEvent;
};

/**
 * Grava posição + tempo assistido e registra o evento no log append-only.
 *
 * Duas garantias que os testes cobrem:
 *  - `completed` nunca regride para `in_progress` num heartbeat atrasado;
 *  - `watched_seconds_total` acumula em vez de sobrescrever.
 */
export async function writeLessonProgress(
  input: WriteProgressInput,
): Promise<void> {
  const { enrollmentId, lessonId, positionSeconds, watchedDeltaSeconds, event } =
    input;
  const completing = event === "complete";
  const now = new Date();

  await db
    .insert(lessonProgress)
    .values({
      enrollmentId,
      lessonId,
      status: completing ? "completed" : "in_progress",
      watchPositionSeconds: positionSeconds,
      watchedSecondsTotal: watchedDeltaSeconds,
      lastEventAt: now,
      completedAt: completing ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
      set: {
        status: completing
          ? sql`'completed'::lesson_progress_status`
          : sql`case when ${lessonProgress.status} = 'completed' then 'completed'::lesson_progress_status else 'in_progress'::lesson_progress_status end`,
        watchPositionSeconds: positionSeconds,
        watchedSecondsTotal: sql`${lessonProgress.watchedSecondsTotal} + ${watchedDeltaSeconds}`,
        lastEventAt: now,
        // `now()` do Postgres, não um Date do JS: dentro de um template
        // `sql` o driver não consegue tipar o parâmetro e estoura na
        // serialização. Ver CLAUDE.md §8.
        completedAt: completing
          ? sql`coalesce(${lessonProgress.completedAt}, now())`
          : sql`${lessonProgress.completedAt}`,
        updatedAt: now,
      },
    });

  await db.insert(lessonEvents).values({
    enrollmentId,
    lessonId,
    event,
    payload: { positionSeconds, watchedDeltaSeconds },
  });
}

/**
 * `enrollments.progress_pct` é denormalizado para o dashboard não varrer
 * `lesson_progress` — recalculado a cada conclusão de aula.
 */
export async function recalculateEnrollmentProgress(
  enrollmentId: string,
  courseId: string,
): Promise<number> {
  const courseLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(eq(modules.courseId, courseId));

  if (courseLessons.length === 0) return 0;

  const completed = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.enrollmentId, enrollmentId),
        eq(lessonProgress.status, "completed"),
        inArray(
          lessonProgress.lessonId,
          courseLessons.map((l) => l.id),
        ),
      ),
    );

  const pct = computeProgressPct(completed.length, courseLessons.length);
  const finished = pct === 100;

  await db
    .update(enrollments)
    .set({
      progressPct: pct,
      status: finished ? "completed" : "active",
      completedAt: finished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(enrollments.id, enrollmentId));

  return pct;
}
