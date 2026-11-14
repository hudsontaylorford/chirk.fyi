import Link from "next/link";
import { HostSignIn } from "@/components/HostSignIn";
import { isHost } from "@/lib/auth";
import { sql } from "@/lib/db";
import { shortDate } from "@/lib/format";
import { signOut } from "../[slug]/host/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Host", robots: { index: false } };

type Row = { slug: string; title: string; date: string; status: string; hosted_by: string | null; going: number; past: boolean };

/** The host's home: upcoming events (soonest first), then past and archived ones tucked away. */
export default async function HostHome({ searchParams }: { searchParams: Promise<{ wrong?: string }> }) {
  if (!(await isHost())) return <HostSignIn next="/host" wrong={!!(await searchParams).wrong} />;

  const events = await sql<Row[]>`
    select e.slug, e.title, e.date::text, e.status, e.hosted_by,
      e.date < (now() at time zone 'America/New_York')::date as past,
      (select coalesce(sum(cardinality(h.names) + h.kids), 0)::int from households h where h.event_id = e.id and h.going) as going
    from events e order by e.date`;
  const archived = events.filter((e) => e.status === "archived").reverse();
  const past = events.filter((e) => e.status !== "archived" && e.past).reverse();
  const upcoming = events.filter((e) => e.status !== "archived" && !e.past);

  return (
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <div className="flex justify-end text-[16px] text-soft">
        <form action={signOut}><button>Sign out</button></form>
      </div>
      <h1 className="mt-4 text-[28px] font-bold">Your events</h1>
      <Link href="/host/new" className="btn mt-4 w-full">+ New event</Link>

      {upcoming.length ? <EventList events={upcoming} /> : <p className="mt-4 text-soft">Nothing coming up.</p>}
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
    </main>
  );
}

function EventList({ events }: { events: Row[] }) {
  return (
    <ul className="mt-3 divide-y divide-line border-y border-line">
      {events.map((e) => (
        <li key={e.slug}>
          <a href={`/${e.slug}/host`} className="flex items-baseline justify-between gap-3 py-4">
            <span className="min-w-0">
              <span className="block text-[17px] font-semibold">
                {e.title}
                {e.status === "draft" && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[13px] font-semibold text-amber-900">Draft</span>}
                {e.status === "live" && !e.past && <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[13px] font-semibold text-green-800">Live</span>}
              </span>
              <span className="block text-[15px] text-soft">{[shortDate(e.date), e.hosted_by && `Hosted by ${e.hosted_by}`].filter(Boolean).join(" · ")}</span>
              <span className="block truncate text-[14px] text-soft">chirk.fyi/{e.slug}</span>
            </span>
            <span className="shrink-0 text-[15px] text-soft">{e.going} coming ›</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
