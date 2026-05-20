import Link from "next/link";

/**
 * Home placeholder — sem identidade visual definitiva ainda.
 * Substituir quando o design system chegar (docs/design-system.md).
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Universidade Invent
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/cursos" className="text-muted-foreground hover:text-foreground">
              Cursos
            </Link>
            <Link href="/sobre" className="text-muted-foreground hover:text-foreground">
              Sobre
            </Link>
            <Link
              href="/entrar"
              className="rounded-md bg-primary px-4 py-1.5 text-primary-foreground hover:opacity-90"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <section className="container py-24">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Plataforma de educação Invent Software
          </p>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
            Aprenda a operar os addons SAP da Invent.
          </h1>
          <p className="text-lg text-muted-foreground">
            Cursos oficiais sobre nossas soluções fiscais, financeiras e de
            contratos para SAP Business One e SAP S/4HANA Cloud ERP. Para
            clientes, parceiros e profissionais que querem dominar SAP.
          </p>
          <div className="flex gap-4">
            <Link
              href="/cursos"
              className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
            >
              Explorar cursos
            </Link>
            <Link
              href="/entrar"
              className="rounded-md border border-border px-6 py-3 font-medium hover:bg-muted"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-8 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Invent Software. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
