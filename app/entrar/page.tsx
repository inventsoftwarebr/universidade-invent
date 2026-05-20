import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";
import { SignInForm } from "@/components/auth/SignInForm";
import { OAuthButton } from "@/components/auth/OAuthButton";

export const metadata = {
  title: "Entrar",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ signedUp?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        {/* Painel esquerdo dark "premium" com V-mark + gradiente discreto */}
        <div className="surface-premium hidden flex-col justify-center self-stretch px-12 py-16 text-white lg:flex lg:w-[44%]">
          <InventVMark className="h-16" />
          <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Continue de onde parou.
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/75">
            Sua trilha, seu progresso, seus certificados. A Universidade Invent
            guarda tudo isso entre cada sessão de estudo.
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Entrar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use sua conta corporativa ou seu email.
              </p>

              {params.signedUp ? (
                <div
                  role="status"
                  className="mt-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground"
                >
                  Conta criada. Confira seu email para confirmar o cadastro.
                </div>
              ) : null}

              {params.error ? (
                <div
                  role="alert"
                  className="mt-4 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent"
                >
                  Não foi possível entrar com o provedor. Tente novamente.
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                <OAuthButton provider="azure">Entrar com Microsoft</OAuthButton>
                <OAuthButton provider="google">Entrar com Google</OAuthButton>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                ou com email
                <div className="h-px flex-1 bg-border" />
              </div>

              <SignInForm />

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link href="/cadastrar" className="font-semibold text-accent">
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
