import { headers } from "next/headers";
import { AppShell } from "@/components/app/AppShell";
import { requireUser } from "@/lib/auth/require-role";

export default async function AprenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const h = await headers();
  const path = h.get("x-pathname") ?? "/aprender";
  return (
    <AppShell user={user} activePath={path}>
      {children}
    </AppShell>
  );
}
