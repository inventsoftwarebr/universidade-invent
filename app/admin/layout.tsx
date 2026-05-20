import { headers } from "next/headers";
import { AppShell } from "@/components/app/AppShell";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["admin"]);
  const h = await headers();
  const path = h.get("x-pathname") ?? "/admin";
  return (
    <AppShell user={user} activePath={path}>
      {children}
    </AppShell>
  );
}
