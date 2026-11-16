import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventFields } from "@/components/EventFields";
import { CopyInvite } from "@/components/CopyInvite";
import { SaveButton } from "@/components/SaveButton";
import { CopyLink } from "@/components/YourLink";
import { OpenRow } from "@/components/OpenRow";
import { Confirm } from "@/components/Confirm";
import { Costs } from "@/components/Costs";
import { Gifts } from "@/components/Gifts";
import { BulkBar, Pick } from "@/components/BulkBar";
import { GuestSend } from "@/components/GuestSend";
import { RemindAll } from "@/components/RemindAll";
import { MessageGuests } from "@/components/MessageGuests";
import { currentUser, hostRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AddCohost } from "@/components/AddCohost";
import { arrivals, bringList, getDraws, getEventData, getSentJobs, joinNames, partsOf } from "@/lib/data";
import { daysBefore } from "@/lib/due";
import { headcount, listText, shortDate } from "@/lib/format";
import * as act from "./actions";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Host", robots: { index: false } };

export default async function HostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug);
  if (!data) notFound();

  const role = await hostRole(slug);
  if (!role) redirect(`/${slug}`);
  const me = (await currentUser())!;
  const hosts = await sql<{ id: string; name: string | null; email: string; role: string }[]>`
    select u.id, u.name, u.email, h.role from event_hosts h join users u on u.id = h.user_id
    where h.event_id = ${data.event.id} order by h.role desc, h.created_at`;

  const { event, households, items } = data;
  const list = bringList(data);
  const whoHas = new Map(list.claimed.map((r) => [r.item.id, r.who]));
  const going = households.filter((h) => h.going);
  // Hosts are on the list (as going) but don't count as replies, and don't get their own notes.
  const isHost = (email: string | null) => !!email && hosts.some((x) => x.email === email.toLowerCase());
  const guests = households.filter((h) => !isHost(h.email));
  const answered = guests.filter((h) => h.going !== null);
  const waiting = households.filter((h) => h.going === null);
  const sent = await getSentJobs(event.id);
  const [{ myTemplates }] = await sql<{ myTemplates: number }[]>`select count(*)::int as "myTemplates" from templates where user_id = ${me.id}`;
  const nameOf = (id: string) => joinNames(households.find((h) => h.id === id)?.names ?? ["someone"]);
  // Guests with money on the event: deleting them changes everyone's settle-up, so the page warns first.
  const hasMoney = new Set((await sql<{ id: string }[]>`
    select paid_by id from costs where event_id = ${event.id} union select s.household_id from cost_shares s join costs c on c.id = s.cost_id where c.event_id = ${event.id}
    union select from_household from payments where event_id = ${event.id} union select to_household from payments where event_id = ${event.id}
    union select household_id from poker_entries where event_id = ${event.id}`).map((r) => r.id));
  const count = (hs: typeof households) => ({ email: hs.filter((h) => h.email && !isHost(h.email)).length, total: hs.filter((h) => !isHost(h.email)).length });
  const adults = going.reduce((n, h) => n + headcount(h.names), 0);
  const kids = going.reduce((n, h) => n + h.kids, 0);
  const needed = items.filter((i) => i.kind === "needed");
  const open = list.open.length;
  // People coming to each part of the day, from what each reply picked; replies that didn't pick are counted apart.
  const stages = arrivals(event);
  const size = (h: (typeof going)[number]) => headcount(h.names) + h.kids;
  const perPart = stages.map((s) => going.filter((h) => partsOf(event, h).includes(s)).reduce((n, h) => n + size(h), 0));
  const unsaid = going.filter((h) => !partsOf(event, h).length).reduce((n, h) => n + size(h), 0);

  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <div className="flex justify-between text-[16px] text-soft">
        <Link href="/host">‹ Your events</Link>
        <a href={`/${slug}`} className="font-semibold text-ink">View event</a>
      </div>
      <h1 className="mt-4 text-[28px] font-bold">{event.title}</h1>
      {/* Who hosts this: everyone here can edit and send; only the owner removes hosts or deletes the event. */}
      <div id="hosts" className="mt-1 text-[15px] text-soft">
        Hosts:{" "}
        {hosts.map((h, i) => (
          <span key={h.id}>
            {i > 0 && " · "}
            {h.id === me.id ? "you" : h.name || h.email}
            {h.role === "owner" && " (owner)"}
            {role === "owner" && h.role !== "owner" && <> <Confirm label="Remove" action={act.removeCohost.bind(null, slug, h.id)} /></>}
          </span>
        ))}
        <AddCohost action={act.addCohost.bind(null, slug)} />
      </div>
      {event.status === "draft" && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-[16px]">
          <span><strong>Draft.</strong> Only hosts can see it. Check the details, then publish.</span>
          <form action={act.setStatus.bind(null, slug, "live")}><SaveButton>Publish</SaveButton></form>
        </div>
      )}
      {event.status === "archived" && (
        <p className="mt-3 rounded-2xl bg-wash p-4 text-[16px]"><strong>Archived.</strong> The invite still works; it&apos;s just tucked away on your events list.</p>
      )}

      <div className={`mt-4 grid gap-2 text-center ${event.bring_prompt ? "grid-cols-3" : "grid-cols-2"}`}>
        <Stat n={adults + kids} label="coming" sub={kids ? `${adults} adult${adults === 1 ? "" : "s"}, ${kids} kid${kids === 1 ? "" : "s"}` : undefined} />
        <Stat
          n={answered.length}
          label={waiting.length ? `of ${guests.length} replied` : answered.length === 1 ? "reply" : "replies"}
          sub={answered.filter((h) => h.going === false).length ? `${answered.filter((h) => h.going === false).length} can't make it` : undefined}
        />
        {event.bring_prompt && <Stat n={open} label="still needed" />}
      </div>

      {stages.length > 1 && (
        <div className="mt-4">
          <p className="text-[15px] text-soft">Coming to each part</p>
          <ul className="mt-1 divide-y divide-line border-y border-line">
            {stages.map((s, i) => (
              <li key={s} className="flex justify-between gap-3 py-2 text-[16px]"><span>{s}</span><span className="font-semibold tabular-nums">{perPart[i]}</span></li>
            ))}
            {unsaid > 0 && <li className="flex justify-between gap-3 py-2 text-[16px] text-soft"><span>Didn&apos;t say</span><span className="tabular-nums">{unsaid}</span></li>}
          </ul>
        </div>
      )}

      {event.status !== "draft" && <div className="mt-6"><CopyInvite event={{ ...event, hosted_by: event.hosted_by || joinNames(hosts.filter((h) => h.name).map((h) => h.name!)) || null }} /></div>}

      {/* Everyone you've named and everyone who replied, in one list. */}
      <h2 className="mt-8 text-[20px] font-bold">Guests</h2>
      <form action={act.addGuests.bind(null, slug)} className="mt-2">
        <div className="flex gap-2">
          <input name="guests" className="field" placeholder="Sam, Graham & Ellen" aria-label="Add guests" />
          <SaveButton>Add</SaveButton>
        </div>
        <p className="mt-1 text-[14px] text-soft">Commas between guests. Add an email after a name to send it from here.</p>
      </form>
      {event.remind_replies && event.rsvp_by && (
        <p className="mt-2 text-[14px] text-soft">
          Automatic reminder to anyone who hasn&apos;t replied: {shortDate(daysBefore(event.rsvp_by, 3))}
          {sent.has("reply_reminder") ? " · sent ✓" : event.status !== "live" ? " (once published)" : ""}
        </p>
      )}
      {waiting.some((h) => h.email) && (
        <RemindAll count={waiting.filter((h) => h.email).length} action={act.remindAll.bind(null, slug)} />
      )}
      {/* "Select" shows a checkbox on each guest; the buttons act on the ticked ones. */}
      <div className="[&_.pick]:hidden [&:has(details.bulk[open])_.pick]:flex">
      {households.length > 0 && (
        <BulkBar
          formId="bulk-guests"
          action={act.bulkGuests.bind(null, slug)}
          actions={[
            { value: "invite", label: "Email invite" },
            { value: "reminder", label: "Email reminder" },
            { value: "remove", label: "Remove", confirm: `Remove the ticked guests and their replies?${hasMoney.size ? " Anyone with costs or poker also loses what they paid and owe, so everyone's settle-up changes." : ""}` },
          ]}
        />
      )}
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {households.length === 0 && <li className="py-3 text-soft">Nobody yet.</li>}
        {households.map((h) => {
          const bringing = list.claimed.filter((r) => r.households.includes(h.id)).map((r) => r.item.name);
          return (
            <li key={h.id} className="py-3 text-[16px]">
              <div className="flex items-baseline justify-between gap-2">
                <Pick formId="bulk-guests" value={h.id} label={joinNames(h.names)} />
                <span className="mr-auto text-[17px] font-semibold">
                  {joinNames(h.names)}
                  {h.kids > 0 && <span className="font-normal text-soft"> +{h.kids} kid{h.kids > 1 ? "s" : ""}</span>}
                  {isHost(h.email) && (
                    <span className="ml-2 rounded-full bg-wash px-2 py-0.5 text-[13px] font-semibold text-soft">Host</span>
                  )}
                </span>
                <span className={`shrink-0 ${h.going ? "text-green-700" : "text-soft"}`}>{h.going === null ? "No reply yet" : h.going ? "Going" : "Can't make it"}</span>
              </div>
              {h.going && partsOf(event, h).length > 0 && <p className="text-soft">Coming to {listText(partsOf(event, h))}</p>}
              {bringing.length > 0 && <p>{bringing.join(" · ")}</p>}
              {h.note && (
                <p className="mt-2 w-fit max-w-[85%] rounded-[20px] rounded-bl-[6px] bg-line px-4 py-2 leading-snug whitespace-pre-line italic">{h.note}</p>
              )}
              {h.updated_by && <p className="text-[14px] text-soft">Last changed by {h.updated_by}</p>}
              {h.email && <p className="text-[14px] text-soft">{h.email}</p>}
              {h.going === null && (
                <GuestSend
                  event={event} token={h.token} names={joinNames(h.names)} email={h.email}
                  emailInvite={act.emailGuest.bind(null, slug, h.id, "invite")}
                  emailReminder={act.emailGuest.bind(null, slug, h.id, "reminder")}
                />
              )}
              <div className="mt-2 flex gap-5 text-[14px] text-soft">
                {h.going !== null && <CopyLink path={`/${slug}/r/${h.token}`} label="Copy their link" />}
                <a href={`/${slug}/r/${h.token}`} className="underline underline-offset-2">Edit</a>
                <Confirm
                  label="Delete" action={act.removeHousehold.bind(null, slug, h.id)}
                  warn={hasMoney.has(h.id) ? "They have costs or poker on this event. Deleting them also deletes what they paid and what they owe, so everyone's settle-up changes." : undefined}
                />
              </div>
            </li>
          );
        })}
      </ul>
      </div>

      {households.length > 0 && (
        <MessageGuests
          counts={{ going: count(going), waiting: count(waiting), everyone: count(households.filter((h) => h.going !== false)) }}
          action={act.messageGuests.bind(null, slug)}
        />
      )}

      {event.bring_prompt && (
        <section>
          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="text-[20px] font-bold">What to bring</h2>
            <OpenRow id="bring">Edit list</OpenRow>
          </div>
          {list.open.length > 0 && (
            <>
              <p className="mt-3 text-[15px] text-soft">Still needed</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {list.open.map((i) => (
                  <span key={i.id} className="rounded-full border-[1.5px] border-dashed border-line px-3 py-1.5 text-[16px]">{i.name}</span>
                ))}
              </div>
            </>
          )}
          {list.claimed.length > 0 && (
            <>
              <p className="mt-3 text-[15px] text-soft">Covered</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {list.claimed.map((r) => (
                  <span key={r.item.id} className="rounded-full bg-wash px-3 py-1.5 text-[16px]">{r.item.name}</span>
                ))}
              </div>
            </>
          )}
          {!list.open.length && !list.claimed.length && <p className="mt-2 text-soft">Nothing on the list yet.</p>}
        </section>
      )}

      {(event.costs_on || event.poker_on) && <Costs data={data} token={null} host inside />}
      {event.gift_on && <Gifts data={data} token={null} host inside />}

      <h2 className="mt-8 text-[20px] font-bold">Event</h2>
      <form action={act.saveEvent.bind(null, slug)} className="mt-3 space-y-3">
        <EventFields
          event={event} needed={needed.map((i) => ({ name: i.name, by: whoHas.get(i.id) ?? null }))}
          matches={event.gift_on ? [...(await getDraws(event.id))].map(([g, r]) => `${nameOf(g)} → ${nameOf(r)}`) : []}
        />
        <SaveButton className="btn w-full">Save</SaveButton>
      </form>

      <div className="mt-6 space-y-2">
        <form action={act.copyToNextYear.bind(null, slug)}>
          <SaveButton className="btn btn-quiet w-full">Copy to next year (as a draft)</SaveButton>
        </form>
        {/* Saves this event's setup (not its title, dates or guests) as a starting point for your next New event. */}
        <details className="rounded-2xl bg-wash px-4">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-center text-[17px] font-semibold [&::-webkit-details-marker]:hidden">Save as a template</summary>
          {myTemplates >= 30 ? (
            <p className="pb-4 text-[15px] text-soft">You have 30 templates. Remove one under New event → Start from a template first.</p>
          ) : (
            <form action={act.saveTemplate.bind(null, slug)} className="space-y-2 pb-4">
              <label className="block">
                <span className="text-[15px] text-soft">Template name</span>
                <input name="name" defaultValue={event.title} maxLength={60} className="field mt-1" />
              </label>
              <p className="text-[14px] text-soft">Keeps the settings, message, times, place, photo and what to bring. Not the title, dates or guests. It shows under Start from a template on New event.</p>
              <SaveButton className="btn w-full">Save template</SaveButton>
            </form>
          )}
        </details>
        {event.status !== "draft" && (
          <form action={act.setStatus.bind(null, slug, event.status === "archived" ? "live" : "archived")}>
            <SaveButton className="btn btn-quiet w-full">{event.status === "archived" ? "Unarchive" : "Archive"}</SaveButton>
          </form>
        )}
        {role === "owner" && (
          <p className="pt-2 text-center text-[15px] text-soft">
            <Confirm label="Delete this event" action={act.deleteEvent.bind(null, slug)} />
          </p>
        )}
      </div>
    </main>
    <Footer />
    </>
  );
}

function Stat({ n, label, sub }: { n: number; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-wash px-1 py-3">
      <div className="text-[28px] font-bold tabular-nums">{n}</div>
      <div className="text-[14px] text-soft">{label}</div>
      {sub && <div className="text-[12px] text-soft">{sub}</div>}
    </div>
  );
}
