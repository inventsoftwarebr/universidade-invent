import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { listCategories } from "@/lib/instructor/queries";
import { createCourse } from "@/lib/instructor/actions";

export const metadata = { title: "Novo curso" };

export default async function NovoCursoPage() {
  await requireRole(["admin", "instrutor"]);
  const cats = await listCategories();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/instrutor"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Voltar
      </Link>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
        Novo curso
      </h1>
      <p className="mt-2 text-muted-foreground">
        Comece com o básico — você pode ajustar tudo depois antes de publicar.
      </p>

      <form action={createCourse} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field id="title" label="Título" required>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={160}
            placeholder="Ex.: Fundamentos do TaxPlus"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </Field>

        <Field id="summary" label="Resumo (1 parágrafo)" hint="Mostrado no catálogo e em emails.">
          <textarea
            id="summary"
            name="summary"
            maxLength={280}
            rows={3}
            placeholder="Para quem é, o que aprende, em quanto tempo."
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field id="level" label="Nível">
            <select
              id="level"
              name="level"
              defaultValue="intro"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option value="intro">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
            </select>
          </Field>
          <Field id="categoryId" label="Categoria">
            <select
              id="categoryId"
              name="categoryId"
              defaultValue=""
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option value="">Sem categoria</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          id="visibility"
          label="Visibilidade"
          hint="Você pode mudar depois. Rascunho fica sempre invisível pro aluno."
        >
          <select
            id="visibility"
            name="visibility"
            defaultValue="enrolled_only"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="public">Público — qualquer pessoa pode encontrar</option>
            <option value="enrolled_only">Só matriculados</option>
            <option value="company_only">Só empresas vinculadas</option>
            <option value="invite_only">Só com convite</option>
          </select>
        </Field>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/instrutor"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Criar curso
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-foreground"
      >
        {label} {required ? <span className="text-accent">*</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
