import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventView } from "@/components/EventView";
import { RsvpButton } from "@/components/RsvpButton";
import { getEvent, getEventData } from "@/lib/data";
import { clock, longDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// What iMessage / WhatsApp show when the link is pasted into a group text.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug, true);
  if (!e) return {};
  const description = `${longDate(e.date)}${e.time ? ` · ${clock(e.time)}` : ""}${e.place ? ` · ${e.place}` : ""}`;
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
      <EventView
        data={data}
        rsvp={<RsvpButton href={mine ? `/${slug}/r/${mine.token}` : `/${slug}/rsvp`} label={mine ? "Your RSVP" : "RSVP"} quiet={!!mine} />}
      />
    </main>
  );
}
