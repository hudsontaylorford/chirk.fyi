import Link from "next/link";
import { listEvents } from "@/lib/data";
import { longDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = await listEvents();
  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center">
      <h1 className="smallcaps text-3xl italic">At the Fords</h1>
      <div className="rule mx-auto mt-5 w-40" />
      {events.length === 0 ? (
        <p className="mt-8 italic">Nothing on the calendar just yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/${e.slug}`} className="text-xl italic underline decoration-gold underline-offset-4">
                {e.title}
              </Link>
              <p className="text-[15px] opacity-80">{longDate(e.event_date)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
