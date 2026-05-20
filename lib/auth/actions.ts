"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  oauthProviderSchema,
  signInSchema,
  signUpSchema,
  type OAuthProvider,
} from "@/lib/auth/schemas";
import { postLoginPath } from "@/lib/auth/redirect";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Login email/senha. Em sucesso, redireciona para a home do papel.
 * Em falha, retorna estado para o form exibir.
 */
export async function signInWithPassword(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email ou senha incorretos." };
  }

  const dest = await postLoginPath(supabase);
  redirect(dest);
}

/**
 * Signup email/senha. Por default cria como `aluno` (subtype `lead`)
 * via trigger handle_new_user(). Subtype real é determinado por
 * onboarding ou matching com HubSpot.
 */
export async function signUpWithPassword(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // Supabase, por default, exige confirmação por email.
  redirect("/entrar?signedUp=1");
}

export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  const parsedProvider = oauthProviderSchema.parse(provider);
  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsedProvider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/entrar?error=oauth_failed");
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

function flattenZodErrors(err: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
