import Link from "next/link";
import {
  LEVEL_LABEL,
  gradientForCategory,
  type CourseLevel,
} from "@/lib/catalog/queries";
import { formatMinutes } from "@/lib/i18n/text";

export type CourseCardData = {
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  categorySlug: string | null;
  categoryName?: string | null;
  estimatedMinutes: number | null;
  lessonCount: number;
};

/**
 * Card de curso do catálogo e do dashboard. Com `progressPct` definido, vira
 * o card de "continuar assistindo" e aponta direto para a próxima aula.
 */
export function CourseCard({
  course,
  progressPct,
  href,
  ctaLabel,
}: {
  course: CourseCardData;
  progressPct?: number;
  href?: string;
  ctaLabel?: string;
}) {
  const target = href ?? `/cursos/${course.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={target} className="flex flex-1 flex-col">
        <div
          className={`relative flex aspect-video flex-col justify-end bg-gradient-to-br p-4 text-white ${gradientForCategory(course.categorySlug)}`}
        >
          {course.categoryName ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              {course.categoryName}
            </span>
          ) : null}
          <h3 className="mt-1 font-display text-lg font-bold leading-tight tracking-tight">
            {course.title}
          </h3>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          {course.summary ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {course.summary}
            </p>
          ) : null}

          {typeof progressPct === "number" ? (
            <div className="mt-auto space-y-1.5">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {progressPct}% concluído
              </span>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-medium text-muted-foreground">
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              {LEVEL_LABEL[course.level]}
            </span>
            {course.lessonCount > 0 ? (
              <span>
                {course.lessonCount} {course.lessonCount === 1 ? "aula" : "aulas"}
              </span>
            ) : null}
            <span>{formatMinutes(course.estimatedMinutes)}</span>
          </div>

          {ctaLabel ? (
            <span className="text-sm font-semibold text-accent">{ctaLabel} →</span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
