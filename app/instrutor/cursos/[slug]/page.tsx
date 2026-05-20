import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import {
  getInstructorCourseBySlug,
  listCategories,
} from "@/lib/instructor/queries";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  publishCourse,
  archiveCourse,
  renameModule,
  updateCourse,
} from "@/lib/instructor/actions";
import { CourseStatusBadge } from "@/components/instructor/CourseStatusBadge";
import { LessonVideoUploader } from "@/components/instructor/LessonVideoUploader";

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
        <div className="flex items-center gap-2">
          {course.status !== "published" ? (
            <form action={publishWrapper.bind(null, course.id)}>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Publicar
              </button>
            </form>
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
        {/* Conteúdo (módulos + aulas) */}
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
                <ModuleCard key={m.id} module={m} index={idx + 1} />
              ))}
            </ol>
          )}

          <NewModuleForm courseId={course.id} />
        </section>

        {/* Detalhes do curso (form de edição) */}
        <aside className="space-y-6">
          <CourseDetailsForm
            course={course}
            categories={cats}
          />
        </aside>
      </div>
    </div>
  );
}

// Wrapper porque server actions tied to bind() recebem args inicialmente.
async function publishWrapper(courseId: string) {
  "use server";
  await publishCourse(courseId);
}
async function archiveWrapper(courseId: string) {
  "use server";
  await archiveCourse(courseId);
}

function ModuleCard({
  module: m,
  index,
}: {
  module: {
    id: string;
    title: string;
    lessons: {
      id: string;
      type: "video" | "text" | "quiz" | "assignment" | "live";
      title: string;
      durationSeconds: number | null;
      video: { id: string; status: string } | null;
      contentRef: Record<string, unknown>;
    }[];
  };
  index: number;
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
            className="flex-1 rounded-md bg-transparent px-2 py-1 font-display text-base font-bold focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-muted"
          >
            Salvar
          </button>
        </form>
        <form action={deleteModule}>
          <input type="hidden" name="moduleId" value={m.id} />
          <button
            type="submit"
            aria-label="Remover módulo"
            className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/10 hover:text-accent"
          >
            Remover
          </button>
        </form>
      </header>

      {m.lessons.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Nenhuma aula ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {m.lessons.map((l, i) => (
            <LessonRow key={l.id} lesson={l} index={i + 1} />
          ))}
        </ul>
      )}

      <NewLessonForm moduleId={m.id} />
    </li>
  );
}

function LessonRow({
  lesson: l,
  index,
}: {
  lesson: {
    id: string;
    type: "video" | "text" | "quiz" | "assignment" | "live";
    title: string;
    durationSeconds: number | null;
    video: { id: string; status: string } | null;
    contentRef: Record<string, unknown>;
  };
  index: number;
}) {
  const needsUpload =
    l.type === "video" && (!l.video || l.video.status === "uploading");
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
        <form action={deleteLesson}>
          <input type="hidden" name="lessonId" value={l.id} />
          <button
            type="submit"
            aria-label="Remover aula"
            className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/10 hover:text-accent"
          >
            Remover
          </button>
        </form>
      </div>

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
        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
      >
        <option value="video">Vídeo</option>
        <option value="text">Texto</option>
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
