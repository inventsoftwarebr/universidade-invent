import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser, authMode } from "@/lib/auth";
import { sair } from "./actions";
import { Avatar } from "@/components/ui";

export const metadata: Metadata = {
  title: "InventFlow — Marketing Invent Software",
  description:
    "Projetos, iniciativas e relatórios do departamento de Marketing da Invent Software.",
};

const NAV = [
  { href: "/", label: "Minha Semana" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/iniciativas", label: "Iniciativas" },
  { href: "/relatorios", label: "Relatórios" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        {user ? (
          <header className="topbar">
            <div className="topbar-inner">
              <Link href="/" className="brand">
                InventFlow<span>Marketing</span>
              </Link>
              <nav className="mainnav">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="whoami">
                <Avatar name={user.name} />
                <span>
                  {user.name}
                  {authMode() === "piloto" ? " · piloto" : ""}
                </span>
                <form action={sair}>
                  <button className="ghost small" type="submit">
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </header>
        ) : null}
        {children}
      </body>
    </html>
  );
}
