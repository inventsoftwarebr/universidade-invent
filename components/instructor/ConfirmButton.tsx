"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Botão destrutivo em dois toques: o primeiro arma, o segundo envia o form.
 *
 * Remover um módulo apaga em cascade todas as aulas dele — um clique
 * acidental custava trabalho de gravação. Sem `window.confirm` porque ele
 * bloqueia a thread e não dá para estilizar.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  ariaLabel,
}: {
  label: string;
  confirmLabel: string;
  ariaLabel: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Desarma sozinho, para o botão não ficar "quente" indefinidamente.
  useEffect(() => {
    if (!armed) return;
    timer.current = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer.current);
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setArmed(true)}
        className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-accent/10 hover:text-accent"
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="submit"
      aria-label={`${ariaLabel} — confirmar`}
      className="rounded-md border border-accent bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
    >
      {confirmLabel}
    </button>
  );
}
