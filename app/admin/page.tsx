import { requireRole } from "@/lib/auth/require-role";
import { InventVMark } from "@/components/brand/InventLogo";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const user = await requireRole(["admin"]);
  const firstName = user.fullName?.split(" ")[0] ?? "admin";
  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Console admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Olá, {firstName}. Visão geral.
          </h1>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          {user.email}
        </div>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cursos publicados" value="—" />
        <Stat label="Alunos ativos" value="—" />
        <Stat label="Certificados emitidos" value="—" />
        <Stat label="Watch time (mês)" value="—" />
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <InventVMark className="mx-auto h-10" />
        <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
          Console admin completo chega na semana 8 do MVP.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Após pipeline de autoria (s3), catálogo (s4) e certificados (s6), o
          admin vê tudo aqui: usuários, empresas, cursos, drains de webhook,
          sync HubSpot.
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
