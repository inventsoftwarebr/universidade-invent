"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { courses, lessons, modules, videoAssets } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import {
  assertCourseOwnership,
  assertLessonOwnership,
  assertModuleOwnership,
  getCourseForPublishCheck,
  nextLessonOrder,
  nextModuleOrder,
  uniqueCourseSlug,
} from "@/lib/instructor/queries";
import {
  checkCourseForPublish,
  type PublishIssue,
} from "@/lib/instructor/publish-checks";
import { moveLesson, moveModule } from "@/lib/instructor/ordering";
import {
  createBunnyVideo,
  fetchBunnyVideo,
  getTusUploadHeaders,
} from "@/lib/bunny/client";

export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const courseCreateSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres.").max(160),
  summary: z.string().max(280).optional(),
  level: z.enum(["intro", "intermediate", "advanced"]).default("intro"),
  visibility: z
    .enum(["public", "enrolled_only", "company_only", "invite_only"])
    .default("enrolled_only"),
  categoryId: z.string().uuid().optional().nullable(),
  language: z.string().default("pt-BR"),
});

export async function createCourse(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);

  const parsed = courseCreateSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    level: (formData.get("level") || undefined) as string | undefined,
    visibility: (formData.get("visibility") || undefined) as string | undefined,
    categoryId: formData.get("categoryId") || undefined,
    language: formData.get("language") || "pt-BR",
  });
  if (!parsed.success) {
    // Server actions sem state — para feedback fino, usaria useActionState.
    throw new Error(parsed.error.issues[0]?.message ?? "invalid_input");
  }

  const slug = await uniqueCourseSlug(parsed.data.title);
  await db.insert(courses).values({
    slug,
    titleI18n: { "pt-BR": parsed.data.title },
    summaryI18n: parsed.data.summary
      ? { "pt-BR": parsed.data.summary }
      : null,
    level: parsed.data.level,
    visibility: parsed.data.visibility,
    categoryId: parsed.data.categoryId ?? null,
    instructorOwnerId: user.id,
    language: parsed.data.language,
    status: "draft",
  });

  revalidatePath("/instrutor");
  redirect(`/instrutor/cursos/${slug}`);
}

const courseUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(160),
  summary: z.string().max(280).optional(),
  description: z.string().max(8000).optional(),
  level: z.enum(["intro", "intermediate", "advanced"]),
  visibility: z.enum(["public", "enrolled_only", "company_only", "invite_only"]),
  categoryId: z.string().uuid().nullable().optional(),
  estimatedMinutes: z.coerce.number().int().min(0).max(10_000).optional(),
});

export async function updateCourse(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const parsed = courseUpdateSchema.parse({
    id: formData.get("id"),
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    description: formData.get("description") || undefined,
    level: formData.get("level"),
    visibility: formData.get("visibility"),
    categoryId: formData.get("categoryId") || null,
    estimatedMinutes: formData.get("estimatedMinutes") || undefined,
  });
  await assertCourseOwnership(parsed.id, user.id, user.role);
  await db
    .update(courses)
    .set({
      titleI18n: { "pt-BR": parsed.title },
      summaryI18n: parsed.summary ? { "pt-BR": parsed.summary } : null,
      descriptionI18n: parsed.description ? { "pt-BR": parsed.description } : null,
      level: parsed.level,
      visibility: parsed.visibility,
      categoryId: parsed.categoryId ?? null,
      estimatedMinutes: parsed.estimatedMinutes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, parsed.id));
  revalidatePath(`/instrutor/cursos`);
}

/**
 * Publica o curso — mas só se ele estiver publicável.
 *
 * Sem essa checagem dá para jogar no catálogo um curso sem aulas ou com
 * vídeo ainda em processamento, e o aluno encontra a página quebrada.
 */
