"use client";

import { useActionState } from "react";

export function LoginForm({ action }: { action: (prev: string | null, f: FormData) => Promise<string | null> }) {
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-3">
      <input name="password" type="password" autoComplete="current-password" placeholder="Host password" className="field" required />
      {error && <p className="text-[15px] text-alert">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
    </form>
  );
}
