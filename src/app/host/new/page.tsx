import Link from "next/link";
import { redirect } from "next/navigation";
import { EventFields } from "@/components/EventFields";
import { SaveButton } from "@/components/SaveButton";
import { currentUser, isHost } from "@/lib/auth";
import { createEvent, removeTemplate } from "../../[slug]/host/actions";
import { Confirm } from "@/components/Confirm";
import { sql } from "@/lib/db";
import { Footer } from "@/components/Footer";
import { TEMPLATES, template, type Template } from "@/lib/templates";
import { cookies } from "next/headers";
import { ImportBox } from "@/components/ImportBox";
import { IMPORT_COOKIE, toImported } from "@/lib/import";
import { importOn } from "@/lib/import-ai";
import type { Event } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "New event", robots: { index: false } };

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  if (!(await isHost())) redirect("/host");
  const me = (await currentUser())!;
  // Your own templates ("Save as a template" on an event), newest first, then the built-in ones.
  const mine: Template[] = (await sql<{ id: string; name: string; settings: Partial<Event>; items: string[] }[]>`
    select id, name, settings, items from templates where user_id = ${me.id} order by created_at desc`)
    .map((t) => ({ id: `u-${t.id}`, label: t.name, set: t.settings, items: t.items }));
  const t = (await searchParams).t;
  // A plan read by "Paste a text or screenshot" opens like a template (re-checked, since it comes back from a cookie).
  const read = t === "import" ? (await cookies()).get(IMPORT_COOKIE)?.value : undefined;
  const imported: Template | undefined = read ? (() => { try { return { id: "import", label: "what you pasted", ...toImported(JSON.parse(read)) }; } catch { return undefined; } })() : undefined;
  const start = imported ?? mine.find((m) => m.id === t) ?? template(t);
  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <Link href="/host" className="text-[16px] text-soft">‹ Your events</Link>
      <h1 className="mt-4 text-[28px] font-bold">New event</h1>
      {/* Templates stay out of the way: one quiet line, and picking one only fills in settings you can change. */}
      {start ? (
        <p className="mt-1 text-[15px] text-soft">
          {start.id === "import"
            ? <>Filled in from what you pasted. <strong className="font-semibold text-ink">Check everything</strong>, then create the event.</>
            : <>Started from <strong className="font-semibold text-ink">{start.label}</strong></>}{" "}
          · <Link href="/host/new" className="underline underline-offset-2">Start blank</Link>
        </p>
      ) : (
        <>
        {importOn() && <ImportBox address={process.env.INBOUND_ADDRESS?.trim() || null} />}
        <details className="mt-1 text-[15px]">
          <summary className="cursor-pointer list-none text-soft underline underline-offset-2 [&::-webkit-details-marker]:hidden">Start from a template</summary>
          {mine.length > 0 && (
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {mine.map((m) => (
                <li key={m.id} className="flex min-h-[48px] items-center justify-between gap-3 py-1">
                  <Link href={`/host/new?t=${m.id}`} className="font-semibold text-ink underline underline-offset-2">{m.label}</Link>
                  <span className="shrink-0 text-[14px] text-soft"><Confirm label="Remove" action={removeTemplate.bind(null, m.id.slice(2))} /></span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => <Link key={t.id} href={`/host/new?t=${t.id}`} className="pill px-3 py-1.5 text-[15px]">{t.label}</Link>)}
          </div>
          <p className="mt-2 text-[14px] text-soft">It only fills things in; change anything after. To make your own, open any event and tap Save as a template.</p>
        </details>
        </>
      )}
      <form action={createEvent} className="mt-4 space-y-3">
        <EventFields key={start?.id ?? "blank"} start={start} needed={(start?.items ?? []).map((name) => ({ name, by: null }))} />
        <SaveButton className="btn w-full">Create event</SaveButton>
      </form>
    </main>
    <Footer />
    </>
  );
}
