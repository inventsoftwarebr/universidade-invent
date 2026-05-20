import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";

export const metadata = {
  title: "Termos de Uso",
};

export default function TermosPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Termos
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
          Termos de Uso
        </h1>
        <p className="mt-6 text-muted-foreground">
          Versão completa em revisão jurídica. Cobrirá: aceite, conta e
          credenciais, propriedade intelectual dos cursos, uso permitido,
          condutas vedadas, suspensão e exclusão, certificados, limitação de
          responsabilidade, foro.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
