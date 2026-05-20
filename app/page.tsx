import Link from "next/link";
import Image from "next/image";
import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";

const PRODUCTS = [
  {
    slug: "taxplus",
    name: "TaxPlus",
    color: "bg-product-tax",
    text: "Apuração ICMS, SPED, NF-e, NFS-e e contingência.",
    count: 12,
  },
  {
    slug: "bankplus",
    name: "BankPlus",
    color: "bg-product-bank",
    text: "Conciliação bancária, CNAB, pagamentos e fluxo de caixa.",
    count: 7,
  },
  {
    slug: "contractplus",
    name: "ContractPlus",
    color: "bg-product-contract",
    text: "Contratos, faturamento recorrente e indexação.",
    count: 5,
  },
  {
    slug: "payroll",
    name: "Invent Payroll",
    color: "bg-product-payroll",
    text: "Folha de pagamento na nuvem integrada ao SAP B1.",
    count: 4,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero — surface premium escura, padrão das peças oficiais */}
      <section className="surface-premium relative overflow-hidden">
        <div className="container relative grid gap-16 py-20 md:py-28 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative z-10 text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-invent-gold-300">
              Parceira SAP® · ISV premiada
            </span>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Aprenda a operar os addons{" "}
              <span className="text-v-gradient">SAP da Invent</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
              Universidade oficial da Invent Software. Cursos sobre TaxPlus,
              BankPlus, ContractPlus e Invent Payroll para clientes, parceiros
              e profissionais SAP que querem ir mais fundo.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Explorar cursos
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/cadastrar"
                className="rounded-md border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Criar conta gratuita
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <CheckGold /> SAP Business One
              </span>
              <span className="flex items-center gap-2">
                <CheckGold /> SAP S/4HANA Cloud ERP
              </span>
              <span className="flex items-center gap-2">
                <CheckGold /> ISV 3x premiada na LATAM
              </span>
            </div>
          </div>

          {/* Card de "curso em destaque" premium */}
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-6 rounded-3xl bg-v-gradient opacity-25 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-invent-gray-900 shadow-xl">
                <div className="relative aspect-video bg-gradient-to-br from-product-tax to-invent-black">
                  <InventVMark className="absolute right-6 top-6 h-12" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      ▶
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-invent-gold-300">
                        Em destaque · TaxPlus
                      </div>
                      <div className="font-display font-semibold text-white">
                        Fundamentos do TaxPlus
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 bg-invent-black p-5 text-white/80">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>Iniciante · 2h 22min</span>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-invent-gold-300">
                      Certificado SAP
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[64%] rounded-full bg-v-gradient" />
                  </div>
                  <p className="text-sm text-white/60">
                    Você está no módulo 2 de 4 · próxima aula:{" "}
                    <em className="not-italic text-white">Parametrização tributária</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trilhas por produto */}
      <section className="border-y border-border bg-background-subtle">
        <div className="container py-16 md:py-20">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Trilhas por produto
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Cada addon Invent tem sua trilha.
              </h2>
            </div>
            <Link
              href="/cursos"
              className="hidden text-sm font-semibold text-accent hover:text-invent-red-700 md:inline-flex"
            >
              Ver todas as trilhas →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <Link
                key={p.slug}
                href="/cursos"
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${p.color}`} />
                <div className="pl-2">
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    {p.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
                  <div className="mt-6 flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{p.count} cursos</span>
                    <span className="text-accent opacity-0 transition group-hover:opacity-100">
                      Acessar →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Públicos */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Para quem é
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Conteúdo desenhado para cada papel.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Decisores precisam de visão estratégica e ROI. Quem opera, precisa
            de profundidade técnica. A Universidade Invent atende os dois.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <PersonaCard
            label="Clientes Invent"
            title="Maximize o uso do que já contratou"
            description="Tire 100% do retorno dos addons. Onboarding, melhores práticas e atualizações."
          />
          <PersonaCard
            label="Parceiros SAP"
            title="Implementar e revender com confiança"
            description="Capacitação para integradores e revendedores SAP que entregam soluções Invent."
            highlight
          />
          <PersonaCard
            label="Profissionais SAP"
            title="Construa autoridade na sua área"
            description="Cursos gratuitos abertos a CFOs, controllers, analistas e consultores SAP."
          />
        </div>
      </section>

      {/* Faixa "ISV premiada" — referencia o products-hero do design system */}
      <section className="container pb-20">
        <div className="surface-premium relative overflow-hidden rounded-2xl px-8 py-14 md:px-14">
          <div className="relative z-10 max-w-2xl text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-invent-gold-300">
              Otimizando a performance de pessoas e empresas
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Três anos consecutivos como melhor ISV da América Latina no ecossistema SAP Business One.
            </h2>
            <p className="mt-4 max-w-xl text-white/70">
              A Universidade Invent é onde esse conhecimento — fiscal, financeiro e de contratos brasileiros — vira capacitação prática.
            </p>
          </div>
          {/* products-hero apenas decorativo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 bottom-0 hidden h-full w-[55%] opacity-40 lg:block"
          >
            <Image
              src="/brand/products-hero.png"
              alt=""
              width={900}
              height={500}
              className="h-full w-auto object-contain object-right"
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function CheckGold() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8.5l3 3 6.5-7"
        stroke="#F7A600"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonaCard({
  label,
  title,
  description,
  highlight = false,
}: {
  label: string;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-7 ${
        highlight
          ? "border-primary/30 bg-card shadow-lg shadow-primary/10"
          : "border-border bg-card"
      }`}
    >
      {highlight && (
        <div
          aria-hidden
          className="absolute right-0 top-0 h-1 w-full bg-v-gradient"
        />
      )}
      <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
