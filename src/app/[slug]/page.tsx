import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventView } from "@/components/EventView";
import { RsvpButton } from "@/components/RsvpButton";
import { hostRole } from "@/lib/auth";
import { getEvent, getEventData, joinNames } from "@/lib/data";
import { when } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { Costs } from "@/components/Costs";
import { Gifts } from "@/components/Gifts";

export const dynamic = "force-dynamic";

// What iMessage / WhatsApp show when the link is pasted into a group text.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug, true);
  if (!e) return { robots: { index: false } };
  const preview = `You're invited: ${e.title}`;
  const description = `${when(e)}${e.place ? ` · ${e.place}` : ""}`;
  // No cover photo: a generated card with the title, date and place, so text previews never come up blank.
  const images = [e.cover_url || `/${e.slug}/og`];
  return {
    title: e.title, description,
    robots: { index: false, follow: false }, // invites are private: never in search results

    openGraph: { title: preview, description, images },
    twitter: { card: "summary_large_image", title: preview, description, images },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug, true);
  if (!data) notFound();
  // If this phone already replied, the button opens their reply instead of a new one.
  const saved = (await cookies()).get(`chirk_${slug}`)?.value;
  const mine = data.households.find((h) => h.token === saved);
  const href = mine ? `/${slug}/r/${mine.token}` : `/${slug}/rsvp`;
  const host = !!(await hostRole(slug));
  return (
    <>
    <main className="mx-auto max-w-lg">
      {host && (
        <a href={`/${slug}/host`} className="flex min-h-[44px] items-center border-b border-line px-5 text-[15px] font-semibold">‹ Back to host page</a>
      )}
      <EventView
        data={data}
        rsvpHref={href}
        greeting={mine && mine.going === null ? joinNames(mine.names) : undefined}
        replied={mine?.going != null}
        rsvp={<RsvpButton href={href} label={mine?.going === true ? "You’re going · Your RSVP" : mine?.going === false ? "You can’t make it · Your RSVP" : "RSVP"} quiet={mine?.going != null} />}
      />
    </main>
    {(data.event.costs_on || data.event.poker_on) && <Costs data={data} token={mine?.token ?? null} host={host} />}
    {data.event.gift_on && <Gifts data={data} token={mine?.token ?? null} host={false} />}
    <Footer />
    </>
  );
}
