import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";
import { InventVMark } from "@/components/brand/InventLogo";

export const metadata = { title: "Aprender" };

export default async function AprenderHomePage() {
  const user = await requireUser();
  const firstName = user.fullName?.split(" ")[0] ?? "estudante";

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Olá, {firstName}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Continue de onde você parou.
          </h1>
        </div>
        <Link
          href="/cursos"
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          Ver catálogo →
        </Link>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <EmptyContinueCard />
        <NextStepsCard />
      </section>
    </div>
  );
}

function EmptyContinueCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <InventVMark className="mx-auto h-10 opacity-60" />
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
        Você ainda não começou nenhum curso.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Quando você iniciar uma aula, ela aparece aqui para retomar com 1
        clique. A área do aluno fica completa na semana 4 do MVP.
      </p>
      <Link
        href="/cursos"
        className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Explorar cursos
      </Link>
    </div>
  );
}

function NextStepsCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-base font-bold tracking-tight">
        Próximos passos
      </h3>
      <ul className="mt-4 space-y-3 text-sm">
        <Step label="Complete seu perfil" href="/aprender/perfil" disabled />
        <Step
          label="Vincular empresa (se cliente Invent)"
          href="/aprender/empresa"
          disabled
        />
        <Step label="Preferências de notificação" href="/me" disabled />
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Estas rotas chegam na semana 8 (hardening + LGPD).
      </p>
    </div>
  );
}

function Step({
  label,
  href,
  disabled,
}: {
  label: string;
  href: string;
  disabled?: boolean;
}) {
  return (
    <li>
      <span
        className={
          disabled
            ? "block rounded-md border border-dashed border-border px-3 py-2 text-muted-foreground"
            : "block rounded-md border border-border px-3 py-2 hover:bg-muted"
        }
      >
        {label}
        {disabled ? <span className="ml-2 text-xs">(em breve)</span> : null}
      </span>
      {/* href kept for future enablement */}
      <span className="sr-only">{href}</span>
    </li>
  );
}
