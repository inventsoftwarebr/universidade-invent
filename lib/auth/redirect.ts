import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Roteia o usuário para a home da sua área conforme o papel:
 * admin → /admin, instrutor → /instrutor, aluno → /aprender.
 *
 * Caller decide quando chamar (após signin bem-sucedido).
 */
export async function postLoginPath(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/entrar";

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  switch (data?.role) {
    case "admin":
      return "/admin";
    case "instrutor":
      return "/instrutor";
    default:
      return "/aprender";
  }
}
