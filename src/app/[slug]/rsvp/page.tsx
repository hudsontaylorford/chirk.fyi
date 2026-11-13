import { notFound } from "next/navigation";
import { EmailMyLink } from "@/components/EmailMyLink";
import { RsvpForm } from "@/components/RsvpForm";
import { getEventData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "RSVP" };

export default async function RsvpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug, true);
  if (!data) notFound();
  const open = data.items.filter((i) => i.kind === "needed" && !i.household_id);
  return (
    <main className="mx-auto max-w-lg px-5 pt-4 pb-12">
      <a href={`/${slug}`} className="text-[16px] text-soft">‹ {data.event.title}</a>
      <h1 className="mt-4 mb-4 text-[28px] font-bold">RSVP</h1>
      <div className="mb-6"><EmailMyLink slug={slug} /></div>
      <RsvpForm slug={slug} bringPrompt={data.event.bring_prompt} askKids={data.event.ask_kids} openItems={open} />
    </main>
  );
}
