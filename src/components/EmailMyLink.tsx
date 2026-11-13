"use client";

import { useActionState } from "react";
import { emailMyLink } from "@/app/actions";

/** "Already replied?": sends the private link to the email on their reply. */
export function EmailMyLink({ slug }: { slug: string }) {
  const [message, action, pending] = useActionState(emailMyLink.bind(null, slug), null);
  return (
    <details className="rounded-2xl bg-wash p-4">
      <summary className="text-[16px] font-semibold">Already replied? Email me my link</summary>
      <form action={action} className="mt-3 flex gap-2">
        <input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="you@example.com" className="field" />
        <button className="btn shrink-0" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
      </form>
      {message && <p role="status" className="mt-2 text-[15px] text-soft">{message}</p>}
      <p className="mt-2 text-[14px] text-soft">Works if you added your email when you replied. Otherwise, ask the host to resend it.</p>
    </details>
  );
}
