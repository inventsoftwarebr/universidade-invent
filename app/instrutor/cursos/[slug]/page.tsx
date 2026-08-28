import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import {
  getInstructorCourseBySlug,
  listCategories,
} from "@/lib/instructor/queries";
import type { EditorLesson, EditorModule } from "@/lib/instructor/queries";
import {
  archiveCourse,
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  moveLessonAction,
  moveModuleAction,
  renameModule,
  updateCourse,
  updateLesson,
} from "@/lib/instructor/actions";
import { CourseStatusBadge } from "@/components/instructor/CourseStatusBadge";
import { ConfirmButton } from "@/components/instructor/ConfirmButton";
import { LessonVideoUploader } from "@/components/instructor/LessonVideoUploader";
import { PublishCourseButton } from "@/components/instructor/PublishCourseButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `Editor · ${slug}` };
}

const TYPE_LABEL: Record<string, string> = {
  video: "Vídeo",
  text: "Texto",
  quiz: "Quiz",
  assignment: "Atividade",
  live: "Aula ao vivo",
};

export default async function CursoEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRole(["admin", "instrutor"]);
  const course = await getInstructorCourseBySlug(slug);
  if (!course) notFound();
  if (
    user.role !== "admin" &&
    course.instructorOwnerId &&
    course.instructorOwnerId !== user.id
  ) {
    redirect("/instrutor");
  }
  const cats = await listCategories();

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/instrutor"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Meus cursos
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {course.title}
            </h1>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            /cursos/{course.slug}
          </p>
        </div>
        <div className="flex items-start gap-2">
          {course.status !== "published" ? (
            <PublishCourseButton courseId={course.id} />
          ) : (
            <form action={archiveWrapper.bind(null, course.id)}>
              <button
                type="submit"
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Arquivar
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Conteúdo do curso
          </h2>

          {course.modules.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              Comece adicionando o primeiro módulo. Cada módulo agrupa aulas
              relacionadas — recomendamos 3 a 6 módulos por curso.
            </p>
          ) : (
            <ol className="space-y-4">
              {course.modules.map((m, idx) => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  index={idx + 1}
                  isFirst={idx === 0}
                  isLast={idx === course.modules.length - 1}
                />
              ))}
            </ol>
          )}

          <NewModuleForm courseId={course.id} />
        </section>

        <aside className="space-y-6">
          <CourseDetailsForm course={course} categories={cats} />
        </aside>
      </div>
    </div>
  );
}

async function archiveWrapper(courseId: string) {
  "use server";
  await archiveCourse(courseId);
}

function ModuleCard({
  module: m,
  index,
  isFirst,
  isLast,
}: {
  module: EditorModule;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-background-subtle px-5 py-3">
        <form action={renameModule} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="moduleId" value={m.id} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Módulo {index}
          </span>
          <input
            name="title"
            defaultValue={m.title}
            aria-label={`Título do módulo ${index}`}
            className="flex-1 rounded-md bg-transparent px-2 py-1 font-display text-base font-bold focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-muted"
          >
            Salvar
          </button>
        </form>

        <div className="flex items-center gap-1">
          <MoveButtons
            action={moveModuleAction}
            idField="moduleId"
            id={m.id}
            label={`módulo ${index}`}
            isFirst={isFirst}
            isLast={isLast}
          />
          <form action={deleteModule}>
            <input type="hidden" name="moduleId" value={m.id} />
            <ConfirmButton
              label="Remover"
              confirmLabel="Confirmar"
              ariaLabel={`Remover módulo ${index} e todas as suas aulas`}
            />
          </form>
        </div>
      </header>

      {m.lessons.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Nenhuma aula ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {m.lessons.map((l, i) => (
            <LessonRow
              key={l.id}
              lesson={l}
              index={i + 1}
              isFirst={i === 0}
              isLast={i === m.lessons.length - 1}
            />
          ))}
        </ul>
      )}

      <NewLessonForm moduleId={m.id} />
    </li>
  );
}

