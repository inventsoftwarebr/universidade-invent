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
        <div className="surface-premium hidden flex-col justify-center self-stretch px-12 py-16 text-white lg:flex lg:w-[44%]">
          <InventVMark className="h-16" />
          <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Crie sua conta gratuita.
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/75">
            Acesso imediato aos cursos abertos. Cliente Invent? Vincule sua
            empresa após criar conta e libere os cursos contratados.
          </p>

          <ul className="mt-10 space-y-3 text-sm text-white/75">
            <Bullet>Trilhas guiadas por persona e produto SAP</Bullet>
            <Bullet>Certificados verificáveis com QR code</Bullet>
            <Bullet>AI tutor que cita timestamps das aulas</Bullet>
          </ul>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
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
                <Link href="/entrar" className="font-semibold text-accent">
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
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-invent-gold-300"
      >
        ✓
      </span>
      {children}
    </li>
  );
}
