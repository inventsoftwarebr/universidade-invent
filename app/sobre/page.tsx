import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";

export default function SobrePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <section className="relative overflow-hidden border-b border-border bg-background-subtle">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 top-12 hidden opacity-[0.08] lg:block"
          >
            <InventVMark className="h-[360px] w-auto" />
          </div>
          <div className="container relative py-20 md:py-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Sobre
            </p>
            <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Somos a <span className="text-invent-gradient">Invent Software</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              ISV parceira da SAP, certificada três vezes. Desenvolvemos
              soluções fiscais, financeiras/bancárias e de contratos que
              integram nativamente com SAP Business One e SAP S/4HANA Cloud
              ERP. A Universidade Invent é onde clientes, parceiros e
              profissionais aprendem a tirar o máximo das nossas soluções.
            </p>
          </div>
        </section>

        <section className="container py-20">
          <div className="grid gap-12 md:grid-cols-3">
            <Stat label="ISV SAP" value="3x" detail="Certificações conquistadas" />
            <Stat
              label="Soluções nativas"
              value="SAP B1 + S/4HANA"
              detail="Cloud ERP"
            />
            <Stat
              label="Domínios"
              value="Fiscal · Financeiro · Contratos"
              detail="Addons especializados"
            />
          </div>

          <div className="mt-20 rounded-2xl border border-border bg-card p-10 md:p-14">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Por que uma Universidade?
            </h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Todo contrato Invent inclui acesso a cursos sobre as soluções
              contratadas. Mais que cumprir contrato, queremos que o cliente e
              o parceiro extraiam o máximo do que adquiriram — e que profissionais
              SAP encontrem aqui referência técnica de fiscal e financeiro
              brasileiro de verdade.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-l-2 border-primary pl-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
    </div>
  );
}