/**
 * Reordenação por setas em vez de drag-and-drop: funciona sem JS, é
 * acessível por teclado e não exige biblioteca. Drag pode vir depois.
 */
function MoveButtons({
  action,
  idField,
  id,
  label,
  isFirst,
  isLast,
}: {
  action: (formData: FormData) => Promise<void>;
  idField: "moduleId" | "lessonId";
  id: string;
  label: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const base =
    "rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="flex items-center gap-1">
      <form action={action}>
        <input type="hidden" name={idField} value={id} />
        <input type="hidden" name="direction" value="up" />
        <button
          type="submit"
          disabled={isFirst}
          aria-label={`Mover ${label} para cima`}
          className={base}
        >
          ↑
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name={idField} value={id} />
        <input type="hidden" name="direction" value="down" />
        <button
          type="submit"
          disabled={isLast}
          aria-label={`Mover ${label} para baixo`}
          className={base}
        >
          ↓
        </button>
      </form>
    </div>
  );
}

function LessonRow({
  lesson: l,
  index,
  isFirst,
  isLast,
}: {
  lesson: EditorLesson;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const needsUpload =
    l.type === "video" && (!l.video || l.video.status === "uploading");
  const durationMinutes = l.durationSeconds
    ? Math.round(l.durationSeconds / 60)
    : "";

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-muted-foreground">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold">{l.title}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold">
              {TYPE_LABEL[l.type]}
            </span>
            {l.isPreview ? (
              <span className="rounded-full bg-invent-gold-50 px-1.5 py-px text-[10px] font-semibold text-invent-gold-700">
                Prévia
              </span>
            ) : null}
            {l.durationSeconds ? (
              <span className="tabular-nums">
                · {Math.round(l.durationSeconds / 60)}min
              </span>
            ) : (
              <span>· sem duração</span>
            )}
            {l.video ? (
              <span
                className={
                  l.video.status === "ready"
                    ? "text-status-success"
                    : l.video.status === "errored"
                      ? "text-accent"
                      : "text-muted-foreground"
                }
              >
                · {l.video.status}
              </span>
            ) : null}
          </div>
        </div>

        <MoveButtons
          action={moveLessonAction}
          idField="lessonId"
          id={l.id}
          label={`aula ${index}`}
          isFirst={isFirst}
          isLast={isLast}
        />
        <form action={deleteLesson}>
          <input type="hidden" name="lessonId" value={l.id} />
          <ConfirmButton
            label="Remover"
            confirmLabel="Confirmar"
            ariaLabel={`Remover aula ${l.title}`}
          />
        </form>
      </div>

      <details className="mt-3 rounded-md border border-border bg-background-subtle">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Editar aula
        </summary>
        <form action={updateLesson} className="space-y-3 px-3 pb-3 text-sm">
          <input type="hidden" name="lessonId" value={l.id} />

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Título
            </span>
            <input
              name="title"
              defaultValue={l.title}
              required
              minLength={2}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {l.type === "text" ? (
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Conteúdo (markdown)
              </span>
              <textarea
                name="text"
                rows={10}
                maxLength={20000}
                defaultValue={
                  typeof l.contentRef.mdx === "string" ? l.contentRef.mdx : ""
                }
                placeholder="# Título da aula&#10;&#10;Escreva o conteúdo aqui."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}

          {l.type === "live" ? (
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Link de acesso
              </span>
              <input
                name="joinUrl"
                type="url"
                defaultValue={
                  typeof l.contentRef.joinUrl === "string"
                    ? l.contentRef.joinUrl
                    : ""
                }
                placeholder="https://meet.google.com/..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duração (min)
              </span>
              <input
                name="durationMinutes"
                type="number"
                min={0}
                max={600}
                defaultValue={durationMinutes}
                disabled={l.type === "video"}
                title={
                  l.type === "video"
                    ? "A duração do vídeo vem da Bunny automaticamente."
                    : undefined
                }
                className="mt-1 w-28 rounded-md border border-input bg-background px-3 py-2 disabled:opacity-50"
              />
            </label>

            <label className="flex items-center gap-2 pb-2 text-xs">
              <input
                type="checkbox"
                name="isPreview"
                defaultChecked={l.isPreview}
                className="h-4 w-4 rounded border-input"
              />
              Prévia gratuita
            </label>

          </div>

          {/*
            `passingRequired` fica de fora até os quizzes existirem: hoje não
            há nada que aprove o aluno, então o controle seria decorativo.
          */}

          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/80"
          >
            Salvar aula
          </button>
        </form>
      </details>

      {needsUpload ? (
        <div className="mt-3 rounded-md border border-dashed border-border bg-background-subtle p-3">
          <LessonVideoUploader lessonId={l.id} lessonTitle={l.title} />
        </div>
      ) : null}
    </li>
  );
}

function NewLessonForm({ moduleId }: { moduleId: string }) {
  return (
    <form
      action={createLesson}
      className="flex flex-wrap items-center gap-2 border-t border-border bg-background-subtle px-5 py-3 text-sm"
    >
      <input type="hidden" name="moduleId" value={moduleId} />
      <select
        name="type"
        defaultValue="video"
        aria-label="Tipo da aula"
        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
      >
        <option value="video">Vídeo</option>
        <option value="text">Texto</option>
        <option value="live">Aula ao vivo</option>
      </select>
      <input
        name="title"
        required
        placeholder="Título da aula"
        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="submit"
        className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/80"
      >
        + Aula
      </button>
    </form>
  );
}

function NewModuleForm({ courseId }: { courseId: string }) {
  return (
    <form
      action={createModule}
      className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card p-4"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input
        name="title"
        required
        placeholder="Nome do novo módulo"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        + Módulo
      </button>
    </form>
  );
}

function CourseDetailsForm({
  course,
  categories,
}: {
  course: {
    id: string;
    title: string;
    summary: string;
    description: string;
    level: "intro" | "intermediate" | "advanced";
    visibility: "public" | "enrolled_only" | "company_only" | "invite_only";
    categoryId: string | null;
    estimatedMinutes: number | null;
  };
  categories: { id: string; name: string }[];
}) {
  return (
    <form
      action={updateCourse}
      className="space-y-4 rounded-xl border border-border bg-card p-5 text-sm"
    >
      <h3 className="font-display text-base font-bold tracking-tight">
        Detalhes do curso
      </h3>
      <input type="hidden" name="id" value={course.id} />

      <SmallField label="Título">
        <input
          name="title"
          defaultValue={course.title}
          required
          minLength={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SmallField>

      <SmallField label="Resumo">
        <textarea
          name="summary"
          defaultValue={course.summary}
          rows={3}
          maxLength={280}
          className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SmallField>

      <SmallField label="Descrição (markdown)">
        <textarea
          name="description"
          defaultValue={course.description}
          rows={6}
          maxLength={8000}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SmallField>

      <div className="grid grid-cols-2 gap-3">
        <SmallField label="Nível">
          <select
            name="level"
            defaultValue={course.level}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="intro">Iniciante</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
          </select>
        </SmallField>
        <SmallField label="Duração estimada (min)">
          <input
            name="estimatedMinutes"
            type="number"
            min={0}
            max={10000}
            defaultValue={course.estimatedMinutes ?? ""}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </SmallField>
      </div>

      <SmallField label="Categoria">
        <select
          name="categoryId"
          defaultValue={course.categoryId ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </SmallField>

      <SmallField label="Visibilidade">
        <select
          name="visibility"
          defaultValue={course.visibility}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="public">Público</option>
          <option value="enrolled_only">Só matriculados</option>
          <option value="company_only">Só empresas vinculadas</option>
          <option value="invite_only">Só com convite</option>
        </select>
      </SmallField>

      <button
        type="submit"
        className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/80"
      >
        Salvar alterações
      </button>
    </form>
  );
}

function SmallField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
