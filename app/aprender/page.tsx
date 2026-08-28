import Link from "next/link";
import { InventVMark } from "@/components/brand/InventLogo";
import { CourseCard } from "@/components/learn/CourseCard";
import { requireUser } from "@/lib/auth/require-role";
import { listPublishedCourses } from "@/lib/catalog/queries";
import { listEnrolledCourses } from "@/lib/learn/queries";

export const metadata = { title: "Aprender" };

export default async function AprenderHomePage() {
  const user = await requireUser();
  const firstName = user.fullName?.split(" ")[0] ?? "estudante";

  const enrolled = await listEnrolledCourses(user.id);
  const enrolledIds = new Set(enrolled.map((e) => e.courseId));

  // "Continuar" = cursos com atividade e ainda inacabados, mais recentes antes.
  const continueList = enrolled
    .filter((e) => e.progressPct < 100 && e.lastEventAt !== null)
    .sort(
      (a, b) => (b.lastEventAt?.getTime() ?? 0) - (a.lastEventAt?.getTime() ?? 0),
    );
  const notStarted = enrolled.filter((e) => e.lastEventAt === null);

  const catalog = await listPublishedCourses();
  const fresh = catalog.filter((c) => !enrolledIds.has(c.id)).slice(0, 4);

  const totalCompleted = enrolled.filter((e) => e.progressPct === 100).length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Bem-vindo, {firstName}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {continueList.length > 0
              ? "Continue de onde parou."
              : "Vamos começar seu primeiro curso."}
          </h1>
        </div>
        {enrolled.length > 0 ? (
          <ProgressRingStat
            pct={
              enrolled.length > 0
                ? Math.round(totalCompleted * 100 / enrolled.length)
                : 0
            }
            label="Cursos concluídos"
            sub={`${totalCompleted} de ${enrolled.length} matrículas`}
          />
        ) : null}
      </header>

      {continueList.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-5 font-display text-2xl font-bold tracking-tight">
            Continue assistindo
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {continueList.map((course) => (
              <CourseCard
                key={course.enrollmentId}
                course={{
                  slug: course.courseSlug,
                  title: course.title,
                  summary: course.summary,
                  level: course.level,
                  categorySlug: course.categorySlug,
                  estimatedMinutes: null,
                  lessonCount: course.lessonCount,
                }}
                progressPct={course.progressPct}
                href={
                  course.nextLessonId
                    ? `/aprender/${course.courseSlug}/${course.nextLessonId}`
                    : `/cursos/${course.courseSlug}`
                }
                ctaLabel={
                  course.nextLessonTitle
                    ? `Retomar: ${course.nextLessonTitle}`
                    : "Retomar"
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {notStarted.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-5 font-display text-2xl font-bold tracking-tight">
            Suas matrículas
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {notStarted.map((course) => (
              <CourseCard
                key={course.enrollmentId}
                course={{
                  slug: course.courseSlug,
                  title: course.title,
                  summary: course.summary,
                  level: course.level,
                  categorySlug: course.categorySlug,
                  estimatedMinutes: null,
                  lessonCount: course.lessonCount,
                }}
                href={
                  course.nextLessonId
                    ? `/aprender/${course.courseSlug}/${course.nextLessonId}`
                    : `/cursos/${course.courseSlug}`
                }
                ctaLabel="Começar"
              />
            ))}
          </div>
        </section>
      ) : null}

      {enrolled.length === 0 ? <EmptyContinueCard /> : null}

      {fresh.length > 0 ? (
        <section className="mt-12">
          <header className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Novos no catálogo
            </h2>
            <Link
              href="/cursos"
              className="text-sm font-semibold text-accent hover:text-invent-red-700"
            >
              Ver catálogo →
            </Link>
          </header>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {fresh.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProgressRingStat({
  pct,
  label,
  sub,
}: {
  pct: number;
  label: string;
  sub: string;
}) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} role="img" aria-label={`${pct}% ${label}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          className="fill-foreground font-display text-[12px] font-bold"
        >
          {pct}%
        </text>
      </svg>
      <div className="text-sm">
        <strong className="block font-semibold">{label}</strong>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

function EmptyContinueCard() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <InventVMark className="mx-auto h-10" />
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
        Você ainda não começou nenhum curso.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Quando você iniciar uma aula, ela aparece aqui para retomar com 1
        clique.
      </p>
      <Link
        href="/cursos"
        className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Explorar cursos
      </Link>
    </div>
  );
}
