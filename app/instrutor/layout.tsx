import { headers } from "next/headers";
import { AppShell } from "@/components/app/AppShell";
import { requireRole } from "@/lib/auth/require-role";

export default async function InstrutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["admin", "instrutor"]);
  const h = await headers();
  const path = h.get("x-pathname") ?? "/instrutor";
  return (
    <AppShell user={user} activePath={path}>
      {children}
    </AppShell>
  );
}
