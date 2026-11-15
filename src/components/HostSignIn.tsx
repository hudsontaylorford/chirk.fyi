"use client";

import Link from "next/link";
import { useActionState } from "react";
import { legacySignIn, sendCode, verifyCode, type SignInState } from "@/app/host/sign-in";

/**
 * Host sign-in: email, then the 6-digit code chirk emails you. `claiming` = signed in with the old password,
 * setting up the first account; `legacy` = the old password can still claim events made before accounts.
 */
export function HostSignIn({ claiming, legacy, wrong, email: preset }: { claiming: boolean; legacy: boolean; wrong: boolean; email?: string }) {
  const [sent, send, sending] = useActionState(sendCode, { email: preset ?? "", step: "email", message: null } as SignInState);
  const [checked, check, checking] = useActionState(verifyCode, { email: "", step: "code", message: null } as SignInState);
  const onCode = sent.step === "code";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <h1 className="text-[24px] font-bold">{claiming ? "Set up your account" : "Host sign-in"}</h1>
      <p className="mt-1 text-[15px] text-soft">
        {claiming ? "Your email becomes your sign-in, and every event so far becomes yours." : "We'll email you a 6-digit code. No password."}
      </p>

      {!onCode ? (
        <form action={send} className="mt-5 space-y-3">
          <input name="email" type="email" inputMode="email" autoComplete="email" defaultValue={sent.email} placeholder="you@example.com" className="field" aria-label="Your email" autoFocus required />
          {sent.message && <p className="text-[15px] text-red-700">{sent.message}</p>}
          <button className="btn w-full" disabled={sending}>{sending ? "Sending…" : "Email me a code"}</button>
          <Agree />
        </form>
      ) : (
        <form action={check} className="mt-5 space-y-3">
          <p className="text-[15px] text-soft">{sent.message}</p>
          <input type="hidden" name="email" value={sent.email} />
          <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" className="field tracking-[0.3em]" aria-label="Code" autoFocus required />
          {checked.message && <p className="text-[15px] text-red-700">{checked.message}</p>}
          <button className="btn w-full" disabled={checking}>{checking ? "Checking…" : "Sign in"}</button>
          <p className="text-center text-[15px] text-soft">
            {sent.email} ·{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => location.reload()}>Use a different email</button>
          </p>
        </form>
      )}

      {legacy && !claiming && (
        <details className="mt-8 text-[15px]" open={wrong}>
          <summary className="cursor-pointer text-soft">Have the old host password?</summary>
          <form action={legacySignIn} className="mt-2 space-y-2">
            <input name="password" type="password" placeholder="Password" className="field" autoComplete="current-password" aria-label="Old host password" />
            {wrong && <p className="text-red-700">That&apos;s not it.</p>}
            <button className="btn btn-quiet w-full">Continue</button>
          </form>
        </details>
      )}
    </main>
  );
}

function Agree() {
  return (
    <p className="text-center text-[13px] text-soft">
      By continuing, you agree to the <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
      <Link href="/privacy" className="underline underline-offset-2">Privacy</Link> policy.
    </p>
  );
}
