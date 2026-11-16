import Link from "next/link";
import { redirect } from "next/navigation";
import { EventFields } from "@/components/EventFields";
import { SaveButton } from "@/components/SaveButton";
import { isHost } from "@/lib/auth";
import { createEvent } from "../../[slug]/host/actions";
import { Footer } from "@/components/Footer";
import { TEMPLATES, template } from "@/lib/templates";

export const dynamic = "force-dynamic";
export const metadata = { title: "New event", robots: { index: false } };

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  if (!(await isHost())) redirect("/host");
  const start = template((await searchParams).t);
  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <Link href="/host" className="text-[16px] text-soft">‹ Your events</Link>
      <h1 className="mt-4 text-[28px] font-bold">New event</h1>
      {/* Templates stay out of the way: one quiet line, and picking one only fills in settings you can change. */}
      {start ? (
        <p className="mt-1 text-[15px] text-soft">
          Started from <strong className="font-semibold text-ink">{start.label}</strong> · <Link href="/host/new" className="underline underline-offset-2">Start blank</Link>
        </p>
      ) : (
        <details className="mt-1 text-[15px]">
          <summary className="cursor-pointer list-none text-soft underline underline-offset-2 [&::-webkit-details-marker]:hidden">Start from a template</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => <Link key={t.id} href={`/host/new?t=${t.id}`} className="pill px-3 py-1.5 text-[15px]">{t.label}</Link>)}
          </div>
          <p className="mt-2 text-[14px] text-soft">It only fills in settings and example wording. Change anything after.</p>
        </details>
      )}
      <form action={createEvent} className="mt-4 space-y-3">
        <EventFields key={start?.id ?? "blank"} start={start} />
        <SaveButton className="btn w-full">Create event</SaveButton>
      </form>
    </main>
    <Footer />
    </>
  );
}