export async function publishCourse(
  courseId: string,
): Promise<ActionResult<{ warnings: PublishIssue[] }>> {
  try {
    const user = await requireRole(["admin", "instrutor"]);
    await assertCourseOwnership(courseId, user.id, user.role);

    const course = await getCourseForPublishCheck(courseId);
    if (!course) return { ok: false, error: "not_found" };

    const { blockers, warnings } = checkCourseForPublish(course);
    if (blockers.length > 0) {
      return {
        ok: false,
        error: "not_publishable",
        fieldErrors: Object.fromEntries(
          blockers.map((b, i) => [`${b.code}_${i}`, b.message]),
        ),
      };
    }

    await db
      .update(courses)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));

    revalidatePath("/instrutor");
    revalidatePath("/cursos");
    return { ok: true, data: { warnings } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/** Só checa, sem publicar — alimenta o aviso prévio no editor. */
export async function previewPublishChecks(
  courseId: string,
): Promise<ActionResult<{ blockers: PublishIssue[]; warnings: PublishIssue[] }>> {
  try {
    const user = await requireRole(["admin", "instrutor"]);
    await assertCourseOwnership(courseId, user.id, user.role);
    const course = await getCourseForPublishCheck(courseId);
    if (!course) return { ok: false, error: "not_found" };
    return { ok: true, data: checkCourseForPublish(course) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function archiveCourse(courseId: string): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  await assertCourseOwnership(courseId, user.id, user.role);
  await db
    .update(courses)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(courses.id, courseId));
  revalidatePath("/instrutor");
}

// =============================================================================
// Modules
// =============================================================================

export async function createModule(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const courseId = String(formData.get("courseId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("title_required");
  await assertCourseOwnership(courseId, user.id, user.role);

  const order = await nextModuleOrder(courseId);
  await db.insert(modules).values({
    courseId,
    titleI18n: { "pt-BR": title },
    order,
  });
  revalidatePath(`/instrutor/cursos`);
}

export async function renameModule(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const moduleId = String(formData.get("moduleId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("title_required");
  await assertModuleOwnership(moduleId, user.id, user.role);
  await db
    .update(modules)
    .set({ titleI18n: { "pt-BR": title }, updatedAt: new Date() })
    .where(eq(modules.id, moduleId));
  revalidatePath(`/instrutor/cursos`);
}

export async function deleteModule(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const moduleId = String(formData.get("moduleId"));
  await assertModuleOwnership(moduleId, user.id, user.role);
  await db.delete(modules).where(eq(modules.id, moduleId));
  revalidatePath(`/instrutor/cursos`);
}

// =============================================================================
// Lessons
// =============================================================================

const lessonCreateSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(2).max(200),
  // quiz e assignment ficam de fora até existirem as tabelas correspondentes.
  type: z.enum(["video", "text", "live"]),
  text: z.string().max(20_000).optional(),
});

export async function createLesson(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const parsed = lessonCreateSchema.parse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    type: formData.get("type"),
    text: formData.get("text") || undefined,
  });
  await assertModuleOwnership(parsed.moduleId, user.id, user.role);

  const order = await nextLessonOrder(parsed.moduleId);
  await db.insert(lessons).values({
    moduleId: parsed.moduleId,
    titleI18n: { "pt-BR": parsed.title },
    type: parsed.type,
    order,
    contentRef:
      parsed.type === "text"
        ? { kind: "text", mdx: parsed.text ?? "" }
        : parsed.type === "live"
          ? { kind: "live" } // joinUrl é preenchido na edição da aula
          : { kind: "video" }, // videoAssetId chega depois via startVideoUpload
  });
  revalidatePath(`/instrutor/cursos`);
}

const lessonUpdateSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string().min(2, "Título precisa de ao menos 2 caracteres.").max(200),
  text: z.string().max(20_000).optional(),
  joinUrl: z.string().url("Link inválido.").max(500).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(0).max(600).optional(),
  isPreview: z.boolean(),
});

/**
 * Edição da aula depois de criada: título, conteúdo, duração e flags.
 *
 * Antes disso a aula de texto era inutilizável — nascia com `mdx` vazio e
 * não havia nenhum caminho para preenchê-la.
 */
export async function updateLesson(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);

  const parsed = lessonUpdateSchema.parse({
    lessonId: formData.get("lessonId"),
    title: formData.get("title"),
    text: formData.get("text") ?? undefined,
    joinUrl: formData.get("joinUrl") ?? undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    isPreview: formData.get("isPreview") === "on",
  });

  await assertLessonOwnership(parsed.lessonId, user.id, user.role);

  const [current] = await db
    .select({ type: lessons.type, contentRef: lessons.contentRef })
    .from(lessons)
    .where(eq(lessons.id, parsed.lessonId));
  if (!current) throw new Error("not_found");

  const prevRef = (current.contentRef as Record<string, unknown> | null) ?? {};
  const contentRef: Record<string, unknown> = { ...prevRef };
  if (current.type === "text") {
    contentRef.kind = "text";
    contentRef.mdx = parsed.text ?? "";
  }
  if (current.type === "live") {
    contentRef.kind = "live";
    contentRef.joinUrl = parsed.joinUrl || undefined;
  }

  await db
    .update(lessons)
    .set({
      titleI18n: { "pt-BR": parsed.title },
      contentRef,
      // Duração de vídeo vem da Bunny; para os outros tipos é manual.
      durationSeconds:
        parsed.durationMinutes !== undefined && parsed.durationMinutes > 0
          ? parsed.durationMinutes * 60
          : undefined,
      isPreview: parsed.isPreview,
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, parsed.lessonId));

  revalidatePath(`/instrutor/cursos`);
}

const moveSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export async function moveModuleAction(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const parsed = moveSchema.parse({
    id: formData.get("moduleId"),
    direction: formData.get("direction"),
  });
  await assertModuleOwnership(parsed.id, user.id, user.role);
  await moveModule(parsed.id, parsed.direction);
  revalidatePath(`/instrutor/cursos`);
}

