import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client para Client Components.
 *
 * Singleton por sessão de browser. Não usar em código server-side.
 * Ver CLAUDE.md §2.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
