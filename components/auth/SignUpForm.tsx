"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpWithPassword, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = {};

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpWithPassword, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="fullName"
          className="block text-xs font-semibold text-foreground"
        >
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          aria-invalid={!!state?.fieldErrors?.fullName}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {state?.fieldErrors?.fullName ? (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.fullName}
          </p>
        ) : null}
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={!!state?.fieldErrors?.password}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Mínimo 8 caracteres.
        </p>
        {state?.fieldErrors?.password ? (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="font-semibold text-primary">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="font-semibold text-primary">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {state?.fieldErrors?.acceptTerms ? (
        <p className="text-xs text-destructive">
          {state.fieldErrors.acceptTerms}
        </p>
      ) : null}

      {state?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton>Criar conta</SubmitButton>
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
      {pending ? "Criando conta…" : children}
    </button>
  );
}
