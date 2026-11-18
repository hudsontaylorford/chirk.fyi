"use client";

import { useActionState, useState } from "react";
import { emailMyReply } from "@/app/actions";

/**
 * "Keep your link": one card after replying. With an email on the reply it says where the link went;
 * without one, it asks for an email (the easiest way back from any device), with copying as the fallback.
 */
export function KeepLink({ slug, token, email }: { slug: string; token: string; email: string | null }) {
  const [message, action, pending] = useActionState(emailMyReply.bind(null, slug, token), null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(!email);
  async function copy() {
    await navigator.clipboard.writeText(`${location.origin}/${slug}/r/${token}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <h2 className="text-[17px] font-semibold">Keep your link</h2>
      {email && !editing ? (
        <p className="mt-0.5 text-[15px] text-soft">
          It&apos;s in your inbox at {email}. Use it to change your reply from any device.{" "}
          <button type="button" className="link" onClick={() => setEditing(true)}>Use a different email</button>
        </p>
      ) : (
        <>
          <p className="mt-0.5 text-[15px] text-soft">Email yourself the link to change your reply from another device.</p>
          <form action={action} className="mt-3 flex flex-wrap gap-2">
            <input name="email" type="email" inputMode="email" autoComplete="email" required defaultValue={email ?? ""} placeholder="you@example.com" className="field min-w-0 flex-[1_1_10rem]" aria-label="Your email" />
            <button className="button-quiet shrink-0 min-h-[3.2rem]" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
          </form>
        </>
      )}
      {message && <p role="status" className="mt-2 text-[15px] text-soft">{message}</p>}
      <button type="button" onClick={copy} className="link tap text-[15px]">
        {copied ? "Copied ✓" : "Copy the link instead"}
      </button>
    </div>
  );
}

/** Host view: copy someone's private link to send them. */
export function CopyLink({ path, label = "Copy link" }: { path: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button" className="underline underline-offset-2"
      onClick={async () => {
        await navigator.clipboard.writeText(location.origin + path).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}
