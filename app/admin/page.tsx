import { requireRole } from "@/lib/auth/require-role";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const user = await requireRole(["admin"]);
  return (
    <div className="container py-10 md:py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Console admin
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
        Visão geral da Universidade
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Logado como <span className="font-semibold">{user.fullName ?? user.email}</span>.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cursos publicados" value="—" />
        <Stat label="Alunos ativos" value="—" />
        <Stat label="Certificados emitidos" value="—" />
        <Stat label="Watch time (mês)" value="—" />
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Console admin completo chega na semana 8 do MVP.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Após o pipeline de autoria (semana 3), catálogo (semana 4) e
          certificados (semana 6), o admin vê tudo aqui: usuários,
          empresas, cursos, categorias, drains de webhook, sync HubSpot.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-tight">
        {value}
      </div>
    </div>
  );
}
