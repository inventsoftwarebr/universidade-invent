/**
 * Regras puras de progresso — sem acesso a banco, para poderem ser testadas
 * e usadas tanto no servidor quanto no client.
 */

/**
 * Uma matrícula concluída continua dando acesso ao curso — o aluno revê
 * aulas e baixa o certificado. Só `expired`/`cancelled` tiram o acesso.
 */
export const ACCESSIBLE_ENROLLMENT_STATUSES = ["active", "completed"] as const;

/** Percentual inteiro de aulas concluídas. Fonte única do número. */
export function computeProgressPct(
  completedLessons: number,
  totalLessons: number,
): number {
  if (totalLessons <= 0) return 0;
  const pct = Math.round((completedLessons / totalLessons) * 100);
  return Math.min(100, Math.max(0, pct));
}
