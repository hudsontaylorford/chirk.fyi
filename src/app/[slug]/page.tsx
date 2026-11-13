import { notFound } from "next/navigation";
import { InviteCover } from "@/components/Invite";
import { getEvent } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  return event ? { title: event.title, description: event.tagline ?? undefined } : {};
}

export default async function EventCover({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();
  return (
    <main className="mx-auto max-w-xl">
      <InviteCover event={event} href={`/${slug}/details`} />
    </main>
  );
}
