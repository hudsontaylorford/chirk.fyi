"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveRsvp, type RsvpInput } from "@/app/actions";

export interface RsvpFormProps {
  slug: string;
  bringPrompt: string | null;
  openItems: { id: string; name: string }[]; // still-needed items (plus this household's own pick)
  initial?: {
    token: string;
    names: string[];
    going: boolean;
    kids: number;
    note: string;
    mainItemId: string | null;
    mainName: string;
    extra: string;
  };
}

const SUGGESTIONS = ["Drinks", "Dessert", "An appetizer"];

export function RsvpForm({ slug, bringPrompt, openItems, initial }: RsvpFormProps) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<{ text: string; sameName?: boolean } | null>(null);

  const [going, setGoing] = useState<boolean | null>(initial?.going ?? null);
  const [names, setNames] = useState<string[]>(initial?.names ?? [""]);
  const [kids, setKids] = useState(initial?.kids ?? 0);
  const [mainId, setMainId] = useState<string | null>(initial?.mainItemId ?? null);
  const [ownMain, setOwnMain] = useState(initial?.mainName ?? "");
  const [writingOwn, setWritingOwn] = useState(!!initial?.mainName);
  const [extra, setExtra] = useState(initial?.extra ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [me, setMe] = useState<string | null>(null);

  // If the dish they picked got taken in the meantime, it's no longer selected.
  const stillOpen = openItems.some((i) => i.id === mainId);
  const setName = (i: number, v: string) => setNames((ns) => ns.map((n, j) => (j === i ? v : n)));

  function submit(sameNameOk = false) {
    setError(null);
    if (going === null) return setError({ text: "Are you coming?" });
    if (!names.some((n) => n.trim())) return setError({ text: "Add your name." });
    const input: RsvpInput = {
      slug, token: initial?.token, names, going, kids, note, extra,
      main: mainId && stillOpen ? { itemId: mainId } : writingOwn && ownMain.trim() ? { name: ownMain } : null,
      answeringAs: me ?? undefined, sameNameOk,
    };
    start(async () => {
      const res = await saveRsvp(input);
      if (!res.ok) {
        setError({ text: res.error, sameName: res.sameName });
        if (res.refresh) router.refresh();
        return;
      }
      try { localStorage.setItem(`chirk:${slug}`, res.token); } catch {}
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
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-semibold">Kids coming</span>
            <div className="flex items-center gap-1">
              <button type="button" className="h-11 w-11 rounded-full bg-wash text-xl disabled:opacity-30" disabled={kids === 0} onClick={() => setKids(kids - 1)} aria-label="Fewer kids">−</button>
              <span className="w-8 text-center text-[18px] tabular-nums">{kids}</span>
              <button type="button" className="h-11 w-11 rounded-full bg-wash text-xl" onClick={() => setKids(Math.min(10, kids + 1))} aria-label="More kids">+</button>
            </div>
          </div>

          {bringPrompt && (
            <>
              <Q label={bringPrompt} hint={openItems.length ? "These are still needed. Or bring your own thing." : undefined}>
                <div className="flex flex-wrap gap-2">
                  {openItems.map((it) => (
                    <button
                      key={it.id} type="button" className="pill" aria-pressed={stillOpen && mainId === it.id}
                      onClick={() => { setMainId(mainId === it.id ? null : it.id); setWritingOwn(false); }}
                    >
                      {it.name}
                    </button>
                  ))}
                  <button
                    type="button" className="pill" aria-pressed={writingOwn}
                    onClick={() => { setWritingOwn(!writingOwn); setMainId(null); }}
                  >
                    Something else
                  </button>
                </div>
                {writingOwn && (
                  <input className="field mt-3" value={ownMain} onChange={(e) => setOwnMain(e.target.value)} placeholder="What are you bringing?" autoFocus />
                )}
              </Q>

              <Q label="Anything else?" hint="Optional. One thing is plenty.">
                <input className="field" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="e.g. a bottle of wine" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="pill py-1.5 text-[15px]" aria-pressed={extra === s} onClick={() => setExtra(extra === s ? "" : s)}>{s}</button>
                  ))}
                </div>
              </Q>
            </>
          )}
        </>
      )}

      {going !== null && (
        <Q label="Anything we should know?" hint="Optional">
          <textarea
            className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={going ? "Allergies, needs oven time, arriving late…" : "A note for the hosts"}
          />
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