export async function moveLessonAction(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const parsed = moveSchema.parse({
    id: formData.get("lessonId"),
    direction: formData.get("direction"),
  });
  await assertLessonOwnership(parsed.id, user.id, user.role);
  await moveLesson(parsed.id, parsed.direction);
  revalidatePath(`/instrutor/cursos`);
}

export async function deleteLesson(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "instrutor"]);
  const lessonId = String(formData.get("lessonId"));
  await assertLessonOwnership(lessonId, user.id, user.role);
  await db.delete(lessons).where(eq(lessons.id, lessonId));
  revalidatePath(`/instrutor/cursos`);
}

// =============================================================================
// Video upload (Bunny TUS)
// =============================================================================

/**
 * Inicia o upload de vídeo de uma aula:
 *   1. Cria vídeo "shell" na Bunny (GET guid)
 *   2. Cria/atualiza video_assets (status=uploading) com providerAssetId=guid
 *   3. Atualiza lessons.contentRef = { kind:'video', videoAssetId }
 *   4. Retorna ao client os headers TUS assinados
 *
 * Client usa tus-js-client com esses headers — upload vai direto pra Bunny.
 */
export async function startVideoUpload(input: {
  lessonId: string;
  title: string;
}): Promise<
  ActionResult<{
    endpoint: string;
    headers: Record<string, string>;
    videoGuid: string;
    videoAssetId: string;
  }>
> {
  try {
    const user = await requireRole(["admin", "instrutor"]);
    await assertLessonOwnership(input.lessonId, user.id, user.role);

    const { guid } = await createBunnyVideo(input.title || "(sem título)");

    const [asset] = await db
      .insert(videoAssets)
      .values({
        provider: "bunny",
        providerAssetId: guid,
        status: "uploading",
        uploadedBy: user.id,
      })
      .returning({ id: videoAssets.id });

    if (!asset) throw new Error("video_asset_insert_failed");

    // Atualiza a referência da aula
    const [lessonRow] = await db
      .select({ contentRef: lessons.contentRef })
      .from(lessons)
      .where(eq(lessons.id, input.lessonId));
    const prevRef = (lessonRow?.contentRef as Record<string, unknown>) ?? {};
    await db
      .update(lessons)
      .set({
        contentRef: { ...prevRef, kind: "video", videoAssetId: asset.id },
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, input.lessonId));

    const tus = getTusUploadHeaders(guid);

    return {
      ok: true,
      data: {
        endpoint: tus.endpoint,
        headers: tus.headers,
        videoGuid: guid,
        videoAssetId: asset.id,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

/**
 * Consulta status atual do video_assets (polling do client após o upload TUS
 * completar — espera o webhook do Bunny avançar de processing → ready).
 */
export async function getVideoAssetStatus(
  videoAssetId: string,
): Promise<
  ActionResult<{ status: "uploading" | "processing" | "ready" | "errored" }>
> {
  try {
    const user = await requireRole(["admin", "instrutor"]);
    const [row] = await db
      .select({
        status: videoAssets.status,
        uploadedBy: videoAssets.uploadedBy,
        providerAssetId: videoAssets.providerAssetId,
        durationSeconds: videoAssets.durationSeconds,
      })
      .from(videoAssets)
      .where(eq(videoAssets.id, videoAssetId));
    if (!row) return { ok: false, error: "not_found" };
    if (user.role !== "admin" && row.uploadedBy && row.uploadedBy !== user.id) {
      return { ok: false, error: "forbidden" };
    }

    if (row.status === "ready" && row.durationSeconds === null) {
      await syncVideoMetadata(videoAssetId, row.providerAssetId);
    }

    return { ok: true, data: { status: row.status } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

/**
 * Busca duração e thumbnail na Bunny quando o vídeo fica pronto e propaga a
 * duração para a aula, se ela ainda não tiver uma.
 *
 * Roda aqui, no polling do instrutor, e não no webhook: a regra §6 do
 * CLAUDE.md manda o webhook responder rápido, e isto é uma chamada de rede a
 * mais. Falha de rede não pode derrubar o polling — o status do vídeo é a
 * informação importante, a duração é complemento e a próxima chamada tenta
 * de novo.
 */
async function syncVideoMetadata(
  videoAssetId: string,
  providerAssetId: string,
): Promise<void> {
  try {
    const meta = await fetchBunnyVideo(providerAssetId);
    if (meta.lengthSeconds === null && meta.thumbnailUrl === null) return;

    await db
      .update(videoAssets)
      .set({
        durationSeconds: meta.lengthSeconds ?? undefined,
        thumbnailUrl: meta.thumbnailUrl ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(videoAssets.id, videoAssetId));

    if (meta.lengthSeconds !== null) {
      await db
        .update(lessons)
        .set({ durationSeconds: meta.lengthSeconds, updatedAt: new Date() })
        .where(
          and(
            sql`${lessons.contentRef} ->> 'videoAssetId' = ${videoAssetId}`,
            isNull(lessons.durationSeconds),
          ),
        );
    }
  } catch {
    // Silencioso de propósito: ver comentário acima.
  }
}
