import { cn } from "@/lib/utils";

type Status = "draft" | "published" | "archived";

const CONFIG: Record<Status, { label: string; className: string }> = {
  draft: {
    label: "Rascunho",
    className: "bg-muted text-muted-foreground",
  },
  published: {
    label: "Publicado",
    className: "bg-primary/15 text-invent-gold-700",
  },
  archived: {
    label: "Arquivado",
    className: "bg-accent/10 text-invent-red-700",
  },
};

export function CourseStatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
