import { Cover } from "@/components/Cover";
import { Details } from "@/components/Details";
import { bringList, joinNames } from "@/lib/data";
import { mapsUrl, shortDate, when } from "@/lib/format";
import { parseSchedule } from "@/lib/schedule";
import type { EventData } from "@/lib/types";

/** The invite: what, when, where, who's coming, who's bringing what. */
export function EventView({ data, rsvp }: { data: EventData; rsvp?: React.ReactNode }) {
  const { event, households } = data;
  const going = households.filter((h) => h.going);
  const people = going.reduce((n, h) => n + h.names.length + h.kids, 0);
  const { claimed, open } = bringList(data);
  // One row per reply, in the order people first claimed something, so names aren't repeated per item.
  const first = (id: string) => data.claims.findIndex((c) => c.household_id === id);
  const byWho = households
    .map((h) => ({ h, things: claimed.filter((r) => r.households.includes(h.id)).map((r) => r.item.name) }))
    .filter((x) => x.things.length)
    .sort((a, b) => first(a.h.id) - first(b.h.id));
  const stages = parseSchedule(event.schedule, event.time);
  const hasMain = stages.some((s) => s.main);

  return (
    <article className="pb-28">
      {event.cover_url ? (
        <Cover src={event.cover_url} />
      ) : (
        <div className="h-6" />
      )}

      <header className="px-5 pt-6">
        <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight">{event.title}</h1>
        <p className="mt-3 text-[19px] font-medium">
          {when(event)}
        </p>
        {(event.place || event.address) && (
          <p className="mt-1 text-[17px] text-soft">
            {event.place}
            {event.place && event.address && " · "}
            {event.address && (
              <a href={mapsUrl(event.address)} className="underline underline-offset-2">{event.address}</a>
            )}
          </p>
        )}
        {stages.length > 0 && (
          <ul className="mt-3 space-y-1 text-[17px] tabular-nums">
            {stages.map((s, i) => (
              <li key={i} className={`grid grid-cols-[5.5rem_1fr] gap-2 ${s.main ? "font-bold" : hasMain ? "text-soft" : ""}`}>
                <span>{s.when}</span><span>{s.what}</span>
              </li>
            ))}
          </ul>
        )}
        <a href={`/${event.slug}/calendar.ics`} className="mt-3 inline-block text-[15px] font-medium underline underline-offset-2">
          Add to calendar
        </a>
        {rsvp && <div className="mt-5">{rsvp}</div>}
      </header>

      {event.details && (
        <section className="mt-6 space-y-3 px-5 text-[17px] leading-relaxed">
          <Details text={event.details} />
          {event.rsvp_by && <p className="text-soft">Please reply by {shortDate(event.rsvp_by)}.</p>}
        </section>
      )}

      {event.bring_prompt && (
        <section className="mt-8 px-5">
          {open.length > 0 && (
            <>
              <h2 className="text-[20px] font-bold">Still needed</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {open.map((i) => (
                  <span key={i.id} className="rounded-full border-[1.5px] border-dashed border-line px-3 py-1.5 text-[16px]">{i.name}</span>
                ))}
              </div>
            </>
          )}
          {claimed.length > 0 && (
            <>
              <h2 className={`text-[20px] font-bold ${open.length ? "mt-8" : ""}`}>Who&apos;s bringing what</h2>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {byWho.map(({ h, things }) => (
                  <li key={h.id} className="py-3 text-[17px]">
                    <p className="font-semibold">{joinNames(h.names)}</p>
                    <p>{things.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="mt-8 px-5">
        <h2 className="text-[20px] font-bold">
          Coming {people > 0 && <span className="font-normal text-soft">· {people}</span>}
        </h2>
        {going.length === 0 ? (
          <p className="mt-2 text-soft">No replies yet. Be the first!</p>
        ) : (
          <p className="mt-2 text-[17px] leading-relaxed">
            {going.map((h) => joinNames(h.names) + (h.kids ? ` (+${h.kids} kid${h.kids > 1 ? "s" : ""})` : "")).join(" · ")}
          </p>
        )}
      </section>

      {event.notes_public && households.some((h) => h.note) && (
        <section className="mt-8 px-5">
          <h2 className="text-[20px] font-bold">Notes</h2>
          {/* Message bubbles: set apart from the bring list, newest last like a chat. */}
          <ul className="mt-3 space-y-3">
            {households.filter((h) => h.note).map((h) => (
              <li key={h.id} className="flex max-w-[85%] flex-col items-start">
                <p className="mb-1 ml-3 text-[13px] text-soft">{joinNames(h.names)}</p>
                <p className="rounded-[20px] rounded-bl-[6px] bg-line px-4 py-2.5 text-[16px] leading-snug whitespace-pre-line">{h.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
