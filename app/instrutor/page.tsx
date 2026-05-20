import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { listInstructorCourses } from "@/lib/instructor/queries";
import { InventVMark } from "@/components/brand/InventLogo";
import { CourseStatusBadge } from "@/components/instructor/CourseStatusBadge";

export const metadata = { title: "Instrutor" };

const LEVEL_LABEL = {
  intro: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
} as const;

export default async function InstrutorHomePage() {
  const user = await requireRole(["admin", "instrutor"]);
  const courses = await listInstructorCourses(user.id, user.role === "admin");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Autoria de cursos
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Olá, {user.fullName?.split(" ")[0] ?? "instrutor"}.
          </h1>
        </div>
        <Link
          href="/instrutor/cursos/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          + Novo curso
        </Link>
      </header>

      {courses.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background-subtle text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Curso</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Nível</th>
                <th className="px-5 py-3 text-center">Módulos</th>
                <th className="px-5 py-3 text-center">Aulas</th>
                <th className="px-5 py-3 text-right">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border transition hover:bg-background-subtle"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/instrutor/cursos/${c.slug}`}
                      className="font-semibold text-foreground hover:text-accent"
                    >
                      {c.title}
                    </Link>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      /{c.slug}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <CourseStatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {LEVEL_LABEL[c.level]}
                  </td>
                  <td className="px-5 py-4 text-center text-muted-foreground">
                    {c.moduleCount}
                  </td>
                  <td className="px-5 py-4 text-center text-muted-foreground">
                    {c.lessonCount}
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                    {c.updatedAt.toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <InventVMark className="mx-auto h-10" />
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
        Você ainda não criou nenhum curso.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Crie seu primeiro curso. Você poderá adicionar módulos, aulas em vídeo
        (upload direto para o Bunny Stream) e em texto.
      </p>
      <Link
        href="/instrutor/cursos/novo"
        className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Criar primeiro curso
      </Link>
    </section>
  );
}
