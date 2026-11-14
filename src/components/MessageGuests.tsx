"use client";

import { useActionState, useState } from "react";
import type { Audience } from "@/app/[slug]/host/actions";

/**
 * "Message your guests": a separate email from the hosts (updates, a day-before note), not part of the invite.
 * Pick who it's for, write it, tap Send, then confirm.
 */
export function MessageGuests({ counts, action }: {
  counts: Record<Audience, { email: number; total: number }>;
  action: (prev: string | null, f: FormData) => Promise<string>;
}) {
  const [result, send, sending] = useActionState(action, null);
  const [to, setTo] = useState<Audience>("going");
  const [note, setNote] = useState("");
  const [sure, setSure] = useState(false);
  const c = counts[to];
  const labels: Record<Audience, string> = { going: "Going", waiting: "Haven't replied", everyone: "Everyone" };

  return (
    <section className="mt-8 rounded-2xl bg-wash p-4">
      <h2 className="text-[17px] font-semibold">Message your guests</h2>
      <p className="text-[15px] text-soft">An email to your guests, apart from the invite. Use it for updates or a day-before note. The invite doesn&apos;t change.</p>
      <form action={send} onSubmit={() => setSure(false)} className="mt-3 space-y-3">
        <input type="hidden" name="to" value={to} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Who it's for">
          {(Object.keys(labels) as Audience[]).map((a) => (
            <button key={a} type="button" className="pill px-3 py-1.5 text-[15px]" aria-pressed={to === a} onClick={() => { setTo(a); setSure(false); }}>
              {labels[a]} · {counts[a].email}
            </button>
          ))}
        </div>
        {c.total > c.email && (
          <p className="text-[14px] text-soft">{c.total - c.email} in this group {c.total - c.email === 1 ? "has" : "have"} no email on file, so text them yourself.</p>
        )}
        <textarea name="note" rows={4} className="field" value={note} onChange={(e) => { setNote(e.target.value); setSure(false); }} placeholder="Write your note…" aria-label="Your note" />
        <label className="flex items-center gap-3 text-[16px]">
          <input type="checkbox" name="details" defaultChecked className="h-5 w-5 shrink-0" />
          Include the date, place and schedule
        </label>
        {sure ? (
          <div className="flex items-center gap-3">
            <button className="btn px-5 text-[16px]" disabled={sending}>{sending ? "Sending…" : `Send to ${c.email} guest${c.email === 1 ? "" : "s"}`}</button>
            <button type="button" className="text-[15px] text-soft underline" onClick={() => setSure(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="btn w-full text-[16px]" disabled={!note.trim() || !c.email} onClick={() => setSure(true)}>Send…</button>
        )}
        {result && <p role="status" className="text-[15px] text-soft">{result}</p>}
      </form>
    </section>
  );
}
