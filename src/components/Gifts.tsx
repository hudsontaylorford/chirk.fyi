import { addNever, drawGifts, emailMatches, removeNever, saveGiftPeople, saveWish } from "@/app/gifts";
import { Confirm } from "@/components/Confirm";
import { GiftButton, WishForm } from "@/components/GiftForms";
import { SaveButton } from "@/components/SaveButton";
import { getDraws, getSentJobs, joinNames } from "@/lib/data";
import { daysBefore, giversFrom } from "@/lib/due";
import { listText, shortDate } from "@/lib/format";
import type { EventData } from "@/lib/types";

/**
 * Gift exchange on an event. Hosts choose who's in, set "never draw each other" pairs, draw names and email matches.
 * A guest sees only their own match (who they're giving to, the budget and that person's ideas) and adds their own ideas.
 */
export async function Gifts({ data, token, host, inside = false }: { data: EventData; token: string | null; host: boolean; inside?: boolean }) {
  const { event, households } = data;
  const [draws, sent] = await Promise.all([getDraws(event.id), getSentJobs(event.id)]);
  const coming = households.filter((h) => h.going !== false);
  const me = coming.find((h) => h.token === token) ?? null;
  if (!host && !me) return null; // only people on the list see it
  const name = (id: string) => joinNames(households.find((h) => h.id === id)?.names ?? ["someone"]);
  const inNow = coming.filter((h) => h.gift_in).map((h) => h.id).sort();
  const changed = draws.size > 0 && JSON.stringify([...draws.keys()].sort()) !== JSON.stringify(inNow);
  const slug = event.slug;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  // A scheduled send: sent, or still to come, or its window passed (set up too late for it).
  const status = (job: string, lastDay: string) => (sent.has(job) ? " · sent ✓" : today > lastDay ? " · skipped (too late)" : "");

  return (
    <section className={inside ? "mt-8" : "mx-auto mt-10 max-w-lg px-5"}>
      <h2 className="text-[20px] font-bold">
        Gift exchange {event.gift_budget && <span className="font-normal text-soft">· {event.gift_budget}</span>}
      </h2>

      {!host && me && (
        <>
          {/* The details: who's in, when names get drawn, and the host's rules. */}
          <p className="mt-2 text-[15px] text-soft">
            {(() => { const ins = coming.filter((h) => h.gift_in); return `${ins.length} in: ${listText(ins.map((h) => (h.id === me.id ? "you" : joinNames(h.names))))}`; })()}
            {event.gift_draw_on && draws.size === 0 && <> · names drawn {shortDate(event.gift_draw_on)}</>}
          </p>
          {event.gift_rules && <p className="mt-2 whitespace-pre-line text-[16px]">{event.gift_rules}</p>}
          {!me.gift_in ? (
            <p className="mt-2 text-soft">You&apos;re not in this one.</p>
          ) : draws.get(me.id) ? (
            <div className="mt-3 rounded-lg border-[1.5px] border-line p-4">
              <p className="text-[15px] text-soft">You&apos;re giving a gift to</p>
              <p className="text-[24px] font-bold">{name(draws.get(me.id)!)}</p>
              <p className="mt-1 text-[15px]">
                {households.find((h) => h.id === draws.get(me.id))?.gift_wish
                  ? <>Their ideas: {households.find((h) => h.id === draws.get(me.id))!.gift_wish}</>
                  : <span className="text-soft">They haven&apos;t added ideas yet.</span>}
              </p>
              <p className="mt-1 text-[14px] text-soft">Keep it a secret!</p>
            </div>
          ) : (
            <p className="mt-2 text-soft">Names haven&apos;t been drawn yet. You&apos;ll see who you&apos;re giving to here.</p>
          )}
          {me.gift_in && <WishForm action={saveWish.bind(null, slug, token!)} wish={me.gift_wish} />}
        </>
      )}

      {host && (
        <>
          <form action={saveGiftPeople.bind(null, slug)} className="mt-3">
            <p className="text-[15px] text-soft">Who&apos;s in</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {coming.map((h) => (
                <label key={h.id} className="choice-check">
                  <input type="checkbox" name="in" value={h.id} defaultChecked={h.gift_in} className="h-4 w-4" />
                  {joinNames(h.names)}
                </label>
              ))}
            </div>
            <div className="mt-2"><SaveButton className="button-quiet">Save who&apos;s in</SaveButton></div>
          </form>

          <div className="mt-5">
            <p className="text-[15px] text-soft">Never draw each other</p>
            {event.gift_never.length > 0 && (
              <ul className="mt-1 space-y-1 text-[16px]">
                {event.gift_never.map(([a, b], i) => (
                  <li key={`${a}-${b}`}>{name(a)} ↔ {name(b)} <span className="text-[14px] text-soft">· <Confirm label="Remove" action={removeNever.bind(null, slug, i)} /></span></li>
                ))}
              </ul>
            )}
            <form action={addNever.bind(null, slug)} className="mt-2 flex gap-2">
              {(["a", "b"] as const).map((k) => (
                <select key={k} name={k} className="field min-w-0" aria-label={k === "a" ? "First person" : "Second person"} defaultValue="">
                  <option value="" disabled>Pick…</option>
                  {coming.map((h) => <option key={h.id} value={h.id}>{joinNames(h.names)}</option>)}
                </select>
              ))}
              <SaveButton className="button-quiet shrink-0 min-h-[3.2rem]">Add</SaveButton>
            </form>
            <p className="mt-1 text-[14px] text-soft">A couple who replied together is one giver, so they never draw each other anyway.</p>
          </div>

          {event.gift_draw_on && (
            // What's scheduled, and what's already gone out.
            <ul className="mt-5 space-y-1 border-y border-line py-3 text-[15px]">
              {event.gift_remind_ideas && (
                <li>Ideas reminder: {shortDate(daysBefore(event.gift_draw_on, 3))}{status("gift_ideas", daysBefore(event.gift_draw_on, 1))}</li>
              )}
              <li>Names drawn and emailed: {shortDate(event.gift_draw_on)}, 9 am{sent.has("gift_draw") && " · sent ✓"}</li>
              {event.gift_remind_givers && (
                <li>&ldquo;You&apos;re giving to…&rdquo; reminder: {shortDate(giversFrom(event.date, event.gift_draw_on))}{status("gift_givers", daysBefore(event.date, 1))}</li>
              )}
              {event.status !== "live" && <li className="text-soft">Nothing sends until the event is published.</li>}
            </ul>
          )}

          <div className="mt-5 space-y-3">
            {draws.size > 0 && (
              <p className="text-[15px]">
                Names drawn for {draws.size} ✓
                {changed && <span className="text-soft"> Who&apos;s in has changed since, so draw again to include everyone.</span>}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <GiftButton
                action={drawGifts.bind(null, slug)} label={draws.size ? "Draw again" : "Draw names"}
                confirm={draws.size ? "Draw again? Everyone gets a new match, and anyone already told will have the wrong one." : undefined}
              />
              {draws.size > 0 && <GiftButton action={emailMatches.bind(null, slug)} label="Email everyone their match" quiet />}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
