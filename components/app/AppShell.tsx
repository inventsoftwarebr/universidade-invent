import Link from "next/link";
import { InventLogo, InventVMark } from "@/components/brand/InventLogo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { cn } from "@/lib/utils";
import type { CurrentUser, Role } from "@/lib/auth/require-role";

type NavItem = { label: string; href: string; icon: keyof typeof ICONS };

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { label: "Visão geral", href: "/admin", icon: "dashboard" },
    { label: "Cursos", href: "/admin/cursos", icon: "library" },
    { label: "Usuários", href: "/admin/usuarios", icon: "users" },
    { label: "Categorias", href: "/admin/categorias", icon: "tag" },
  ],
  instrutor: [
    { label: "Meus cursos", href: "/instrutor", icon: "library" },
    { label: "Aulas", href: "/instrutor/aulas", icon: "play" },
    { label: "Alunos", href: "/instrutor/alunos", icon: "users" },
  ],
  aluno: [
    { label: "Início", href: "/aprender", icon: "home" },
    { label: "Catálogo", href: "/cursos", icon: "library" },
    { label: "Meus cursos", href: "/aprender/meus", icon: "grad" },
    { label: "Trilhas", href: "/aprender/trilhas", icon: "route" },
    { label: "Certificados", href: "/aprender/certificados", icon: "award" },
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
    <div className="grid min-h-screen bg-background-subtle lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-1.5 border-r border-border bg-card px-4 py-5 lg:flex">
        <Link
          href="/"
          aria-label="Universidade Invent"
          className="flex flex-col gap-1.5 border-b border-border pb-4"
        >
          <InventLogo className="h-6 self-start" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Universidade
          </span>
        </Link>

        <nav className="mt-3 flex flex-col gap-0.5">
          {nav.map((item) => {
            const active =
              activePath === item.href ||
              (item.href !== "/" && activePath.startsWith(`${item.href}/`));
            const Icon = ICONS[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-accent-soft text-invent-red-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    active ? "text-accent" : "text-muted-foreground",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mini-card de trilha (decorativo, alinhado ao UI kit) */}
        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-accent/20 bg-gradient-to-br from-accent-soft to-card p-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-white">
            <ICONS.award className="h-[18px] w-[18px]" />
          </div>
          <div className="text-xs">
            <strong className="block text-foreground">Trilha SAP B1</strong>
            <span className="text-muted-foreground">3 de 8 cursos</span>
          </div>
        </div>

        {/* User */}
        <div className="mt-auto flex items-center gap-2.5 rounded-lg border border-border p-2.5">
          <Avatar name={user.fullName ?? user.email ?? "?"} />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-semibold">
              {user.fullName ?? user.email}
            </strong>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
          <SignOutButton compact />
        </div>
      </aside>

      {/* Mobile header (sidebar fica oculta) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link href="/" aria-label="Universidade Invent" className="flex items-center gap-2">
          <InventVMark className="h-7" />
          <span className="font-display text-base font-bold tracking-tight">
            Universidade
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            {ROLE_LABEL[user.role]}
          </span>
          <SignOutButton compact />
        </div>
      </header>

      <main className="min-w-0 px-5 pb-16 pt-7 lg:px-10">{children}</main>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-invent-ink text-sm font-bold text-white"
    >
      {initial}
    </div>
  );
}

/* Inline icons (Lucide-style, single-color, currentColor stroke). */
const ICONS = {
  dashboard: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  home: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5Z" />
    </svg>
  ),
  library: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 6h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
      <path d="M4 6h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4" />
      <path d="M11 4h2a1 1 0 0 1 1 1v18h-4V5a1 1 0 0 1 1-1Z" />
    </svg>
  ),
  users: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  tag: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  ),
  grad: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </svg>
  ),
  route: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  ),
  award: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14-1.5 7L12 18l5 3-1.5-7" />
    </svg>
  ),
  play: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
} as const;
