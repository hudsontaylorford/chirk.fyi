"use client";

import { useActionState, useEffect, useState } from "react";
import { inviteText, reminderText } from "@/lib/guests";
import { inviteEmail } from "@/lib/invite-email";
import type { Event } from "@/lib/types";
import { imageLoads } from "./Cover";
import { copyRich } from "./CopyInvite";

type Send = (prev: string | null, f: FormData) => Promise<string>;

/**
 * "Send ›" on a guest who hasn't answered: email them their invite or a reminder (from chirk),
 * text it from your own phone (Messages opens with their personal link filled in; you pick who),
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
    setCopied((await write()) ? `${what} copied ✓` : "Couldn’t copy");
    setTimeout(() => setCopied(null), 3000);
  }
  const text = (t: string) => navigator.clipboard.writeText(t).then(() => true, () => false);
  const busy = inviting || reminding;
  // sms:?&body= opens a new message on both iPhone and Android; chirk keeps no phone numbers.
  const textMe = (body: string) => { location.href = `sms:?&body=${encodeURIComponent(body)}`; };

  return (
    <details className="group mt-2">
      <summary className="link tap cursor-pointer list-none text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        Send invite
      </summary>
      <div className="mb-2 space-y-2 border-l-2 border-line pl-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="button-quiet text-[15px]" onClick={() => textMe(inviteText(event, names, url()))}>Text invite</button>
          <button type="button" className="button-quiet text-[15px]" onClick={() => textMe(reminderText(event, names, url()))}>Text reminder</button>
        </div>
        <form className="space-y-2">
          {!email && <input name="email" type="email" className="field" placeholder="Their email" aria-label={`Email for ${names}`} />}
          <div className="flex flex-wrap gap-2">
            <button formAction={invite} disabled={busy} className="button-quiet text-[15px]">{inviting ? "Sending…" : "Email invite"}</button>
            <button formAction={remind} disabled={busy} className="button-quiet text-[15px]">{reminding ? "Sending…" : "Email reminder"}</button>
          </div>
          {(invited || reminded) && <p role="status" className="text-[14px] text-soft">{reminded && !invited ? reminded : invited}{invited && reminded ? ` · ${reminded}` : ""}</p>}
        </form>
        <div className="flex flex-wrap gap-x-4 text-[15px]">
          <button type="button" className="link tap" onClick={() => {
            const { html, text: plain } = inviteEmail({ ...event, cover_url: coverOk ? event.cover_url : null }, url(), names);
            copy("Email", () => copyRich(html, plain));
          }}>Copy email</button>
          <button type="button" className="link tap" onClick={() => copy("Link", () => text(url()))}>Copy link</button>
          <button type="button" className="link tap" onClick={() => copy("Reminder", () => text(reminderText(event, names, url())))}>Copy reminder</button>
        </div>
        {copied && <p role="status" className="text-[14px] text-soft">{copied}</p>}
      </div>
    </details>
  );
}
