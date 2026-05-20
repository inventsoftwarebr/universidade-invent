import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { OAuthButton } from "@/components/auth/OAuthButton";

export const metadata = {
  title: "Criar conta",
};

export default function CadastrarPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-[10%] bg-gradient-to-b from-primary to-primary-hover lg:block"
          style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 0 100%)" }}
        />
        <div className="container grid gap-12 py-12 lg:grid-cols-2 lg:gap-20">
          <div className="hidden flex-col justify-center lg:flex">
            <InventVMark className="h-16" />
            <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight">
              Crie sua conta gratuita.
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Acesso imediato aos cursos abertos. Cliente Invent? Após criar
              conta, vincule sua empresa para ver os cursos contratados.
            </p>

            <ul className="mt-10 space-y-3 text-sm text-muted-foreground">
              <Bullet>Trilhas guiadas por persona e produto SAP</Bullet>
              <Bullet>Certificados verificáveis com QR code</Bullet>
              <Bullet>AI tutor que cita timestamps das aulas</Bullet>
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Criar conta
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece em menos de 1 minuto.
              </p>

              <div className="mt-6 space-y-3">
                <OAuthButton provider="azure">
                  Continuar com Microsoft
                </OAuthButton>
                <OAuthButton provider="google">
                  Continuar com Google
                </OAuthButton>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                ou com email
                <div className="h-px flex-1 bg-border" />
              </div>

              <SignUpForm />

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Já tem conta?{" "}
                <Link href="/entrar" className="font-semibold text-primary">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        ✓
      </span>
      {children}
    </li>
  );
}
