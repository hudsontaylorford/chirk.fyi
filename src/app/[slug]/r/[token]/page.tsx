import { notFound } from "next/navigation";
import { RsvpForm } from "@/components/RsvpForm";
import { KeepLink } from "@/components/YourLink";
import { pollOf } from "@/lib/poll";
import { arrivals, bringChoices, getEventData, joinNames, partsOf } from "@/lib/data";
import { listText, mapsUrl, when } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { Costs } from "@/components/Costs";
import { Gifts } from "@/components/Gifts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your RSVP", robots: { index: false, follow: false } };

export default async function YourRsvp({
  params, searchParams,
}: {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ new?: string; pick?: string; own?: string; change?: string }>;
}) {
  const { slug, token } = await params;
  const q = await searchParams;
  const isNew = !!q.new;
  // From the invite's Still needed (or "pick something"): open the reply with that item ready.
  const changing = !!(q.pick || q.own || q.change);
  const data = await getEventData(slug, true);
  const h = data?.households.find((x) => x.token === token);
  if (!data || !h) notFound();

  const { choices, picks, own, bringing } = bringChoices(data, h.id);
  const parts = partsOf(data.event, h);
  const poll = pollOf(data.event);
  const voted = poll ? (h.poll ?? []).filter((c) => poll.choices.includes(c)) : [];

  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-4 pb-12">

      {h.going === null ? (
        // A named guest who hasn't answered: say hi, and the reply form is right here with their names in it.
        <>
          <a href={`/${slug}`} className="tap text-[17px] font-semibold">{data.event.title}</a>
          <p className="-mt-2 text-[15px] text-soft">{when(data.event)}</p>
          <h1 className="mt-6 text-[28px] leading-tight font-bold">Hi {joinNames(h.names)}!</h1>
          <p className="mt-1 mb-6 text-[17px] text-soft">Your RSVP</p>
          <div>
        <RsvpForm
          slug={slug}
          bringPrompt={data.event.bring_prompt}
          askKids={data.event.ask_kids}
          notePrompt={data.event.note_prompt}
          noteHint={data.event.note_hint}
          allowOwn={data.event.allow_own}
          notesPublic={data.event.notes_public}
          maxGuests={data.event.max_guests}
          arrivals={arrivals(data.event)}
          poll={poll}
          choices={choices}
          prePick={q.pick} ownFirst={q.own === "1"}
          initial={{
            token, names: h.names, going: h.going, kids: h.kids, parts, poll: h.poll ?? [], note: h.note ?? "",
            picks, own,
          }}
        />
          </div>
        </>
      ) : (
        <>
      {/* The reply is done: say so, then give the plan back (when, where, calendar). No new big button. */}
      <h1 className="mt-6 text-[28px] leading-tight font-bold">
        {h.going ? (isNew ? "You’re in!" : "You’re going") : "You can’t make it"}
      </h1>
      <p className="mt-1 text-[17px] text-soft">
        {joinNames(h.names)}
        {h.kids > 0 && ` + ${h.kids} kid${h.kids > 1 ? "s" : ""}`}
      </p>

      <section className="mt-6 border-y border-line py-4">
        <h2><a href={`/${slug}`} className="tap text-[19px] font-semibold">{data.event.title}</a></h2>
        <p className="mt-1 text-[17px]">{when(data.event)}</p>
        {(data.event.place || data.event.address) && (
          <p className="text-[17px]">
            {data.event.place}
            {data.event.place && data.event.address && <span className="text-soft"> · </span>}
            {data.event.address && <a href={mapsUrl(data.event.address)} className="link">{data.event.address}</a>}
          </p>
        )}
        {h.going && <a href={`/${slug}/calendar.ics`} className="link tap text-[17px] font-semibold">Add to calendar</a>}
      </section>

      {h.going && (parts.length > 0 || data.event.bring_prompt) && (
        <p className="mt-4 text-[17px]">
          {parts.length > 0 && <>Coming to: <strong>{listText(parts)}</strong><br /></>}
          {data.event.bring_prompt && (bringing.length
            ? <>Bringing: <strong>{bringing.join(", ")}</strong></>
            : <a href="?change=1" className="link tap">Pick something to bring</a>)}
        </p>
      )}

      {/* Their vote, so it's clear it counted. Not limited to Going: a poll can ask before anyone knows. */}
      {poll && (
        <p className="mt-4 text-[17px]">
          {poll.question}{" "}
          {voted.length ? <strong>{listText(voted)}</strong> : <a href="?change=1" className="link tap">Vote</a>}
        </p>
      )}

      <details className="group mt-2" open={changing}>
        <summary className="link tap cursor-pointer list-none text-[17px] group-open:hidden [&::-webkit-details-marker]:hidden">Change my reply</summary>
        <div className="mt-8 border-t border-line pt-6">
        <RsvpForm
          slug={slug}
          bringPrompt={data.event.bring_prompt}
          askKids={data.event.ask_kids}
          notePrompt={data.event.note_prompt}
          noteHint={data.event.note_hint}
          allowOwn={data.event.allow_own}
          notesPublic={data.event.notes_public}
          maxGuests={data.event.max_guests}
          arrivals={arrivals(data.event)}
          poll={poll}
          choices={choices}
          prePick={q.pick} ownFirst={q.own === "1"}
          initial={{
            token, names: h.names, going: h.going, kids: h.kids, parts, poll: h.poll ?? [], note: h.note ?? "",
            picks, own,
          }}
        />
        </div>
      </details>

      <div className="mt-8">
        <KeepLink slug={slug} token={token} email={h.email} />
      </div>
        </>
      )}
    </main>
    {(data.event.costs_on || data.event.poker_on) && h.going !== false && <Costs data={data} token={token} host={false} />}
    {data.event.gift_on && <Gifts data={data} token={token} host={false} />}
    <Footer />
    </>
  );
}
