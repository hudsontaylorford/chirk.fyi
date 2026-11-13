import { EventFields } from "@/components/EventFields";
import { HostSignIn } from "@/components/HostSignIn";
import { SaveButton } from "@/components/SaveButton";
import { isHost } from "@/lib/auth";
import { sql } from "@/lib/db";
import { shortDate } from "@/lib/format";
import { createEvent, signOut } from "../[slug]/host/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Host", robots: { index: false } };

/** The host's home: every event, and a form to make a new one. */
export default async function HostHome({ searchParams }: { searchParams: Promise<{ wrong?: string }> }) {
  if (!(await isHost())) return <HostSignIn next="/host" wrong={!!(await searchParams).wrong} />;

  const events = await sql<{ slug: string; title: string; date: string; going: number }[]>`
    select e.slug, e.title, e.date::text,
      (select coalesce(sum(cardinality(h.names) + h.kids), 0)::int from households h where h.event_id = e.id and h.going) as going
    from events e order by e.date desc`;

  return (
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <div className="flex justify-end text-[16px] text-soft">
        <form action={signOut}><button>Sign out</button></form>
      </div>
      <h1 className="mt-4 text-[28px] font-bold">Your events</h1>

      <ul className="mt-3 divide-y divide-line border-y border-line">
        {events.map((e) => (
          <li key={e.slug}>
            <a href={`/${e.slug}/host`} className="flex items-baseline justify-between gap-3 py-4">
              <span>
                <span className="block text-[17px] font-semibold">{e.title}</span>
                <span className="text-[15px] text-soft">{shortDate(e.date)} · chirk.fyi/{e.slug}</span>
              </span>
              <span className="shrink-0 text-[15px] text-soft">{e.going} coming ›</span>
            </a>
          </li>
        ))}
      </ul>

      <details className="mt-8 rounded-2xl bg-wash p-4" open={events.length === 0}>
        <summary className="text-[17px] font-semibold">+ New event</summary>
        <form action={createEvent} className="mt-4 space-y-3">
          <EventFields />
          <label className="block">
            <span className="text-[15px] text-soft">Things still needed, one per line (only if there&apos;s a bring list)</span>
            <textarea name="needed" rows={4} className="field mt-1" placeholder={"Turkey & gravy\nMashed potatoes\nRolls"} />
          </label>
          <label className="block">
            <span className="text-[15px] text-soft">Web address (optional; made from the title)</span>
            <input name="slug" className="field mt-1" placeholder="e.g. molly-birthday" />
          </label>
          <SaveButton className="btn w-full">Create event</SaveButton>
        </form>
      </details>
    </main>
  );
}
