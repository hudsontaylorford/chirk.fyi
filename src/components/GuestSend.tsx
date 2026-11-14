"use client";

import { useActionState, useEffect, useState } from "react";
import { reminderText } from "@/lib/guests";
import { inviteEmail } from "@/lib/invite-email";
import type { Event } from "@/lib/types";
import { imageLoads } from "./Cover";
import { copyRich } from "./CopyInvite";

type Send = (prev: string | null, f: FormData) => Promise<string>;

/**
 * "Send ›" on a guest who hasn't answered: email them their invite or a reminder (from chirk),
 * or copy a personal email, their link, or a reminder text to send yourself.
 */
export function GuestSend({ event, token, names, email, emailInvite, emailReminder }: {
  event: Event; token: string; names: string; email: string | null; emailInvite: Send; emailReminder: Send;
}) {
  const [invited, invite, inviting] = useActionState(emailInvite, null);
  const [reminded, remind, reminding] = useActionState(emailReminder, null);
  const [copied, setCopied] = useState<string | null>(null);
  const [coverOk, setCoverOk] = useState(false);
  useEffect(() => { if (event.cover_url) imageLoads(event.cover_url).then(setCoverOk); }, [event.cover_url]);
  const url = () => `${location.origin}/${event.slug}/r/${token}/remember?to=invite`;

  async function copy(what: string, write: () => Promise<boolean>) {
    setCopied((await write()) ? `${what} copied ✓` : "Couldn't copy");
    setTimeout(() => setCopied(null), 3000);
  }
  const text = (t: string) => navigator.clipboard.writeText(t).then(() => true, () => false);
  const busy = inviting || reminding;

  return (
    <details className="group mt-2">
      <summary className="inline cursor-pointer list-none text-[15px] font-semibold underline underline-offset-2 [&::-webkit-details-marker]:hidden">
        Send <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="mt-2 space-y-3 rounded-2xl bg-wash p-3">
        <form className="space-y-2">
          {!email && <input name="email" type="email" className="field" placeholder="Their email" aria-label={`Email for ${names}`} />}
          <div className="flex flex-wrap gap-2">
            <button formAction={invite} disabled={busy} className="btn px-4 text-[15px]">{inviting ? "Sending…" : "Email invite"}</button>
            <button formAction={remind} disabled={busy} className="btn btn-quiet border border-line bg-white px-4 text-[15px]">{reminding ? "Sending…" : "Email reminder"}</button>
          </div>
          {(invited || reminded) && <p role="status" className="text-[14px] text-soft">{reminded && !invited ? reminded : invited}{invited && reminded ? ` · ${reminded}` : ""}</p>}
        </form>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="pill px-3 py-1.5 text-[15px]" onClick={() => {
            const { html, text: plain } = inviteEmail({ ...event, cover_url: coverOk ? event.cover_url : null }, url(), names);
            copy("Email", () => copyRich(html, plain));
          }}>Copy email</button>
          <button type="button" className="pill px-3 py-1.5 text-[15px]" onClick={() => copy("Link", () => text(url()))}>Copy link</button>
          <button type="button" className="pill px-3 py-1.5 text-[15px]" onClick={() => copy("Reminder", () => text(reminderText(event, names, url())))}>Copy reminder</button>
        </div>
        {copied && <p role="status" className="text-[14px] text-soft">{copied}</p>}
      </div>
    </details>
  );
}
