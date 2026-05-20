import type { Metadata } from "next";
import { Barlow, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/*
 * Tipografia oficial Invent:
 *   - Barlow (display) substituindo Le Havre (Adobe Fonts)
 *   - Inter (body)
 *   - JetBrains Mono (code/durations no player)
 */
const barlow = Barlow({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Universidade Invent",
    template: "%s · Universidade Invent",
  },
  description:
    "Cursos oficiais da Invent Software sobre nossos addons TaxPlus, BankPlus, ContractPlus e Invent Payroll para SAP Business One e SAP S/4HANA Cloud ERP.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${barlow.variable} ${mono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
