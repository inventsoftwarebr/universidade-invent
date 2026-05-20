import Link from "next/link";
import { InventLogo, InventVMark } from "@/components/brand/InventLogo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="Universidade Invent">
            <div className="flex items-center gap-3">
              <InventLogo className="h-7" />
              <span className="hidden text-sm font-medium text-muted-foreground md:inline">
                Universidade
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium md:gap-4">
            <Link
              href="/cursos"
              className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground md:inline-block"
            >
              Cursos
            </Link>
            <Link
              href="/sobre"
              className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground md:inline-block"
            >
              Sobre
            </Link>
            <Link
              href="/entrar"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary-hover"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Faixa diagonal vermelha à esquerda — motivo do manual */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 hidden h-full w-[14%] bg-gradient-to-b from-primary to-primary-hover lg:block"
          style={{ clipPath: "polygon(0 0, 100% 0, 60% 100%, 0 100%)" }}
        />
        {/* V invent gigante decorativo à direita */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-12 hidden opacity-[0.06] lg:block"
        >
          <InventVMark className="h-[480px] w-auto" />
        </div>

        <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8 lg:pl-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <InventVMark className="h-3.5 w-auto" />
              Plataforma oficial Invent Software
            </span>

            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight-display md:text-6xl lg:text-7xl">
              Domine os addons{" "}
              <span className="text-invent-gradient">SAP da Invent</span>.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Cursos oficiais sobre nossas soluções fiscais, financeiras e de
              contratos para SAP Business One e SAP S/4HANA Cloud ERP. Para
              clientes, parceiros e profissionais que querem ir mais fundo.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
              >
                Explorar cursos
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/entrar"
                className="rounded-md border border-border bg-background px-6 py-3 font-semibold text-foreground transition hover:bg-muted"
              >
                Já tenho conta
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckIcon /> SAP Business One
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> SAP S/4HANA Cloud ERP
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> ISV 3x certificada
              </span>
            </div>
          </div>

          {/* Card decorativo de "destaque" mostrando a estética dos cursos */}
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 rounded-2xl bg-invent-gradient opacity-20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                <div className="relative aspect-video bg-gradient-to-br from-[#1F1F26] to-[#0E0E13]">
                  <InventVMark className="absolute right-6 top-6 h-12 opacity-90" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      ▶
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-white/60">Curso em destaque</div>
                      <div className="font-semibold text-white">
                        Apuração fiscal com TaxPlus
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">
                      Gestão Fiscal · Intermediário
                    </span>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent-foreground">
                      3h 40min
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[40%] rounded-full bg-invent-gradient" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você está no módulo 2 de 5 · próxima aula: <em>SPED Fiscal</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="border-y border-border bg-background-subtle">
        <div className="container py-16 md:py-20">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Trilhas de conhecimento
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Aprenda pelo seu domínio.
              </h2>
            </div>
            <Link
              href="/cursos"
              className="hidden text-sm font-semibold text-primary hover:text-primary-hover md:inline-flex"
            >
              Ver todas as trilhas →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CategoryCard
              title="SAP"
              subtitle="Fundamentos do B1 e S/4HANA Cloud"
              count="12 cursos"
              accent="primary"
            />
            <CategoryCard
              title="Gestão Fiscal"
              subtitle="TaxPlus, SPED, NF-e, NFS-e"
              count="9 cursos"
              accent="accent"
            />
            <CategoryCard
              title="Financeiro & Bancário"
              subtitle="BankPlus, conciliação, CNAB"
              count="7 cursos"
              accent="primary-soft"
            />
            <CategoryCard
              title="Contratos"
              subtitle="ContractPlus, faturamento recorrente"
              count="5 cursos"
              accent="accent-soft"
            />
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
            label="Parceiros"
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

      {/* Footer */}
      <footer className="border-t border-border bg-background-subtle">
        <div className="container flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
          <div className="space-y-2">
            <InventLogo className="h-6" />
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Invent Software · Universidade Invent
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/sobre" className="hover:text-foreground">
              Sobre
            </Link>
            <Link href="/cursos" className="hover:text-foreground">
              Cursos
            </Link>
            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos
            </Link>
            <a
              href="https://inventsoftware.com.br"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              inventsoftware.com.br ↗
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="text-primary"
    >
      <path
        d="M3 8.5l3 3 6.5-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryCard({
  title,
  subtitle,
  count,
  accent,
}: {
  title: string;
  subtitle: string;
  count: string;
  accent: "primary" | "accent" | "primary-soft" | "accent-soft";
}) {
  const barColor =
    accent === "primary"
      ? "bg-primary"
      : accent === "primary-soft"
        ? "bg-primary-soft"
        : accent === "accent"
          ? "bg-accent"
          : "bg-accent-soft";
  return (
    <Link
      href="/cursos"
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md"
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${barColor}`} />
      <div className="pl-2">
        <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">{count}</span>
          <span className="text-primary opacity-0 transition group-hover:opacity-100">
            Acessar →
          </span>
        </div>
      </div>
    </Link>
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
          ? "border-primary/30 bg-card shadow-lg shadow-primary/5"
          : "border-border bg-card"
      }`}
    >
      {highlight && (
        <div
          aria-hidden
          className="absolute right-0 top-0 h-1 w-full bg-invent-gradient"
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
