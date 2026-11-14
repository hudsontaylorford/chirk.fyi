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
    <div className="rounded-2xl bg-wash p-4">
      <p className="font-semibold">Keep your link</p>
      {email && !editing ? (
        <p className="mt-0.5 text-[15px] text-soft">
          It&apos;s in your inbox at {email}. Use it to change your reply from any device.{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => setEditing(true)}>Use a different email</button>
        </p>
      ) : (
        <>
          <p className="mt-0.5 text-[15px] text-soft">This phone remembers your reply. For any other device, we&apos;ll email you the link.</p>
          <form action={action} className="mt-3 flex gap-2">
            <input name="email" type="email" inputMode="email" autoComplete="email" required defaultValue={email ?? ""} placeholder="you@example.com" className="field" aria-label="Your email" />
            <button className="btn shrink-0 px-4" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
          </form>
        </>
      )}
      {message && <p role="status" className="mt-2 text-[15px] text-soft">{message}</p>}
      <button type="button" onClick={copy} className="mt-2 text-[15px] text-soft underline underline-offset-2">
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
