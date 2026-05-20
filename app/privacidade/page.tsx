import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";

export const metadata = {
  title: "Política de Privacidade",
};

export default function PrivacidadePage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          LGPD
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="mt-6 text-muted-foreground">
          Versão completa em revisão jurídica. A versão final cobrirá: dados
          coletados, base legal, finalidades, compartilhamento (Supabase,
          Vercel, Bunny, Resend, HubSpot, OpenAI, Anthropic), transferência
          internacional, retenção, direitos do titular (acesso, retificação,
          exclusão em <code className="text-primary">/me/excluir-conta</code>,
          portabilidade em <code className="text-primary">/me/dados</code>),
          uso de cookies e contato do DPO.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
