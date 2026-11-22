import { notFound } from "next/navigation";
import { EmailMyLink } from "@/components/EmailMyLink";
import { RsvpForm } from "@/components/RsvpForm";
import { bringChoices, getEventData, arrivals } from "@/lib/data";
import { when } from "@/lib/format";
import { pollOf } from "@/lib/poll";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";
export const metadata = { title: "RSVP", robots: { index: false, follow: false } };

export default async function RsvpPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pick?: string; own?: string }> }) {
  const { slug } = await params;
  const q = await searchParams;
  const data = await getEventData(slug, true);
  if (!data) notFound();
  const { choices } = bringChoices(data);
  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-4 pb-12">
      {/* The event stays in view: what you're replying to. */}
      <a href={`/${slug}`} className="tap text-[17px] font-semibold">{data.event.title}</a>
      <p className="-mt-2 text-[15px] text-soft">{when(data.event)}</p>
      <h1 className="mt-6 mb-6 text-[28px] font-bold">Your RSVP</h1>
      <RsvpForm
        slug={slug} bringPrompt={data.event.bring_prompt} askKids={data.event.ask_kids} notePrompt={data.event.note_prompt} noteHint={data.event.note_hint}
        allowOwn={data.event.allow_own} notesPublic={data.event.notes_public && !data.event.hide_guests} maxGuests={data.event.max_guests} arrivals={arrivals(data.event)} poll={pollOf(data.event)} choices={choices}
        prePick={q.pick} ownFirst={q.own === "1"}
      />
      <div className="mt-8"><EmailMyLink slug={slug} /></div>
    </main>
    <Footer />
    </>
  );
}
