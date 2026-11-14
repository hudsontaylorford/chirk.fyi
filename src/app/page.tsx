import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { isHost } from "@/lib/auth";
import { sql } from "@/lib/db";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * The home page. Events are invite-only, so strangers just see the name.
 * A phone that has replied to events sees them here ("Your plans"), from the cookie each reply leaves.
 */
export default async function Home() {
  const tokens = (await cookies()).getAll().filter((c) => c.name.startsWith("chirk_")).map((c) => c.value);
  const plans = tokens.length
    ? await sql<{ slug: string; title: string; date: string; going: boolean | null; token: string }[]>`
        select e.slug, e.title, e.date::text, h.going, h.token
        from households h join events e on e.id = h.event_id
        where h.token = any(${tokens}) and e.status = 'live' and e.date >= current_date - 1
        order by e.date`
    : [];
  const known = tokens.length > 0 || (await isHost());

  return (
    <>
    <main className={`mx-auto flex max-w-lg flex-col justify-center px-5 py-12 ${known ? "min-h-[75dvh]" : "min-h-dvh"}`}>
      <div className="text-center">
        <h1 className="text-2xl font-semibold">chirk*</h1>
      </div>
      {plans.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[20px] font-bold">Your plans</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {plans.map((p) => (
              <li key={p.slug}>
                <a href={`/${p.slug}`} className="flex items-baseline justify-between gap-3 py-4">
                  <span>
                    <span className="block text-[17px] font-semibold">{p.title}</span>
                    <span className="text-[15px] text-soft">{shortDate(p.date)}</span>
                  </span>
                  <span className={`shrink-0 text-[15px] ${p.going ? "text-green-700" : "text-soft"}`}>
                    {p.going === null ? "Not answered" : p.going ? "Going" : "Can't go"} ›
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
    {known && <Footer />}
    </>
  );
}
