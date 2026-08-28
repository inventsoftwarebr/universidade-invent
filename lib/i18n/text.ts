/**
 * Colunas `*_i18n` são jsonb no formato `{ "pt-BR": "...", "en": "..." }`.
 * Enquanto o MVP é só pt-BR, a leitura já cai para qualquer idioma presente
 * em vez de renderizar vazio.
 */
export function ptBR(json: unknown, fallback = ""): string {
  if (!json || typeof json !== "object") return fallback;
  const obj = json as Record<string, unknown>;
  const candidates = [obj["pt-BR"], obj.en, ...Object.values(obj)];
  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return fallback;
}

/** `9600` → `"2h 40min"`. Usado em cards de curso e no player. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

/** `220` (minutos) → `"3h 40min"`. */
export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  return formatDuration(minutes * 60);
}

/** Relógio do player: `3725` → `"1:02:05"`, `65` → `"1:05"`. */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
