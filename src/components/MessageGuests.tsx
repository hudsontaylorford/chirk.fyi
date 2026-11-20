"use client";

import { useActionState, useState } from "react";
import type { Audience } from "@/app/[slug]/host/actions";
import { reach } from "@/lib/format";

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
  const labels: Record<Audience, string> = { going: "Going", waiting: "No reply yet", everyone: "Everyone" };

  return (
    <section className="mt-10">
      <h2 className="text-[20px] font-bold">Message your guests</h2>
      <p className="text-[15px] text-soft">Send an update without changing the invite.</p>
      <form action={send} onSubmit={() => setSure(false)} className="mt-3 space-y-3">
        <input type="hidden" name="to" value={to} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Who it's for">
          {(Object.keys(labels) as Audience[]).map((a) => (
            <button key={a} type="button" className="choice" aria-pressed={to === a} onClick={() => { setTo(a); setSure(false); }}>
              {labels[a]}
            </button>
          ))}
        </div>
        {/* Delivery for the chosen group: who gets an email, who needs a text (B2: no bare "· 0"). */}
        <p className="text-[14px] text-soft">{reach(c)}</p>
        <textarea name="note" rows={4} className="field" value={note} onChange={(e) => { setNote(e.target.value); setSure(false); }} placeholder="Write a note" aria-label="Your note" />
        <label className="flex items-center gap-3 text-[16px]">
          <input type="checkbox" name="details" defaultChecked className="h-5 w-5 shrink-0" />
          Include event details
        </label>
        {sure ? (
          <div className="flex items-center gap-3">
            <button className="button" disabled={sending}>{sending ? "Sending…" : `Send to ${c.email} guest${c.email === 1 ? "" : "s"}`}</button>
            <button type="button" className="link tap text-[16px] text-soft" onClick={() => setSure(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="button-quiet" disabled={!note.trim() || !c.email} onClick={() => setSure(true)}>Send update</button>
        )}
        {result && <p role="status" className="text-[15px] text-soft">{result}</p>}
      </form>
    </section>
  );
}

