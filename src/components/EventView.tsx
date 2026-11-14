import { Cover } from "@/components/Cover";
import { Details } from "@/components/Details";
import { bringList, joinNames } from "@/lib/data";
import { mapsUrl, shortDate, when } from "@/lib/format";
import { parseSchedule } from "@/lib/schedule";
import type { EventData } from "@/lib/types";

/** The invite in three parts: the plan (when, where, your message, RSVP), what's still needed, and who's coming. */
export function EventView({ data, rsvp }: { data: EventData; rsvp?: React.ReactNode }) {
  const { event, households } = data;
  const going = households.filter((h) => h.going);
  const people = going.reduce((n, h) => n + h.names.length + h.kids, 0);
  const { claimed, open } = bringList(data);
  const stages = parseSchedule(event.schedule, event.time, event.long_times);
  const bringing = (id: string) => claimed.filter((r) => r.households.includes(id)).map((r) => r.item.name);

  return (
    <article className="pb-28">
      {event.cover_url ? <Cover src={event.cover_url} /> : <div className="h-6" />}

      <header className="px-5 pt-6">
        <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight">{event.title}</h1>
        <p className="mt-3 text-[19px] font-medium">{when(event)}</p>
        {(event.place || event.address) && (
          <p className="mt-1 text-[17px] text-soft">
            {event.place}
            {event.place && event.address && " · "}
            {event.address && <a href={mapsUrl(event.address)} className="underline underline-offset-2">{event.address}</a>}
          </p>
        )}
        {event.hosted_by && !event.details && <p className="mt-1 text-[17px] text-soft">Hosted by {event.hosted_by}</p>}
        {stages.length > 0 && (
          <ul className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[17px]">
            {stages.map((s, i) => (
              <li key={i} className={`contents ${s.main ? "font-bold" : ""}`}>
                <span className={`tabular-nums ${s.main ? "" : "text-soft"}`}>{s.when}</span><span>{s.what}</span>
              </li>
            ))}
          </ul>
        )}
        <a href={`/${event.slug}/calendar.ics`} className="mt-3 inline-block text-[15px] font-medium underline underline-offset-2">
          Add to calendar
        </a>
      </header>

      {event.details && (
        <section className="mt-5 space-y-3 px-5 text-[17px] leading-relaxed">
          <Details text={event.details} />
          {/* The message is signed by whoever's hosting, so it reads as a note from them. */}
          {event.hosted_by && <p className="text-soft">— {event.hosted_by}</p>}
        </section>
      )}

      {rsvp && (
        <div className="mt-6 px-5">
          {rsvp}
          {event.rsvp_by && <p className="mt-2 text-center text-[15px] text-soft">Please reply by {shortDate(event.rsvp_by)}</p>}
        </div>
      )}

      {event.bring_prompt && open.length > 0 && (
        <section className="mt-10 px-5">
          <h2 className="text-[20px] font-bold">Still needed</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {open.map((i) => (
              <span key={i.id} className="rounded-full border-[1.5px] border-dashed border-line px-3 py-1.5 text-[16px]">{i.name}</span>
            ))}
          </div>
        </section>
      )}

      {/* Each reply once: who, what they're bringing, and their note. */}
      <section className="mt-10 px-5">
        <h2 className="text-[20px] font-bold">
          Coming {people > 0 && <span className="font-normal text-soft">· {people}</span>}
        </h2>
        {going.length === 0 ? (
          <p className="mt-2 text-soft">No replies yet. Be the first!</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {going.map((h) => {
              const things = event.bring_prompt ? bringing(h.id) : [];
              const note = event.notes_public && h.note;
              return (
                <li key={h.id} className="py-3 text-[17px]">
                  <p className="font-semibold">
                    {joinNames(h.names)}
                    {h.kids > 0 && <span className="font-normal text-soft"> +{h.kids} kid{h.kids > 1 ? "s" : ""}</span>}
                  </p>
                  {things.length > 0 && <p>{things.join(" · ")}</p>}
                  {note && (
                    <p className="mt-2 w-fit max-w-[85%] rounded-[20px] rounded-bl-[6px] bg-line px-4 py-2 text-[16px] leading-snug whitespace-pre-line italic">{note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
