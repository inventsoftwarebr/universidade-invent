"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      aria-label="Sair"
      title="Sair"
      className={cn(
        "rounded-md border border-border bg-background font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-60",
        compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-1.5 text-xs",
      )}
    >
      {pending ? "…" : "Sair"}
    </button>
  );
}
