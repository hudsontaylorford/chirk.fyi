import { Cover } from "@/components/Cover";
import { Details } from "@/components/Details";
import { joinNames } from "@/lib/data";
import { clock, longDate, mapsUrl, shortDate } from "@/lib/format";
import type { EventData } from "@/lib/types";

/** The invite: what, when, where, who's coming, who's bringing what. */
export function EventView({ data, rsvp }: { data: EventData; rsvp?: React.ReactNode }) {
  const { event, households, items } = data;
  const going = households.filter((h) => h.going);
  const people = going.reduce((n, h) => n + h.names.length + h.kids, 0);
  const who = new Map(households.map((h) => [h.id, joinNames(h.names)]));
  const needed = items.filter((i) => i.kind === "needed");
  const theirs = items.filter((i) => i.kind !== "needed" && i.household_id);

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
          {longDate(event.date)}
          {event.time && ` · ${clock(event.time)}`}
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
          <h2 className="text-[20px] font-bold">Who&apos;s bringing what</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {needed.map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-3 py-3 text-[17px]">
                <span>{i.name}</span>
                {i.household_id ? (
                  <span className="text-right text-soft">{who.get(i.household_id)}</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-wash px-2.5 py-0.5 text-[14px] font-semibold">Still needed</span>
                )}
              </li>
            ))}
            {theirs.map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-3 py-3 text-[17px]">
                <span>{i.name}</span>
                <span className="text-right text-soft">{who.get(i.household_id!)}</span>
              </li>
            ))}
          </ul>
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
    </article>
  );
}
