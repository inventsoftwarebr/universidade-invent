import Link from "next/link";
import { InventLogo } from "@/components/brand/InventLogo";

export function SiteHeader() {
  return (
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
  );
}

export function SiteFooter() {
  return (
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
  );
}
