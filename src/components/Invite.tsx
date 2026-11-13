/* eslint-disable @next/next/no-img-element */
import { deadlineText, elegantTime, longDate } from "@/lib/format";
import type { EventRow } from "@/lib/types";

/** The big first screen: what, when, a picture, and one button. */
export function InviteCover({ event, href }: { event: EventRow; href: string }) {
  return (
    <header className="flex min-h-dvh flex-col justify-between px-5 pt-8 pb-8 sm:px-8">
      <div>
      <h1 className="smallcaps text-center text-[32px] leading-tight text-cream italic sm:text-[46px]">{event.title}</h1>
      <div className="rule mx-auto mt-5 w-40" />
      {event.tagline && <p className="mt-5 text-center text-[20px] italic">{event.tagline}</p>}
      <p className="mt-4 text-center text-[19px] font-semibold">
        {longDate(event.event_date)}
        <br />
        <span className="font-normal italic">Dinner at {elegantTime(event.dinner_time)}</span>
      </p>
      {event.theme.collage && (
        <img
          src={event.theme.collage}
          alt="A collage of old New York photographs"
          className="mx-auto mt-6 max-h-[42dvh] w-auto max-w-full object-contain"
        />
      )}
      </div>
      <a href={href} className="btn btn-cream mt-6 w-full py-4 text-[17px]">
        Details &amp; RSVP
      </a>
    </header>
  );
}

/** Everything else: the invitation text, deadline, location and house notes. */
export function InviteDetails({ event }: { event: EventRow }) {
  const rules = (event.house_rules ?? "").split("\n").map((r) => r.trim()).filter(Boolean);
  return (
    <section className="px-5 pt-8 pb-6 sm:px-8">
      <h1 className="smallcaps text-center text-[26px] leading-tight text-cream italic">{event.title}</h1>
      <div className="rule mx-auto mt-4 w-32" />

      <p className="mt-6 text-[19px] font-semibold">
        {longDate(event.event_date)}
        <br />
        Seated dinner will begin at {elegantTime(event.dinner_time)}.
      </p>

      {event.invite_copy && <p className="mt-5 text-[19px] italic">{event.invite_copy}</p>}

      {event.rsvp_deadline && (
        <p className="mt-5 text-[19px] italic">
          For the sake of planning, kindly have all RSVPs and contributions submitted by {deadlineText(event.rsvp_deadline)}.
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
    </section>
  );
}
