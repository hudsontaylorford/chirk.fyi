"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveRsvp, type RsvpInput } from "@/app/actions";

export interface RsvpFormProps {
  slug: string;
  bringPrompt: string | null;
  askKids: boolean;
  notePrompt: string | null;
  noteHint: string | null;
  // Chips to pick from: still needed, already mine, and (when doubling up is on) others' with who's bringing them.
  choices: { id: string; name: string; by: string | null }[];
  initial?: {
    token: string;
    names: string[];
    going: boolean;
    kids: number;
    note: string;
    email: string;
    picks: string[];
    own: string[];
  };
}

const QUICK = ["Drinks", "Dessert", "An appetizer"];

export function RsvpForm({ slug, bringPrompt, askKids, notePrompt, noteHint, choices, initial }: RsvpFormProps) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<{ text: string; sameName?: boolean } | null>(null);

  const [going, setGoing] = useState<boolean | null>(initial?.going ?? null);
  const [names, setNames] = useState<string[]>(initial?.names ?? [""]);
  const [kids, setKids] = useState(initial?.kids ?? 0);
  const [picks, setPicks] = useState<string[]>(initial?.picks ?? []);
  const [own, setOwn] = useState<string[]>(initial?.own ?? []);
  const [typing, setTyping] = useState("");
  const [note, setNote] = useState(initial?.note ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [me, setMe] = useState<string | null>(null);

  // Something they picked that got taken in the meantime drops out of their picks.
  const livePicks = picks.filter((id) => choices.some((c) => c.id === id));
  function togglePick(c: { id: string; name: string; by: string | null }) {
    if (livePicks.includes(c.id)) return setPicks(picks.filter((id) => id !== c.id));
    if (c.by && !window.confirm(`${c.by} ${c.by.includes("&") || c.by.includes(",") ? "are" : "is"} already bringing ${c.name}. Bring it too?`)) return;
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
      slug, token: initial?.token, names, going, kids, note, email,
      picks: livePicks, own: typing.trim() ? [...own, ...typing.split(",")] : own,
      answeringAs: me ?? undefined, sameNameOk,
    };
    start(async () => {
      const res = await saveRsvp(input);
      if (!res.ok) {
        setError({ text: res.error, sameName: res.sameName });
        if (res.refresh) router.refresh();
        return;
      }
      router.push(`/${slug}/r/${res.token}${initial ? "" : "?new=1"}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-8">
      {initial && initial.names.length > 1 && (
        <Q label="Who's this?">
          <div className="flex flex-wrap gap-2">
            {initial.names.map((n) => (
              <button key={n} type="button" className="pill" aria-pressed={me === n} onClick={() => setMe(n)}>{n}</button>
            ))}
          </div>
        </Q>
      )}

      <Q label="Are you coming?">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="pill py-3.5 text-[17px] font-semibold" aria-pressed={going === true} onClick={() => setGoing(true)}>
            Going
          </button>
          <button type="button" className="pill py-3.5 text-[17px] font-semibold" aria-pressed={going === false} onClick={() => setGoing(false)}>
            Can&apos;t make it
          </button>
        </div>
      </Q>

      <Q label={names.length > 1 ? "Names" : "Your name"} hint={names.length === 1 ? "Coming as a couple? Add them too, one reply for both of you." : undefined}>
        <div className="space-y-2">
          {names.map((n, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="field" value={n} onChange={(e) => setName(i, e.target.value)}
                placeholder={i === 0 ? "Your name" : "Their name"} autoComplete={i === 0 ? "given-name" : "off"}
                aria-label={i === 0 ? "Your name" : `Name ${i + 1}`}
              />
              {i > 0 && (
                <button type="button" className="px-2 text-soft" aria-label="Remove" onClick={() => setNames((ns) => ns.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          {names.length < 6 && (
            <button type="button" className="py-1 text-[16px] font-semibold" onClick={() => setNames((ns) => [...ns, ""])}>
              + Add someone
            </button>
          )}
        </div>
      </Q>

      {going && (
        <>
          {askKids && <div className="flex items-center justify-between">
            <span className="text-[17px] font-semibold">Kids coming</span>
            <div className="flex items-center gap-1">
              <button type="button" className="h-11 w-11 rounded-full bg-wash text-xl disabled:opacity-30" disabled={kids === 0} onClick={() => setKids(kids - 1)} aria-label="Fewer kids">−</button>
              <span className="w-8 text-center text-[18px] tabular-nums">{kids}</span>
              <button type="button" className="h-11 w-11 rounded-full bg-wash text-xl" onClick={() => setKids(Math.min(10, kids + 1))} aria-label="More kids">+</button>
            </div>
          </div>}

          {bringPrompt && (
            <Q label={bringPrompt} hint="Tap one or two, or add your own.">
              <div className="flex flex-wrap gap-2">
                {choices.map((c) => (
                  <button key={c.id} type="button" className="pill" aria-pressed={livePicks.includes(c.id)} onClick={() => togglePick(c)}>
                    {c.name}
                    {c.by && !livePicks.includes(c.id) && <span className="text-soft"> · {c.by}</span>}
                  </button>
                ))}
                {own.map((o) => (
                  <button key={o} type="button" className="pill" aria-pressed onClick={() => setOwn(own.filter((x) => x !== o))} aria-label={`Remove ${o}`}>
                    {o} <span aria-hidden>✕</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="field" value={typing} placeholder="Add your own (e.g. wine)" aria-label="Add your own"
                  onChange={(e) => setTyping(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOwn(typing); } }}
                />
                <button type="button" className="btn btn-quiet shrink-0 px-4" disabled={!typing.trim()} onClick={() => addOwn(typing)}>Add</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK.filter((q) => !own.includes(q)).map((q) => (
                  <button key={q} type="button" className="pill py-1.5 text-[15px]" onClick={() => addOwn(q)}>+ {q}</button>
                ))}
              </div>
            </Q>
          )}
        </>
      )}

      {going !== null && (
        <Q label={notePrompt || "Anything we should know?"} hint="Optional">
          <textarea
            className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={going ? noteHint || "Allergies, arriving late…" : "A note for the hosts"}
          />
        </Q>
      )}

      {going !== null && (
        <Q label="Email" hint="Optional. We'll send you a link to change your reply from any device.">
          <input className="field" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Q>
      )}

      {error && (
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-[16px] text-red-800">
          {error.text}
          {error.sameName && (
            <button type="button" className="mt-2 block font-semibold underline" onClick={() => submit(true)}>
              It&apos;s a different person. Send anyway.
            </button>
          )}
        </div>
      )}

      <button className="btn w-full" disabled={busy || going === null}>
        {busy ? "Sending…" : initial ? "Save" : "Send RSVP"}
      </button>
    </form>
  );
}

function Q({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[17px] font-semibold">{label}</p>
      {hint && <p className="text-[15px] text-soft">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
