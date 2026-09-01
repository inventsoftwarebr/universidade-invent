import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { people } from "@/db/schema";
import { completeAuthorization, entraConfigured } from "@/lib/auth/entra";
import { setSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Retorno do Entra ID. A pessoa precisa existir em `people` — a plataforma não
 * cria conta sozinha: quem entra no time é decisão da coordenação, não do SSO.
 */
export async function GET(request: Request): Promise<Response> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  if (!entraConfigured()) return NextResponse.redirect(new URL("/entrar", base));

  const store = await cookies();
  const codeVerifier = store.get("entra_verifier")?.value;
  const state = store.get("entra_state")?.value;
  const nonce = store.get("entra_nonce")?.value;

  if (!codeVerifier || !state || !nonce) {
    return NextResponse.redirect(new URL("/entrar?erro=sessao-expirada", base));
  }

  try {
    const profile = await completeAuthorization(new URL(request.url), {
      codeVerifier,
      state,
      nonce,
    });

    const person = await db.query.people.findFirst({
      where: eq(people.email, profile.email),
    });

    if (!person || !person.active) {
      return NextResponse.redirect(new URL("/entrar?erro=sem-acesso", base));
    }

    if (person.entraObjectId !== profile.objectId) {
      await db
        .update(people)
        .set({ entraObjectId: profile.objectId })
        .where(eq(people.id, person.id));
    }

    await setSession(person.id);
  } catch {
    return NextResponse.redirect(new URL("/entrar?erro=falha-login", base));
  } finally {
    store.delete("entra_verifier");
    store.delete("entra_state");
    store.delete("entra_nonce");
  }

  return NextResponse.redirect(new URL("/", base));
}
