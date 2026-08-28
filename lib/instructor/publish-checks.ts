/**
 * Regras de "este curso está pronto para publicar?".
 *
 * Função pura, sem banco, porque é a regra que decide o que o aluno vê no
 * catálogo — publicar um curso quebrado é pior do que não publicar.
 * `blockers` impedem a publicação; `warnings` só avisam.
 */

export type PublishIssue = {
  code: string;
  message: string;
  /** Onde o instrutor precisa mexer, para a UI conseguir apontar. */
  where?: string;
};

export type PublishCheckResult = {
  blockers: PublishIssue[];
  warnings: PublishIssue[];
};

export type LessonForPublish = {
  title: string;
  type: "video" | "text" | "quiz" | "assignment" | "live";
  durationSeconds: number | null;
  contentRef: Record<string, unknown>;
  video: { status: "uploading" | "processing" | "ready" | "errored" } | null;
};

export type ModuleForPublish = {
  title: string;
  lessons: LessonForPublish[];
};

export type CourseForPublish = {
  summary: string;
  modules: ModuleForPublish[];
};

export function checkCourseForPublish(
  course: CourseForPublish,
): PublishCheckResult {
  const blockers: PublishIssue[] = [];
  const warnings: PublishIssue[] = [];

  if (course.modules.length === 0) {
    blockers.push({
      code: "no_modules",
      message: "O curso não tem nenhum módulo.",
    });
  }

  const emptyModules = course.modules.filter((m) => m.lessons.length === 0);
  for (const m of emptyModules) {
    blockers.push({
      code: "empty_module",
      message: `O módulo "${m.title}" não tem aulas.`,
      where: m.title,
    });
  }

  for (const m of course.modules) {
    for (const lesson of m.lessons) {
      if (lesson.type === "video") {
        if (!lesson.video) {
          blockers.push({
            code: "video_missing",
            message: `A aula "${lesson.title}" é de vídeo e ainda não tem arquivo enviado.`,
            where: lesson.title,
          });
        } else if (lesson.video.status === "errored") {
          blockers.push({
            code: "video_errored",
            message: `O vídeo da aula "${lesson.title}" falhou no processamento.`,
            where: lesson.title,
          });
        } else if (lesson.video.status !== "ready") {
          blockers.push({
            code: "video_not_ready",
            message: `O vídeo da aula "${lesson.title}" ainda está sendo processado pela Bunny.`,
            where: lesson.title,
          });
        }
      }

      if (lesson.type === "text") {
        const mdx = lesson.contentRef.mdx;
        if (typeof mdx !== "string" || mdx.trim().length === 0) {
          blockers.push({
            code: "text_empty",
            message: `A aula "${lesson.title}" é de texto e está sem conteúdo.`,
            where: lesson.title,
          });
        }
      }

      if (lesson.type === "live") {
        const joinUrl = lesson.contentRef.joinUrl;
        if (typeof joinUrl !== "string" || joinUrl.trim().length === 0) {
          blockers.push({
            code: "live_without_url",
            message: `A aula ao vivo "${lesson.title}" está sem link de acesso.`,
            where: lesson.title,
          });
        }
      }

      if (!lesson.durationSeconds || lesson.durationSeconds <= 0) {
        warnings.push({
          code: "missing_duration",
          message: `A aula "${lesson.title}" está sem duração — o catálogo vai mostrar "—".`,
          where: lesson.title,
        });
      }
    }
  }

  if (course.summary.trim().length === 0) {
    warnings.push({
      code: "missing_summary",
      message: "Sem resumo, o card do curso no catálogo fica só com o título.",
    });
  }

  return { blockers, warnings };
}
