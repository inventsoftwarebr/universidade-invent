import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";

const CATEGORIES = [
  { slug: "sap", name: "SAP", count: 12, color: "bg-primary" },
  { slug: "fiscal", name: "Gestão Fiscal", count: 9, color: "bg-accent" },
  {
    slug: "financeiro",
    name: "Financeiro & Bancário",
    count: 7,
    color: "bg-primary-soft",
  },
  { slug: "contratos", name: "Contratos", count: 5, color: "bg-accent-soft" },
];

export default function CursosPage() {
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
              Filtre por categoria, persona ou produto SAP. Você verá apenas os
              cursos disponíveis ao seu nível de acesso.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/cursos?cat=${cat.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${cat.color}`} />
                <div className="pl-2">
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {cat.name}
                  </h2>
                  <p className="mt-6 text-xs font-semibold text-muted-foreground">
                    {cat.count} cursos
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-dashed border-border bg-background-subtle p-12 text-center">
            <InventVMark className="mx-auto h-10 opacity-60" />
            <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
              Catálogo completo chegando na semana 4 do MVP.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Listagem com filtros, busca e cards de curso com progresso e
              tempo estimado entra em ritmo após o pipeline de autoria
              (semana 3).
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
