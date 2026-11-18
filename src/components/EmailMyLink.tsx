"use client";

import { useActionState } from "react";
import { emailMyLink } from "@/app/actions";

/** "Already replied?": a quiet link under the form that sends the private link to the email on their reply. */
export function EmailMyLink({ slug }: { slug: string }) {
  const [message, action, pending] = useActionState(emailMyLink.bind(null, slug), null);
  return (
    <details className="text-[16px]">
      <summary className="link tap cursor-pointer list-none [&::-webkit-details-marker]:hidden">Already replied? Email me my link</summary>
      <form action={action} className="mt-2 flex gap-2">
        <input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="you@example.com" className="field" aria-label="Your email" />
        <button className="button-quiet shrink-0 min-h-[3.2rem]" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
      </form>
      {message && <p role="status" className="mt-2 text-[15px] text-soft">{message}</p>}
      <p className="mt-2 text-[14px] text-soft">Works if you added your email when you replied.</p>
    </details>
  );
}
