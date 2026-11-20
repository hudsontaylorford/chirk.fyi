import { AutoRefresh } from "@/components/AutoRefresh";
import Link from "next/link";
import { HostSignIn } from "@/components/HostSignIn";
import { BulkBar, Pick } from "@/components/BulkBar";
import { SaveButton } from "@/components/SaveButton";
import { currentUser, hasLegacyCookie, unclaimedEvents } from "@/lib/auth";
import { sql } from "@/lib/db";
import { headcount, shortDate } from "@/lib/format";
import { acceptTerms, saveName, signOut } from "./sign-in";
import { bulkEvents } from "../[slug]/host/actions";
import { TERMS_VERSION } from "@/lib/terms";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Host", robots: { index: false } };

type Row = { id: string; slug: string; title: string; date: string; status: string; hosted_by: string | null; going: number; past: boolean };

/** The host's home: upcoming events (soonest first), then past and archived ones tucked away. */
export default async function HostHome({ searchParams }: { searchParams: Promise<{ wrong?: string; email?: string }> }) {
  const me = await currentUser();
  if (!me) {
    const q = await searchParams;
    return <HostSignIn claiming={await hasLegacyCookie()} legacy={(await unclaimedEvents()) > 0} wrong={!!q.wrong} email={q.email} />;
  }

  const rows = await sql<Omit<Row, "going">[]>`
    select e.id, e.slug, e.title, e.date::text, e.status, e.hosted_by,
      e.date < (now() at time zone 'America/New_York')::date as past
    from events e join event_hosts eh on eh.event_id = e.id and eh.user_id = ${me.id}
    order by e.date`;
  // Who's coming, counted exactly as on each event's page ("Graham and Ellen" in one box is two people).
  const coming = rows.length
    ? await sql<{ event_id: string; names: string[]; kids: number }[]>`
        select event_id, names, kids from households where going and event_id in ${sql(rows.map((r) => r.id))}`
    : [];
  const events: Row[] = rows.map((r) => ({
    ...r,
    going: coming.filter((h) => h.event_id === r.id).reduce((n, h) => n + headcount(h.names) + h.kids, 0),
  }));
  // Invited: upcoming live events with a reply under your email (signing in proved it's yours), except ones you host.
  // shortcut: past invites aren't listed; add a Past section here if people ask for their history.
  const invites = await sql<{ slug: string; title: string; date: string; hosted_by: string | null; token: string; going: boolean | null }[]>`
    select distinct on (e.id) e.slug, e.title, e.date::text, e.hosted_by, h.token, h.going
    from households h join events e on e.id = h.event_id
    where lower(h.email) = ${me.email} and e.status = 'live' and e.date >= (now() at time zone 'America/New_York')::date
      and not exists (select 1 from event_hosts eh where eh.event_id = e.id and eh.user_id = ${me.id})
    order by e.id, h.going is null, h.id`;
  invites.sort((a, b) => a.date.localeCompare(b.date));
  const archived = events.filter((e) => e.status === "archived").reverse();
  const past = events.filter((e) => e.status !== "archived" && e.past).reverse();
  const upcoming = events.filter((e) => e.status !== "archived" && !e.past);

  const invited = invites.length > 0 && (
    <section className={events.length ? "mt-8" : "mt-6"}>
      {events.length > 0 && <h2 className="text-[20px] font-bold">Your plans</h2>}
      <p className="text-[15px] text-soft">Every invite you get, in one place.</p>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {invites.map((i) => (
          <li key={i.slug}>
            <a href={`/${i.slug}/r/${i.token}/remember${i.going === null ? "?to=invite" : ""}`} className="flex items-baseline justify-between gap-3 py-4">
              <span className="min-w-0">
                <span className="block text-[17px] font-semibold">{i.title}</span>
                <span className="block text-[15px] text-soft">{[shortDate(i.date), i.hosted_by && `Hosted by ${i.hosted_by}`].filter(Boolean).join(" · ")}</span>
              </span>
              <span className={`shrink-0 text-[15px] ${i.going ? "text-green-700" : "text-soft"}`}>{i.going === null ? "No reply yet" : i.going ? "Going" : "Can’t make it"}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <AutoRefresh />
      <div className="flex justify-end text-[16px] text-soft">
        <form action={signOut}><button className="tap">Sign out</button></form>
      </div>
      {/* Someone who only has invites sees "Your plans" first; making their own is a link either way. */}
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h1 className="text-[28px] font-bold">{events.length ? "Your events" : "Your plans"}</h1>
        {events.length > 0 && <Link href="/host/new" className="link tap shrink-0 text-[17px] font-semibold">+ New event</Link>}
      </div>
      <p className="text-[15px] text-soft">Signed in as {me.email}</p>
      {me.terms_version !== TERMS_VERSION && (
        <form action={acceptTerms} className="mt-4 flex items-center justify-between gap-3 border-y border-line py-4 text-[15px]">
          <span>chirk now has <Link href="/terms" className="link">Terms</Link>. Using chirk means you agree to them and the <Link href="/privacy" className="link">Privacy</Link> policy.</span>
          <SaveButton className="button-quiet shrink-0 whitespace-nowrap">Got it</SaveButton>
        </form>
      )}
      {!me.name && events.length > 0 && (
        <form action={saveName} className="mt-4 border-y border-line py-4">
          <label className="text-[15px] font-semibold" htmlFor="name">What should co-hosts see you as?</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input id="name" name="name" className="field min-w-0 flex-[1_1_10rem]" placeholder="Your first name" required />
            <SaveButton className="button-quiet shrink-0 min-h-[3.2rem]">Save</SaveButton>
          </div>
        </form>
      )}
      {!events.length && <>{invited}<Link href="/host/new" className="link tap mt-4 text-[17px]">+ Plan your own event</Link></>}

      {/* "Select" shows a checkbox on each event (in every section); archive or delete the ticked ones. */}
      <div className="[&_.pick]:hidden [&:has(details.bulk[open])_.pick]:flex">
      {events.length > 0 && (
        <BulkBar
          formId="bulk-events"
          action={bulkEvents}
          actions={[
            { value: "archive", label: "Archive" },
            { value: "unarchive", label: "Unarchive" },
            { value: "delete", label: "Delete", confirm: "Delete the ticked events, with every reply on them? This can't be undone." },
          ]}
        />
      )}
      {upcoming.length ? <EventList events={upcoming} /> : !invites.length && <p className="mt-4 text-soft">Nothing coming up.</p>}
      {events.length > 0 && invited}
      {past.length > 0 && (
        <details className="mt-6">
          <summary className="text-[16px] font-semibold text-soft">Past ({past.length})</summary>
          <EventList events={past} />
        </details>
      )}
      {archived.length > 0 && (
        <details className="mt-4">
          <summary className="text-[16px] font-semibold text-soft">Archived ({archived.length})</summary>
          <EventList events={archived} />
        </details>
      )}
      </div>
    </main>
    <Footer />
    </>
  );
}

function EventList({ events }: { events: Row[] }) {
  return (
    <ul className="mt-3 divide-y divide-line border-y border-line">
      {events.map((e) => (
        <li key={e.slug} className="flex items-center">
          <Pick formId="bulk-events" value={e.slug} label={e.title} />
          <a href={`/${e.slug}/host`} className="flex min-w-0 flex-1 items-baseline justify-between gap-3 py-4">
            <span className="min-w-0">
              <span className="block text-[17px] font-semibold">
                {e.title}
                {/* Live is the normal state and says nothing. */}
                {e.status === "draft" && <span className="font-normal text-soft"> · Draft</span>}
              </span>
              <span className="block text-[15px] text-soft">{[shortDate(e.date), e.hosted_by && `Hosted by ${e.hosted_by}`].filter(Boolean).join(" · ")}</span>
              <span className="block truncate text-[14px] text-soft">chirk.fyi/{e.slug}</span>
            </span>
            <span className="shrink-0 text-[15px] text-soft">{e.going} coming</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
