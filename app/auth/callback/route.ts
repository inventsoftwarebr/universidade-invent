/**
 * Callback de OAuth (Google, Microsoft) e de confirmação de signup por email.
 *
 * Supabase redireciona pra cá com `?code=...`. Trocamos o code por sessão e
 * encaminhamos pra área do papel do usuário (admin/instrutor/aluno).
 *
 * Importante: NÃO setar runtime = "edge" — usa @supabase/ssr que precisa
 * do Node runtime para cookies.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { postLoginPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/entrar?error=oauth_failed`);
  }

  const dest = nextParam ?? (await postLoginPath(supabase));
  return NextResponse.redirect(`${origin}${dest}`);
}
