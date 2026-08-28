"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { completeLesson } from "@/lib/learn/actions";

export function CompleteLessonButton({
  enrollmentId,
  lessonId,
  alreadyCompleted,
  nextHref,
}: {
  enrollmentId: string;
  lessonId: string;
  alreadyCompleted: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (alreadyCompleted) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md bg-invent-gold-50 px-4 py-2.5 text-sm font-semibold text-invent-gold-700">
        <Check className="h-4 w-4" aria-hidden="true" />
        Aula concluída
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await completeLesson({ enrollmentId, lessonId });
            if (!result.ok) {
              setError("Não foi possível concluir a aula. Tente de novo.");
              return;
            }
            setError(null);
            if (nextHref) {
              router.push(nextHref);
            } else {
              router.refresh();
            }
          })
        }
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {pending ? "Salvando..." : "Marcar como concluída"}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-invent-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
