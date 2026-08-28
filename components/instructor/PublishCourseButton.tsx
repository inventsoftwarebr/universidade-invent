"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";
import { publishCourse } from "@/lib/instructor/actions";
import type { PublishIssue } from "@/lib/instructor/publish-checks";

/**
 * Publicar mostra o motivo quando não dá. Antes a action publicava qualquer
 * coisa; agora ela recusa e devolve a lista de pendências.
 */
export function PublishCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [blockers, setBlockers] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<PublishIssue[]>([]);

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await publishCourse(courseId);
            if (!result.ok) {
              setBlockers(Object.values(result.fieldErrors ?? {}));
              setWarnings([]);
              return;
            }
            setBlockers([]);
            setWarnings(result.data.warnings);
            router.refresh();
          })
        }
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Publicando..." : "Publicar"}
      </button>

      {blockers.length > 0 ? (
        <div
          role="alert"
          className="max-w-sm rounded-md border border-accent/40 bg-accent/5 p-3 text-left"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Resolva antes de publicar
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {blockers.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div
          role="status"
          className="max-w-sm rounded-md border border-border bg-background-subtle p-3 text-left"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Publicado, com pontos de atenção
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {warnings.map((w) => (
              <li key={w.code + (w.where ?? "")}>{w.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
