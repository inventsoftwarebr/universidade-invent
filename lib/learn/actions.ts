"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { courses, enrollments, lessons, modules } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-role";
import { MAX_WATCHED_DELTA } from "@/lib/learn/constants";
import { ACCESSIBLE_ENROLLMENT_STATUSES } from "@/lib/learn/progress";
import {
  recalculateEnrollmentProgress,
  writeLessonProgress,
} from "@/lib/learn/progress-store";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

const enrollSchema = z.object({
  courseId: z.string().uuid(),
});

/**
 * Auto-matrícula em curso publicado e público. Cursos com outra
 * `visibility` exigem convite/atribuição — fora do escopo do MVP.
 */
export async function enrollInCourse(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = enrollSchema.safeParse({ courseId: formData.get("courseId") });
  if (!parsed.success) throw new Error("invalid_input");

  const [course] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      status: courses.status,
      visibility: courses.visibility,
    })
    .from(courses)
    .where(eq(courses.id, parsed.data.courseId))
    .limit(1);

  if (!course || course.status !== "published" || course.visibility !== "public") {
    throw new Error("course_not_enrollable");
  }

  await db
    .insert(enrollments)
    .values({
      courseId: course.id,
      profileId: user.id,
      source: "self",
      status: "active",
    })
    .onConflictDoNothing();

  const firstLessonId = await findFirstLessonId(course.id);

  revalidatePath("/aprender");
  revalidatePath(`/cursos/${course.slug}`);
  redirect(
    firstLessonId
      ? `/aprender/${course.slug}/${firstLessonId}`
      : `/cursos/${course.slug}`,
  );
}

async function findFirstLessonId(courseId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: lessons.id })
    .from(modules)
    .innerJoin(lessons, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order), asc(lessons.order))
    .limit(1);
  return row?.id ?? null;
}

const progressSchema = z.object({
  enrollmentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  positionSeconds: z.number().int().min(0).max(24 * 60 * 60),
  watchedDeltaSeconds: z.number().int().min(0).max(MAX_WATCHED_DELTA),
  event: z.enum(["play", "pause", "seek", "heartbeat", "complete"]),
});

export type ProgressInput = z.input<typeof progressSchema>;

/**
 * Persiste posição de leitura + tempo assistido. Chamada pelo player a cada
 * `HEARTBEAT_SECONDS` e nos eventos de play/pause/seek/complete.
 */
export async function saveLessonProgress(
  input: ProgressInput,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const { enrollmentId, lessonId, positionSeconds, watchedDeltaSeconds, event } =
    parsed.data;

  const enrollment = await assertEnrollmentOwnership(enrollmentId, user.id);
  if (!enrollment) return { ok: false, error: "forbidden" };

  const belongs = await lessonBelongsToCourse(lessonId, enrollment.courseId);
  if (!belongs) return { ok: false, error: "lesson_not_in_course" };

  await writeLessonProgress({
    enrollmentId,
    lessonId,
    positionSeconds,
    watchedDeltaSeconds,
    event,
  });

  if (event === "complete") {
    await recalculateEnrollmentProgress(enrollmentId, enrollment.courseId);
    revalidatePath("/aprender");
  }

  return { ok: true };
}

const completeSchema = z.object({
  enrollmentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  positionSeconds: z.number().int().min(0).max(24 * 60 * 60).default(0),
});

/** Marca a aula como concluída (botão explícito ou fim do vídeo). */
export async function completeLesson(
  input: z.input<typeof completeSchema>,
): Promise<ActionResult> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  return saveLessonProgress({
    ...parsed.data,
    watchedDeltaSeconds: 0,
    event: "complete",
  });
}

async function assertEnrollmentOwnership(
  enrollmentId: string,
  profileId: string,
): Promise<{ courseId: string } | null> {
  const [row] = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.id, enrollmentId),
        eq(enrollments.profileId, profileId),
        inArray(enrollments.status, [...ACCESSIBLE_ENROLLMENT_STATUSES]),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function lessonBelongsToCourse(
  lessonId: string,
  courseId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(and(eq(lessons.id, lessonId), eq(modules.courseId, courseId)))
    .limit(1);
  return Boolean(row);
}
