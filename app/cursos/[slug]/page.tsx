import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";
import { LessonTypeIcon } from "@/components/learn/LessonTypeIcon";
import { getOptionalUser } from "@/lib/auth/require-role";
import {
  LEVEL_LABEL,
  getPublicCourseBySlug,
  gradientForCategory,
} from "@/lib/catalog/queries";
import { enrollInCourse } from "@/lib/learn/actions";
import { findEnrollment, listEnrolledCourses } from "@/lib/learn/queries";
import { formatDuration, formatMinutes } from "@/lib/i18n/text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  if (!course) return { title: "Curso não encontrado" };
  return {
    title: course.title,
    description: course.summary || undefined,
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  if (!course) notFound();

  const user = await getOptionalUser();
  const enrollment = user ? await findEnrollment(course.id, user.id) : null;

  // Para quem já é aluno, o CTA aponta para a aula em aberto, não para a primeira.
  let continueLessonId: string | null = null;
  if (user && enrollment) {
    const enrolled = await listEnrolledCourses(user.id);
    continueLessonId =
      enrolled.find((e) => e.courseId === course.id)?.nextLessonId ?? null;
  }

  const durationLabel =
    course.totalLessonSeconds > 0
      ? formatDuration(course.totalLessonSeconds)
      : formatMinutes(course.estimatedMinutes);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <section
          className={`bg-gradient-to-br text-white ${gradientForCategory(course.categorySlug)}`}
        >
          <div className="container py-14 md:py-20">
            <nav className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Link href="/cursos" className="hover:text-white">
                Catálogo
              </Link>
              {course.categoryName ? (
                <>
                  <span aria-hidden="true">/</span>
                  <Link
                    href={`/cursos?categoria=${course.categorySlug}`}
                    className="hover:text-white"
                  >
                    {course.categoryName}
                  </Link>
                </>
              ) : null}
            </nav>

            <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
              <div>
                <h1 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                  {course.title}
                </h1>
                {course.summary ? (
                  <p className="mt-4 max-w-2xl text-lg text-white/80">
                    {course.summary}
                  </p>
                ) : null}

                <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
                  <Stat label="Nível" value={LEVEL_LABEL[course.level]} />
                  <Stat
                    label="Aulas"
                    value={String(course.lessonCount)}
                  />
                  <Stat label="Duração" value={durationLabel} />
                  {course.instructorName ? (
                    <Stat label="Instrutor" value={course.instructorName} />
                  ) : null}
                </dl>
              </div>

              <EnrollPanel
                courseId={course.id}
                courseSlug={course.slug}
                isLoggedIn={Boolean(user)}
                isEnrolled={Boolean(enrollment)}
                continueLessonId={continueLessonId}
              />
            </div>
          </div>
        </section>

        <div className="container grid gap-12 py-14 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            {course.description ? (
              <section>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Sobre o curso
                </h2>
                <p className="mt-4 max-w-2xl whitespace-pre-line text-muted-foreground">
                  {course.description}
                </p>
              </section>
            ) : null}

            <section className="mt-12">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Conteúdo do curso
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.modules.length}{" "}
                {course.modules.length === 1 ? "módulo" : "módulos"} ·{" "}
                {course.lessonCount}{" "}
                {course.lessonCount === 1 ? "aula" : "aulas"}
              </p>

              <ol className="mt-6 space-y-4">
                {course.modules.map((module) => (
                  <li
                    key={module.id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="border-b border-border bg-background-subtle px-5 py-4">
                      <h3 className="font-display font-bold tracking-tight">
                        {module.order}. {module.title}
                      </h3>
                      {module.summary ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {module.summary}
                        </p>
                      ) : null}
                    </div>
                    <ul className="divide-y divide-border">
                      {module.lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className="flex items-center gap-3 px-5 py-3 text-sm"
                        >
                          <LessonTypeIcon
                            type={lesson.type}
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                          />
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.isPreview ? (
                            <span className="rounded-full bg-invent-gold-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-invent-gold-700">
                              Prévia
                            </span>
                          ) : null}
                          <span className="tabular-nums text-xs text-muted-foreground">
                            {formatDuration(lesson.durationSeconds)}
                          </span>
                        </li>
                      ))}
                      {module.lessons.length === 0 ? (
                        <li className="px-5 py-3 text-sm text-muted-foreground">
                          Módulo em produção.
                        </li>
                      ) : null}
                    </ul>
                  </li>
                ))}
              </ol>

              {course.modules.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-border bg-background-subtle p-8 text-center text-sm text-muted-foreground">
                  A ementa deste curso ainda está sendo montada.
                </p>
              ) : null}
            </section>
          </div>

          <aside className="rounded-xl border border-border bg-background-subtle p-6 lg:sticky lg:top-24">
            <h2 className="font-display font-bold tracking-tight">
              Certificado Invent
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ao concluir todas as aulas você recebe um certificado com código
              de verificação pública.
            </p>
            <h2 className="mt-6 font-display font-bold tracking-tight">
              Para quem é
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Clientes Invent, parceiros SAP e profissionais que operam os
              addons no dia a dia.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-lg font-bold tracking-tight">
        {value}
      </dd>
    </div>
  );
}

function EnrollPanel({
  courseId,
  courseSlug,
  isLoggedIn,
  isEnrolled,
  continueLessonId,
}: {
  courseId: string;
  courseSlug: string;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  continueLessonId: string | null;
}) {
  const panelClass =
    "rounded-xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm";

  if (isEnrolled) {
    return (
      <div className={panelClass}>
        <p className="text-sm font-semibold text-white/80">
          Você já está matriculado.
        </p>
        <Link
          href={
            continueLessonId
              ? `/aprender/${courseSlug}/${continueLessonId}`
              : "/aprender"
          }
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-invent-black transition hover:bg-white/90"
        >
          Continuar curso
        </Link>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={panelClass}>
        <p className="text-sm font-semibold text-white/80">
          Cursos gratuitos para clientes e parceiros Invent.
        </p>
        <Link
          href={`/cadastrar?next=/cursos/${courseSlug}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Criar conta gratuita
        </Link>
        <Link
          href={`/entrar?next=/cursos/${courseSlug}`}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Já tenho conta
        </Link>
      </div>
    );
  }

  return (
    <form action={enrollInCourse} className={panelClass}>
      <input type="hidden" name="courseId" value={courseId} />
      <p className="text-sm font-semibold text-white/80">
        Matrícula imediata, sem custo.
      </p>
      <button
        type="submit"
        className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        Matricular e começar
      </button>
    </form>
  );
}
