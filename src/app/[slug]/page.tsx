import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventView } from "@/components/EventView";
import { RsvpButton } from "@/components/RsvpButton";
import { isHost } from "@/lib/auth";
import { getEvent, getEventData, joinNames } from "@/lib/data";
import { when } from "@/lib/format";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

// What iMessage / WhatsApp show when the link is pasted into a group text.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug, true);
  if (!e) return {};
  const preview = `You're invited: ${e.title}`;
  const description = `${when(e)}${e.place ? ` · ${e.place}` : ""}`;
  // No cover photo: a generated card with the title, date and place, so text previews never come up blank.
  const images = [e.cover_url || `/${e.slug}/og`];
  return {
    title: e.title, description,
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
  return (
    <>
    <main className="mx-auto max-w-lg">
      {(await isHost()) && (
        <a href={`/${slug}/host`} className="block bg-ink px-5 py-2.5 text-[15px] font-semibold text-white">‹ Back to host page</a>
      )}
      <EventView
        data={data}
        rsvpHref={href}
        greeting={mine && mine.going === null ? joinNames(mine.names) : undefined}
        rsvp={<RsvpButton href={href} label={mine?.going != null ? "Your RSVP" : "RSVP"} quiet={mine?.going != null} />}
      />
    </main>
    <Footer />
    </>
  );
}
