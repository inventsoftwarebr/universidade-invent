import { requireRole } from "@/lib/auth/require-role";
import { InventVMark } from "@/components/brand/InventLogo";

export const metadata = { title: "Instrutor" };

export default async function InstrutorHomePage() {
  const user = await requireRole(["admin", "instrutor"]);
  const firstName = user.fullName?.split(" ")[0] ?? "instrutor";
  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Autoria de cursos
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Olá, {firstName}. Seus cursos.
          </h1>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          {user.email}
        </div>
      </header>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <InventVMark className="mx-auto h-10" />
        <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
          Editor de curso chega na semana 3 do MVP.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Criar curso, módulos, aulas, upload direto pro Bunny via TUS, drafts
          e scheduled publish — tudo aqui.
        </p>
      </section>
    </div>
  );
}
