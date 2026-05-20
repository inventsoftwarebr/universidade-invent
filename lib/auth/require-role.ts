import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Role = "admin" | "instrutor" | "aluno";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Role;
};

/**
 * Carrega o usuário autenticado e seu perfil. Redireciona para /entrar
 * se não houver sessão. Use em qualquer layout/page logado.
 */
export async function requireUser(): Promise<CurrentUser> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as Role | undefined) ?? "aluno",
  };
}

/**
 * Como `requireUser`, mas além disso garante que o role esteja na lista
 * permitida. Sem acesso → redireciona para a home do papel real do usuário.
 */
export async function requireRole(allowed: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect(homePathForRole(user.role));
  }
  return user;
}

export function homePathForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "instrutor":
      return "/instrutor";
    default:
      return "/aprender";
  }
}
