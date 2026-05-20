import { requireRole } from "@/lib/auth/require-role";

export const metadata = { title: "Instrutor" };

export default async function InstrutorHomePage() {
  const user = await requireRole(["admin", "instrutor"]);
  return (
    <div className="container py-10 md:py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Autoria de cursos
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
        Meus cursos
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Logado como <span className="font-semibold">{user.fullName ?? user.email}</span>.
      </p>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Editor de curso chega na semana 3 do MVP.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Criar curso, módulos, aulas, upload direto pro Bunny via TUS,
          drafts, scheduled publish. Tudo aqui.
        </p>
      </section>
    </div>
  );
}
