import Link from "next/link";
import type { Health, Priority, TaskStatus } from "@/db/schema";
import { taskStatusLabel } from "@/lib/domain/rules";
import { HEALTH_LABEL } from "@/lib/domain/health";
import { daysBetween, formatDay } from "@/lib/domain/dates";

export function Farol({ health }: { health: Health }) {
  return <span className={`farol ${health}`}>{HEALTH_LABEL[health]}</span>;
}

export function StatusChip({ status }: { status: TaskStatus }) {
  return <span className={`chip st-${status}`}>{taskStatusLabel(status)}</span>;
}

export function PriorityChip({ priority }: { priority: Priority }) {
  if (priority === "p2" || priority === "p3") return null;
  return <span className={`chip pri-${priority}`}>{priority.toUpperCase()}</span>;
}

/** O prazo carrega o próprio estado: atrasado, para hoje, ou apenas a data. */
export function DueChip({
  dueDate,
  today,
  done,
}: {
  dueDate: string | null;
  today: string;
  done?: boolean;
}) {
  if (!dueDate) return <span className="chip">sem prazo</span>;
  if (done) return <span className="muted mono tnum">{formatDay(dueDate)}</span>;

  const diff = daysBetween(today, dueDate);
  if (diff < 0) {
    return (
      <span className="chip late">
        atrasado {Math.abs(diff)}d
      </span>
    );
  }
  if (diff === 0) return <span className="chip due-soon">vence hoje</span>;
  if (diff <= 2) return <span className="chip due-soon">em {diff}d</span>;
  return <span className="muted mono tnum">{formatDay(dueDate)}</span>;
}

export function PortfolioTag({ name, colorIndex }: { name: string; colorIndex: number }) {
  return (
    <span
      className="pf-tag"
      style={{ ["--pf-color" as string]: `var(--pf-${colorIndex % 6})` }}
    >
      {name}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter((part) => part.length > 2)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return <span className="avatar" aria-hidden="true">{initials}</span>;
}

export function Progress({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100);
  return (
    <div className="bar" role="img" aria-label={`${pct}% das tarefas concluídas`}>
      <i style={{ width: `${Math.max(2, pct)}%` }} />
    </div>
  );
}

export function ParentLink({
  kind,
  slug,
  title,
}: {
  kind: "projeto" | "iniciativa";
  slug: string;
  title: string;
}) {
  const href = kind === "projeto" ? `/projetos/${slug}` : `/iniciativas/${slug}`;
  return (
    <Link href={href} className="muted">
      {kind === "projeto" ? "Projeto" : "Iniciativa"}: {title}
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}
