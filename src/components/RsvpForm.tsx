"use client";

import { useRouter } from "next/navigation";
import { several } from "@/lib/format";
import { useState, useTransition } from "react";
import { saveRsvp, type RsvpInput } from "@/app/actions";

export interface RsvpFormProps {
  slug: string;
  bringPrompt: string | null;
  askKids: boolean;
  notePrompt: string | null;
  noteHint: string | null;
  allowOwn: boolean;
  notesPublic: boolean;
  maxGuests: number | null; // extra people per reply; null = no limit
  arrivals: string[]; // parts of the day they can pick; empty = don't ask
  // Chips to pick from: still needed, already mine, and (when doubling up is on) others' with who's bringing them.
  choices: { id: string; name: string; by: string | null }[];
  /** From the invite: an item tapped under Still needed (already picked), or "+ Bring something else" (focus that box). */
  prePick?: string;
  ownFirst?: boolean;
  initial?: {
    token: string;
    names: string[];
    going: boolean | null; // null = named guest who hasn't answered yet
    kids: number;
    parts: string[];
    note: string;
    picks: string[];
    own: string[];
  };
}

export function RsvpForm({ slug, bringPrompt, askKids, notePrompt, noteHint, allowOwn, notesPublic, maxGuests, arrivals, choices, prePick, ownFirst, initial }: RsvpFormProps) {
  const maxNames = 1 + (maxGuests ?? 5);
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<{ text: string; sameName?: boolean } | null>(null);

  const [going, setGoing] = useState<boolean | null>(initial?.going ?? (prePick || ownFirst ? true : null));
  const [names, setNames] = useState<string[]>(initial?.names ?? [""]);
  const [kids, setKids] = useState(initial?.kids ?? 0);
  const [parts, setParts] = useState<string[]>(initial?.parts ?? []);
  const [picks, setPicks] = useState<string[]>(() => [...new Set([...(initial?.picks ?? []), ...(prePick && choices.some((c) => c.id === prePick) ? [prePick] : [])])]);
  const [own, setOwn] = useState<string[]>(initial?.own ?? []);
  const [typing, setTyping] = useState("");
  const [note, setNote] = useState(initial?.note ?? "");
  const [me, setMe] = useState<string | null>(null);

  // Something they picked that got taken in the meantime drops out of their picks.
  const livePicks = picks.filter((id) => choices.some((c) => c.id === id));
  function togglePick(c: { id: string; name: string; by: string | null }) {
    if (livePicks.includes(c.id)) return setPicks(picks.filter((id) => id !== c.id));
    if (c.by && !window.confirm(`${c.by} ${several(c.by) ? "are" : "is"} already bringing ${c.name}. Bring it too?`)) return;
    setPicks([...picks, c.id]);
  }
  function addOwn(text: string) {
    const fresh = text.split(",").map((t) => t.trim()).filter((t) => t && !own.some((o) => o.toLowerCase() === t.toLowerCase()));
    if (fresh.length) setOwn([...own, ...fresh]);
    setTyping("");
  }
  const setName = (i: number, v: string) => setNames((ns) => ns.map((n, j) => (j === i ? v : n)));

  function submit(sameNameOk = false) {
    setError(null);
    if (going === null) return setError({ text: "Are you coming?" });
    if (!names.some((n) => n.trim())) return setError({ text: "Add your name." });
    const input: RsvpInput = {
      slug, token: initial?.token, names, going, kids, note, parts,
      picks: livePicks, own: !allowOwn ? [] : typing.trim() ? [...own, ...typing.split(",")] : own,
      answeringAs: me ?? undefined, sameNameOk,
    };
    start(async () => {
      const res = await saveRsvp(input);
      if (!res.ok) {
        setError({ text: res.error, sameName: res.sameName });
        if (res.refresh) router.refresh();
        return;
      }
      router.push(`/${slug}/r/${res.token}${initial?.going != null ? "" : "?new=1"}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-8">
      {initial && initial.going !== null && initial.names.length > 1 && (
        <Q label="Who's this?">
          <div className="flex flex-wrap gap-2">
            {initial.names.map((n) => (
              <button key={n} type="button" className="choice" aria-pressed={me === n} onClick={() => setMe(n)}>{n}</button>
            ))}
          </div>
        </Q>
      )}

      <Q label="Are you coming?">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="choice min-h-[52px] text-[17px] font-semibold" aria-pressed={going === true} onClick={() => setGoing(true)}>
            Going
          </button>
          <button type="button" className="choice min-h-[52px] text-[17px] font-semibold" aria-pressed={going === false} onClick={() => setGoing(false)}>
            Can&apos;t make it
          </button>
        </div>
      </Q>

      <Q
        label={names.length > 1 ? "Names" : "Your name"}
      >
        <div className="space-y-2">
          {names.map((n, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="field" value={n} onChange={(e) => setName(i, e.target.value)}
                placeholder={i === 0 ? "Your name" : "Their name"} autoComplete={i === 0 ? "given-name" : "off"}
                aria-label={i === 0 ? "Your name" : `Name ${i + 1}`}
              />
              {i > 0 && (
                <button type="button" className="min-w-11 px-2 text-soft" aria-label="Remove" onClick={() => setNames((ns) => ns.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          {names.length < Math.min(maxNames, 6) && (
            <button type="button" className="link tap text-[16px]" onClick={() => setNames((ns) => [...ns, ""])}>
              {maxGuests === 1 ? "+ Add your plus-one" : "+ Add someone coming with you"}
            </button>
          )}
        </div>
      </Q>

      {going && (
        <>
          {askKids && <div className="flex items-center justify-between">
            <span className="text-[17px] font-semibold">Kids coming</span>
            <div className="flex items-center gap-1">
              <button type="button" className="button-quiet h-11 w-11 px-0 text-xl disabled:opacity-30" disabled={kids === 0} onClick={() => setKids(kids - 1)} aria-label="Fewer kids">−</button>
              <span className="w-8 text-center text-[18px] tabular-nums">{kids}</span>
              <button type="button" className="button-quiet h-11 w-11 px-0 text-xl" onClick={() => setKids(Math.min(10, kids + 1))} aria-label="More kids">+</button>
            </div>
          </div>}

          {arrivals.length > 1 && (
            <Q label="Which parts are you coming to?" hint="Optional.">
              <div className="flex flex-wrap gap-2">
                {arrivals.map((a) => (
                  <button key={a} type="button" className="choice" aria-pressed={parts.includes(a)} onClick={() => setParts(parts.includes(a) ? parts.filter((p) => p !== a) : [...parts, a])}>{a}</button>
                ))}
              </div>
            </Q>
          )}

          {bringPrompt && (
            <Q label={bringPrompt}>
              <div className="flex flex-wrap gap-2">
                {choices.map((c) => (
                  <button key={c.id} type="button" className="choice" aria-pressed={livePicks.includes(c.id)} onClick={() => togglePick(c)}>
                    {c.name}
                    {c.by && !livePicks.includes(c.id) && <span className="text-soft"> · {c.by}</span>}
                  </button>
                ))}
                {own.map((o) => (
                  <button key={o} type="button" className="choice" aria-pressed onClick={() => setOwn(own.filter((x) => x !== o))} aria-label={`Remove ${o}`}>
                    {o} <span aria-hidden>✕</span>
                  </button>
                ))}
              </div>
              {allowOwn && (
                <>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="field min-w-0 flex-[1_1_10rem]" value={typing} placeholder="Something else" aria-label="Add your own" autoFocus={ownFirst}
                  onChange={(e) => setTyping(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOwn(typing); } }}
                />
                <button type="button" className="button-quiet shrink-0 min-h-[3.2rem]" disabled={!typing.trim()} onClick={() => addOwn(typing)}>Add</button>
              </div>
                </>
              )}
            </Q>
          )}
        </>
      )}

      {going !== null && (
        <Q label={notePrompt || "Anything we should know?"} hint={notesPublic ? "Optional. Shows on the invite." : "Optional. Only the hosts see this."}>
          <textarea
            className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={going ? noteHint || "Allergies, arriving late…" : "A note for the hosts"}
          />
        </Q>
      )}


      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-[16px] text-red-800">
          {error.text}
          {error.sameName && (
            <button type="button" className="mt-2 block font-semibold underline" onClick={() => submit(true)}>
              It&apos;s a different person. Send anyway.
            </button>
          )}
        </div>
      )}

      <button className="button w-full" disabled={busy || going === null}>
        {busy ? (initial?.going != null ? "Saving…" : "Sending…") : initial?.going != null ? "Save" : "Send RSVP"}
      </button>
    </form>
  );
}

function Q({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold">{label}</h2>
      {hint && <p className="text-[15px] text-soft">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
