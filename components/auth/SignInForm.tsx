"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithPassword, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = {};

export function SignInForm() {
  const [state, formAction] = useActionState(signInWithPassword, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-foreground"
        >
          Email corporativo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@empresa.com.br"
          aria-invalid={!!state?.fieldErrors?.email}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {state?.fieldErrors?.email ? (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-foreground"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          aria-invalid={!!state?.fieldErrors?.password}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {state?.fieldErrors?.password ? (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Entrando…" : children}
    </button>
  );
}
