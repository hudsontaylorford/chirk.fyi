import { Cover } from "@/components/Cover";
import { Details } from "@/components/Details";
import { bringList, joinNames } from "@/lib/data";
import { headcount, mapsUrl, shortDate, when } from "@/lib/format";
import { pollOf, tally } from "@/lib/poll";
import { parseSchedule } from "@/lib/schedule";
import type { EventData } from "@/lib/types";

/** The invite in three parts: the plan (when, where, your message, RSVP), what's still needed, and who's coming. */
export function EventView({ data, rsvp, rsvpHref, greeting, replied }: { data: EventData; rsvp?: React.ReactNode; rsvpHref?: string; greeting?: string; replied?: boolean }) {
  const { event, households } = data;
  const going = households.filter((h) => h.going);
  const people = going.reduce((n, h) => n + headcount(h.names) + h.kids, 0);
  const { claimed, open } = bringList(data);
  const stages = parseSchedule(event.schedule, event.time, event.long_times);
  const poll = pollOf(event);
  const bringing = (id: string) => claimed.filter((r) => r.households.includes(id)).map((r) => r.item.name);

  return (
    <article>
      {event.cover_url ? <Cover src={event.cover_url} title={event.title} /> : <div className="h-6" />}

      {/* The decision first: what, when, where (and the day's parts), then the one action. */}
      <header className="px-5 pt-6">
        {greeting && <p className="mb-2 text-[17px] text-soft">Hi {greeting}, you’re invited!</p>}
        <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight">{event.title}</h1>
        <p className="mt-3 text-[19px] font-medium">{when(event)}</p>
        {(event.place || event.address) && (
          <p className="mt-1 text-[17px]">
            {event.place}
            {event.place && event.address && <span className="text-soft"> · </span>}
            {event.address && <a href={mapsUrl(event.address)} className="link">{event.address}</a>}
          </p>
        )}
        {event.hosted_by && !event.details && <p className="mt-1 text-[17px] text-soft">Hosted by {event.hosted_by}</p>}
        {stages.length > 0 && (
          <ul className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[17px] max-[240px]:grid-cols-1">
            {stages.map((s, i) => (
              <li key={i} className={`contents ${s.main ? "font-bold" : ""}`}>
                <span className={`tabular-nums ${s.main ? "" : "text-soft"}`}>{s.when}</span><span>{s.what}</span>
              </li>
            ))}
          </ul>
        )}
        <a href={`/${event.slug}/calendar.ics`} className="link tap mt-1 text-[16px]">Add to calendar</a>
      </header>

      {rsvp && (
        <div className="mt-4 px-5">
          {rsvp}
          {/* Said once, right where it matters: replying takes no account. */}
          <p className="mt-2 text-center text-[15px] text-soft">
            {[event.rsvp_by && `Please reply by ${shortDate(event.rsvp_by)}.`, !replied && "No account needed."].filter(Boolean).join(" ")}
          </p>
        </div>
      )}

      {event.details && (
        <section className="mt-8 space-y-3 px-5 text-[17px] leading-relaxed">
          <Details text={event.details} />
          {/* The message is signed by whoever's hosting, so it reads as a note from them. */}
          {event.hosted_by && <p className="text-soft">— {event.hosted_by}</p>}
        </section>
      )}

      {/* The poll: counts only (who picked what is on the host page). Voting happens in the reply. */}
      {poll && (
        <section className="mt-10 px-5">
          <h2 className="text-[20px] font-bold">{poll.question}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {tally(poll.choices, households).map((t) => (
              <li key={t.choice} className="flex justify-between gap-3 py-3 text-[17px]">
                <span>{t.choice}</span>
                <span className="shrink-0 text-soft tabular-nums">{t.by.length} {t.by.length === 1 ? "vote" : "votes"}</span>
              </li>
            ))}
          </ul>
          {rsvpHref && <a href={replied ? `${rsvpHref}?change=1` : rsvpHref} className="link tap text-[16px]">Vote</a>}
        </section>
      )}

      {/* Still needed: each item is a way in. Tapping one opens the reply with it already picked. */}
      {event.bring_prompt && open.length > 0 && (
        <section className="mt-10 px-5">
          <h2 className="text-[20px] font-bold">Still needed</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {open.map((i) =>
              rsvpHref
                ? <a key={i.id} href={`${rsvpHref}?pick=${i.id}`} className="choice">{i.name}</a>
                : <span key={i.id} className="py-2 pr-3 text-[16px]">{i.name}</span>,
            )}
          </div>
          {event.allow_own && rsvpHref && <a href={`${rsvpHref}?own=1`} className="link tap text-[16px]">+ Bring something else</a>}
        </section>
      )}

      {/* Each reply once: who, what they're bringing, and their note. Hidden until someone's going. */}
      {going.length > 0 && (
        <section className="mt-10 px-5">
          <h2 className="text-[20px] font-bold">
            Coming <span className="font-normal text-soft">· {people}</span>
          </h2>
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
                  {note && <p className="mt-1 text-[16px] leading-snug whitespace-pre-line text-soft italic">&ldquo;{note}&rdquo;</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
