import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";

const TRACKS = [
  {
    slug: "taxplus",
    name: "TaxPlus",
    description: "Fiscal · NF-e · NFS-e · SPED",
    color: "bg-product-tax",
    count: 12,
  },
  {
    slug: "bankplus",
    name: "BankPlus",
    description: "Conciliação · CNAB · Pagamentos",
    color: "bg-product-bank",
    count: 7,
  },
  {
    slug: "contractplus",
    name: "ContractPlus",
    description: "Contratos · Faturamento recorrente",
    color: "bg-product-contract",
    count: 5,
  },
  {
    slug: "sap-b1",
    name: "SAP Business One",
    description: "Fundamentos do ERP base",
    color: "bg-invent-ink",
    count: 8,
  },
  {
    slug: "payroll",
    name: "Invent Payroll",
    description: "Folha de pagamento na nuvem",
    color: "bg-product-payroll",
    count: 4,
  },
  {
    slug: "bi",
    name: "BI & Dashboards",
    description: "Dashboards executivos e KPIs",
    color: "bg-accent",
    count: 3,
  },
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
              Filtre por produto, persona ou nível. Você verá apenas os cursos
              disponíveis ao seu nível de acesso após entrar.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((t) => (
              <Link
                key={t.slug}
                href={`/cursos?track=${t.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${t.color}`} />
                <div className="pl-2">
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {t.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{t.count} cursos</span>
                    <span className="text-accent opacity-0 transition group-hover:opacity-100">
                      Acessar →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-dashed border-border bg-background-subtle p-12 text-center">
            <InventVMark className="mx-auto h-10" />
            <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
              Catálogo completo chega na semana 4 do MVP.
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
