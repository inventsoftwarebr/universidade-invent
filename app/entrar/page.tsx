import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";

export default function EntrarPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        {/* Faixa diagonal vermelha */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 hidden h-full w-[10%] bg-gradient-to-b from-primary to-primary-hover lg:block"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%, 0 100%)" }}
        />
        <div className="container grid gap-12 py-16 lg:grid-cols-2 lg:gap-20">
          <div className="hidden flex-col justify-center lg:flex lg:pl-12">
            <InventVMark className="h-16" />
            <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight">
              Continue de onde parou.
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Sua trilha, seu progresso, seus certificados. A Universidade
              Invent guarda tudo isso entre cada sessão de estudo.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Entrar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use sua conta corporativa ou cadastre-se em segundos.
              </p>

              <div className="mt-6 space-y-3">
                <AuthButton provider="microsoft">
                  Entrar com Microsoft
                </AuthButton>
                <AuthButton provider="google">Entrar com Google</AuthButton>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                ou com email
                <div className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Email corporativo
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="voce@empresa.com.br"
                    disabled
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    disabled
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
                >
                  Entrar
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Login funcional entra na semana 2 do MVP.
                <br />
                Ainda não tem conta?{" "}
                <Link href="/entrar" className="font-semibold text-primary">
                  Cadastrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function AuthButton({
  provider,
  children,
}: {
  provider: "microsoft" | "google";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
    >
      {provider === "microsoft" ? <MicrosoftIcon /> : <GoogleIcon />}
      {children}
    </button>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <rect x="1" y="1" width="7.5" height="7.5" fill="#F25022" />
      <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00" />
      <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.92v2.32A9 9 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.3-1.72V4.96H.92A9 9 0 000 9c0 1.45.35 2.83.92 4.04l3.06-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.88 11.42 0 9 0A9 9 0 00.92 4.96L3.98 7.28C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
