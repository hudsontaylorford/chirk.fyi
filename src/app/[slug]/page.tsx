import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventView } from "@/components/EventView";
import { RsvpButton } from "@/components/RsvpButton";
import { isHost } from "@/lib/auth";
import { getEvent, getEventData } from "@/lib/data";
import { clock, longDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// What iMessage / WhatsApp show when the link is pasted into a group text.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug, true);
  if (!e) return {};
  const description = `You're invited · ${longDate(e.date)}${e.time ? ` · ${clock(e.time)}` : ""}${e.place ? ` · ${e.place}` : ""}`;
  const images = e.cover_url ? [e.cover_url] : undefined;
  return {
    title: e.title, description,
    openGraph: { title: e.title, description, images },
    twitter: { card: images ? "summary_large_image" : "summary", title: e.title, description, images },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug, true);
  if (!data) notFound();
  // If this phone already replied, the button opens their reply instead of a new one.
  const saved = (await cookies()).get(`chirk_${slug}`)?.value;
  const mine = data.households.find((h) => h.token === saved);
  return (
    <main className="mx-auto max-w-lg">
      {(await isHost()) && (
        <a href={`/${slug}/host`} className="block bg-ink px-5 py-2.5 text-[15px] font-semibold text-white">‹ Back to host page</a>
      )}
      <EventView
        data={data}
        rsvp={<RsvpButton href={mine ? `/${slug}/r/${mine.token}` : `/${slug}/rsvp`} label={mine ? "Your RSVP" : "RSVP"} quiet={!!mine} />}
      />
    </main>
  );
}
