import Link from "next/link";
import { InventLogo } from "@/components/brand/InventLogo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { cn } from "@/lib/utils";
import type { CurrentUser, Role } from "@/lib/auth/require-role";

type NavItem = { label: string; href: string };

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { label: "Visão geral", href: "/admin" },
    { label: "Cursos", href: "/admin/cursos" },
    { label: "Usuários", href: "/admin/usuarios" },
    { label: "Categorias", href: "/admin/categorias" },
  ],
  instrutor: [
    { label: "Meus cursos", href: "/instrutor" },
    { label: "Aulas", href: "/instrutor/aulas" },
    { label: "Alunos", href: "/instrutor/alunos" },
  ],
  aluno: [
    { label: "Continuar", href: "/aprender" },
    { label: "Catálogo", href: "/cursos" },
    { label: "Meus certificados", href: "/aprender/certificados" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  instrutor: "Instrutor",
  aluno: "Aluno",
};

export function AppShell({
  user,
  activePath,
  children,
}: {
  user: CurrentUser;
  activePath: string;
  children: React.ReactNode;
}) {
  const nav = NAV_BY_ROLE[user.role];

  return (
    <div className="min-h-screen bg-background-subtle">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="Universidade Invent" className="shrink-0">
              <InventLogo className="h-6" />
            </Link>
            <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
              {nav.map((item) => {
                const active =
                  activePath === item.href ||
                  (item.href !== "/" && activePath.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-1.5",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-muted-foreground md:inline-flex">
              {ROLE_LABEL[user.role]}
            </span>
            <div className="flex items-center gap-2">
              <Avatar name={user.fullName ?? user.email ?? "?"} />
              <span className="hidden text-sm font-medium md:inline">
                {user.fullName ?? user.email}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden
      className="flex h-8 w-8 items-center justify-center rounded-full bg-invent-gradient text-sm font-bold text-white"
    >
      {initial}
    </div>
  );
}
