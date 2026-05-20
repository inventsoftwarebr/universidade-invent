"use client";

import { useTransition } from "react";
import { signInWithOAuth } from "@/lib/auth/actions";
import type { OAuthProvider } from "@/lib/auth/schemas";

export function OAuthButton({
  provider,
  children,
}: {
  provider: OAuthProvider;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signInWithOAuth(provider))}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
    >
      {provider === "azure" ? <MicrosoftIcon /> : <GoogleIcon />}
      <span>{pending ? "Redirecionando…" : children}</span>
    </button>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <rect x="1" y="1" width="7.5" height="7.5" fill="#F25022" />
      <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00" />
      <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.92v2.32A9 9 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.3-1.72V4.96H.92A9 9 0 000 9c0 1.45.35 2.83.92 4.04l3.06-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.88 11.42 0 9 0A9 9 0 00.92 4.96L3.98 7.28C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
