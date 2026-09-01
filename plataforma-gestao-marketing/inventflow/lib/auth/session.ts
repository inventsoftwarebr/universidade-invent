import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sessão em cookie assinado (HMAC-SHA256). Não guarda nada além do id da
 * pessoa e do vencimento — a autoridade sobre quem é quem continua sendo o
 * banco, e no modo `entra`, o Microsoft Entra ID.
 */

const COOKIE = "inventflow_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET ausente ou curta demais (mínimo 32 caracteres). Veja .env.example.",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function setSession(personId: string): Promise<void> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${personId}.${expiresAt}`;
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function readSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot < 0) return null;

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload))) return null;

  const [personId, expiresAt] = payload.split(".");
  if (!personId || !expiresAt) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return personId;
}
