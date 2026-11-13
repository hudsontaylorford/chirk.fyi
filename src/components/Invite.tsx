/* eslint-disable @next/next/no-img-element */
import { deadlineText, elegantTime, longDate } from "@/lib/format";
import type { EventRow } from "@/lib/types";

export function Invite({ event }: { event: EventRow }) {
  const rules = (event.house_rules ?? "").split("\n").map((r) => r.trim()).filter(Boolean);
  return (
    <header className="px-5 pt-10 pb-6 sm:px-8">
      <h1 className="smallcaps text-center text-[30px] leading-tight text-cream italic sm:text-[40px]">
        {event.title}
      </h1>
      <div className="rule mx-auto mt-5 w-40" />

      {event.tagline && <p className="mt-6 text-[20px] italic">{event.tagline}</p>}

      <p className="mt-5 text-[19px] font-semibold">
        {longDate(event.event_date)}
        <br />
        Seated dinner will begin at {elegantTime(event.dinner_time)}.
      </p>

      {event.invite_copy && <p className="mt-5 text-[19px] italic">{event.invite_copy}</p>}

      {event.rsvp_deadline && (
        <p className="mt-5 text-[19px] italic">
          For the sake of planning, kindly have all RSVPs and contributions submitted by{" "}
          {deadlineText(event.rsvp_deadline)}.
        </p>
      )}

      {(event.location_name || event.address) && (
        <p className="mt-5 text-[19px] font-semibold">
          Location
          <br />
          {event.location_name}
          {event.address?.split("\n").map((l) => (
            <span key={l}>
              <br />
              {l}
            </span>
          ))}
        </p>
      )}

      {event.theme.collage && (
        <img
          src={event.theme.collage}
          alt="A collage of old New York photographs: the parade, snowy Fifth Avenue, skaters in Central Park, a holiday table."
          className="mx-auto mt-8 w-full max-w-md"
        />
      )}

      {rules.length > 0 && (
        <div className="mt-8">
          <h2 className="smallcaps text-center text-[17px] text-gold">A few notes for this year</h2>
          <ul className="mt-3 space-y-3">
            {rules.map((r) => (
              <li key={r} className="flex gap-3 text-[18px] italic">
                <span aria-hidden className="text-gold">✦</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
