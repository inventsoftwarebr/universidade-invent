import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { CompleteLessonButton } from "@/components/learn/CompleteLessonButton";
import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { LessonTypeIcon, lessonTypeLabel } from "@/components/learn/LessonTypeIcon";
import { requireUser } from "@/lib/auth/require-role";
import { getPlayerData, type PlayerData } from "@/lib/learn/queries";
import { formatDuration } from "@/lib/i18n/text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const user = await requireUser();
  const data = await getPlayerData(courseSlug, lessonId, user.id);
  if (!data) return { title: "Aula" };
  return { title: `${data.lesson.title} · ${data.course.title}` };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const user = await requireUser();
  const data = await getPlayerData(courseSlug, lessonId, user.id);

  // Sem matrícula (ou curso/aula inexistente) o aluno vai para a página do
  // curso, que oferece a matrícula — não faz sentido um 404 seco aqui.
  if (!data) redirect(`/cursos/${courseSlug}`);

  const { lesson } = data;
  const nextHref = data.nextLessonId
    ? `/aprender/${courseSlug}/${data.nextLessonId}`
    : null;
  const previousHref = data.previousLessonId
    ? `/aprender/${courseSlug}/${data.previousLessonId}`
    : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="min-w-0">
        <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Link href="/aprender" className="hover:text-foreground">
            Aprender
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/cursos/${courseSlug}`} className="hover:text-foreground">
            {data.course.title}
          </Link>
        </nav>

        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <LessonTypeIcon type={lesson.type} className="h-4 w-4" />
          {lessonTypeLabel(lesson.type)}
          {lesson.durationSeconds ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {formatDuration(lesson.durationSeconds)}
              </span>
            </>
          ) : null}
        </p>

        <div className="mt-6">
          <LessonBody data={data} enrollmentId={data.enrollmentId} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <CompleteLessonButton
            enrollmentId={data.enrollmentId}
            lessonId={lesson.id}
            alreadyCompleted={lesson.status === "completed"}
            nextHref={nextHref}
          />
          <div className="flex gap-2">
            {previousHref ? (
              <Link
                href={previousHref}
                className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Anterior
              </Link>
            ) : null}
            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Próxima
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-card lg:sticky lg:top-24">
        <header className="border-b border-border px-5 py-4">
          <h2 className="font-display font-bold tracking-tight">
            Conteúdo do curso
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.completedLessons} de {data.totalLessons} aulas concluídas
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${data.totalLessons > 0 ? Math.round((data.completedLessons / data.totalLessons) * 100) : 0}%`,
              }}
            />
          </div>
        </header>

        <ol className="max-h-[60vh] overflow-y-auto">
          {data.modules.map((module) => (
            <li key={module.id}>
              <h3 className="bg-background-subtle px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {module.order}. {module.title}
              </h3>
              <ul>
                {module.lessons.map((item) => {
                  const isCurrent = item.id === lesson.id;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/aprender/${courseSlug}/${item.id}`}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`flex items-start gap-2.5 border-l-2 px-5 py-2.5 text-sm transition ${
                          isCurrent
                            ? "border-accent bg-muted font-semibold"
                            : "border-transparent hover:bg-muted"
                        }`}
                      >
                        {item.status === "completed" ? (
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-invent-gold-600"
                            aria-label="Concluída"
                          />
                        ) : (
                          <LessonTypeIcon
                            type={item.type}
                            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                          />
                        )}
                        <span className="flex-1">{item.title}</span>
                        <span className="mt-0.5 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {formatDuration(item.durationSeconds)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function LessonBody({
  data,
  enrollmentId,
}: {
  data: PlayerData;
  enrollmentId: string;
}) {
  const { lesson } = data;

  if (lesson.type === "video") {
    if (lesson.video?.playbackUrl) {
      return (
        <LessonPlayer
          enrollmentId={enrollmentId}
          lessonId={lesson.id}
          title={lesson.title}
          playbackUrl={lesson.video.playbackUrl}
          startAtSeconds={lesson.watchPositionSeconds}
        />
      );
    }
    return (
      <VideoUnavailable status={lesson.video?.status ?? "uploading"} />
    );
  }

  if (lesson.type === "text") {
    return (
      <article className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-foreground">
        {lesson.markdown ?? "Esta aula ainda não tem conteúdo publicado."}
      </article>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-background-subtle p-10 text-center">
      <p className="font-display font-bold tracking-tight">
        {lessonTypeLabel(lesson.type)} chega em uma próxima entrega.
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Quizzes entram na semana 5 e atividades na v1. Você já pode marcar
        esta aula como concluída para seguir o curso.
      </p>
    </div>
  );
}

function VideoUnavailable({ status }: { status: string }) {
  const message =
    status === "errored"
      ? "O processamento deste vídeo falhou. O instrutor já foi notificado."
      : "Este vídeo ainda está sendo processado pela Bunny. Atualize em alguns minutos.";

  return (
    <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-invent-black p-8 text-center">
      <p className="max-w-sm text-sm text-white/70">{message}</p>
    </div>
  );
}
