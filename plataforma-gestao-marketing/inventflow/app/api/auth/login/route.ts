import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { entraConfigured, startAuthorization } from "@/lib/auth/entra";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  if (!entraConfigured()) {
    return NextResponse.redirect(new URL("/entrar", process.env.APP_URL ?? "http://localhost:3000"));
  }

  const { url, codeVerifier, state, nonce } = await startAuthorization();
  const store = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  };
  store.set("entra_verifier", codeVerifier, options);
  store.set("entra_state", state, options);
  store.set("entra_nonce", nonce, options);

  return NextResponse.redirect(url);
}
