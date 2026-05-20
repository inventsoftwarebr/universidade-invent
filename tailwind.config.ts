import type { Config } from "tailwindcss";

/**
 * Tailwind config aliased aos tokens semânticos do design system Invent.
 * Cores brand (--invent-*) ficam disponíveis no `colors.invent.*` para uso
 * em casos onde precisamos da cor literal (badges de produto, ilustrações,
 * gradientes específicos), mas componentes UI devem preferir as classes
 * semânticas (`bg-primary`, `text-accent`, etc).
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-subtle": "hsl(var(--background-subtle))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          soft: "hsl(var(--primary-soft))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          soft: "hsl(var(--accent-soft))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Paleta Invent literal — uso quando precisamos da cor exata
        invent: {
          black: "#0a0a0b",
          ink: "#1f1f23",
          white: "#ffffff",
          red: {
            50: "#ffedee",
            100: "#ffd0d2",
            500: "#d81e2d",
            600: "#b81825",
            700: "#8e121c",
          },
          gold: {
            50: "#fff8e0",
            100: "#ffecb3",
            300: "#ffc246",
            400: "#ffb000",
            500: "#f7a600",
            600: "#d08800",
            700: "#a06600",
          },
          purple: {
            100: "#dcd3f2",
            500: "#4527a0",
            700: "#2e1a6b",
          },
          gray: {
            700: "#4b5566",
            500: "#8b92a0",
            300: "#cdd2da",
            100: "#eef0f3",
            50: "#f7f8fa",
          },
        },
        // Cores semânticas por produto (BankPlus/ContractPlus/TaxPlus)
        product: {
          tax: "#4527a0",
          bank: "#f7a600",
          contract: "#d81e2d",
          payroll: "#4b5566",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "var(--radius)", // 8px
        xl: "12px",
        "2xl": "16px",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(10, 10, 11, 0.06)",
        sm: "0 1px 3px rgba(10, 10, 11, 0.08), 0 1px 2px rgba(10, 10, 11, 0.04)",
        md: "0 4px 12px rgba(10, 10, 11, 0.08), 0 2px 4px rgba(10, 10, 11, 0.04)",
        lg: "0 12px 32px rgba(10, 10, 11, 0.12), 0 4px 8px rgba(10, 10, 11, 0.06)",
        xl: "0 24px 64px rgba(10, 10, 11, 0.18), 0 8px 16px rgba(10, 10, 11, 0.08)",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
