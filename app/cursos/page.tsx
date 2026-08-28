import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";
import { CourseCard } from "@/components/learn/CourseCard";
import {
  LEVEL_LABEL,
  listCatalogCategories,
  listPublishedCourses,
  type CourseLevel,
} from "@/lib/catalog/queries";

export const metadata = {
  title: "Cursos",
  description:
    "Catálogo da Universidade Invent: TaxPlus, BankPlus, ContractPlus e SAP Business One.",
};

const LEVELS: CourseLevel[] = ["intro", "intermediate", "advanced"];

function parseLevel(value: string | undefined): CourseLevel | undefined {
  return LEVELS.find((l) => l === value);
}

/** Preserva os filtros ativos ao trocar um deles. */
function buildHref(
  current: { category?: string; level?: string; q?: string },
  patch: Partial<{ category: string | null; level: string | null }>,
): string {
  const params = new URLSearchParams();
  const category = patch.category !== undefined ? patch.category : current.category;
  const level = patch.level !== undefined ? patch.level : current.level;
  if (category) params.set("categoria", category);
  if (level) params.set("nivel", level);
  if (current.q) params.set("q", current.q);
  const qs = params.toString();
  return qs ? `/cursos?${qs}` : "/cursos";
}

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.categoria === "string" ? params.categoria : undefined;
  const level = parseLevel(
    typeof params.nivel === "string" ? params.nivel : undefined,
  );
  const q = typeof params.q === "string" ? params.q.trim() || undefined : undefined;

  const [categories, courses] = await Promise.all([
    listCatalogCategories(),
    listPublishedCourses({ category, level, q }),
  ]);

  const current = { category, level, q };
  const hasFilters = Boolean(category || level || q);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <section className="border-b border-border bg-background-subtle">
          <div className="container py-16 md:py-20">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Catálogo
            </p>
            <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Todos os cursos da Universidade Invent.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Cursos sobre os addons Invent para SAP Business One e S/4HANA
              Cloud, produzidos por quem implanta.
            </p>

            <form action="/cursos" className="mt-8 flex max-w-md gap-2">
              {category ? (
                <input type="hidden" name="categoria" value={category} />
              ) : null}
              {level ? <input type="hidden" name="nivel" value={level} /> : null}
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar por assunto, produto ou obrigação"
                aria-label="Buscar cursos"
                className="h-11 w-full rounded-md border border-border bg-card px-4 text-sm outline-none ring-primary/40 placeholder:text-muted-foreground focus-visible:ring-2"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-md bg-invent-ink px-5 text-sm font-semibold text-white transition hover:bg-invent-black"
              >
                Buscar
              </button>
            </form>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          <nav
            aria-label="Filtros do catálogo"
            className="flex flex-col gap-4 border-b border-border pb-8"
          >
            <FilterRow label="Categoria">
              <FilterChip href={buildHref(current, { category: null })} active={!category}>
                Todas
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c.slug}
                  href={buildHref(current, { category: c.slug })}
                  active={category === c.slug}
                >
                  {c.name}
                  <span className="ml-1.5 text-muted-foreground">{c.courseCount}</span>
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Nível">
              <FilterChip href={buildHref(current, { level: null })} active={!level}>
                Todos
              </FilterChip>
              {LEVELS.map((l) => (
                <FilterChip
                  key={l}
                  href={buildHref(current, { level: l })}
                  active={level === l}
                >
                  {LEVEL_LABEL[l]}
                </FilterChip>
              ))}
            </FilterRow>
          </nav>

          <p className="mt-8 text-sm text-muted-foreground">
            {courses.length === 1
              ? "1 curso encontrado"
              : `${courses.length} cursos encontrados`}
          </p>

          {courses.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyCatalog hasFilters={hasFilters} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "rounded-full border border-invent-ink bg-invent-ink px-3.5 py-1.5 text-xs font-semibold text-white"
          : "rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-invent-gray-500"
      }
    >
      {children}
    </Link>
  );
}

function EmptyCatalog({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border bg-background-subtle p-12 text-center">
      <InventVMark className="mx-auto h-10" />
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
        {hasFilters
          ? "Nenhum curso com esses filtros."
          : "O catálogo ainda está sendo publicado."}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Tente ampliar a busca ou remover um filtro."
          : "Os primeiros cursos-piloto entram assim que a equipe de conteúdo publicar."}
      </p>
      {hasFilters ? (
        <Link
          href="/cursos"
          className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Limpar filtros
        </Link>
      ) : null}
    </div>
  );
}
