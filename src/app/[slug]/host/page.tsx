import Link from "next/link";
import { notFound } from "next/navigation";
import { EventFields } from "@/components/EventFields";
import { HostSignIn } from "@/components/HostSignIn";
import { SaveButton } from "@/components/SaveButton";
import { CopyLink } from "@/components/YourLink";
import { isHost } from "@/lib/auth";
import { getEventData, joinNames } from "@/lib/data";
import * as act from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Host", robots: { index: false } };

export default async function HostPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ wrong?: string }>;
}) {
  const { slug } = await params;
  const data = await getEventData(slug);
  if (!data) notFound();

  if (!(await isHost())) return <HostSignIn next={`/${slug}/host`} wrong={!!(await searchParams).wrong} />;

  const { event, households, items } = data;
  const going = households.filter((h) => h.going);
  const adults = going.reduce((n, h) => n + h.names.length, 0);
  const kids = going.reduce((n, h) => n + h.kids, 0);
  const who = new Map(households.map((h) => [h.id, joinNames(h.names)]));
  const needed = items.filter((i) => i.kind === "needed");
  const open = needed.filter((i) => !i.household_id).length;

  return (
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <div className="flex justify-between text-[16px] text-soft">
        <Link href="/host">‹ All events</Link>
        <a href={`/${slug}`} className="font-semibold text-ink">View invite</a>
      </div>
      <h1 className="mt-4 text-[28px] font-bold">{event.title}</h1>
      {event.status === "draft" && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-[16px]">
          <span><strong>Draft.</strong> Only you can see it. Check the details, then publish.</span>
          <form action={act.setStatus.bind(null, slug, "live")}><SaveButton>Publish</SaveButton></form>
        </div>
      )}
      {event.status === "archived" && (
        <p className="mt-3 rounded-2xl bg-wash p-4 text-[16px]"><strong>Archived.</strong> The invite still works; it&apos;s just tucked away on your events list.</p>
      )}

      <div className={`mt-4 grid gap-2 text-center ${event.ask_kids ? "grid-cols-3" : "grid-cols-2"}`}>
        <Stat n={adults} label="adults" />
        {event.ask_kids && <Stat n={kids} label="kids" />}
        <Stat n={open} label="still needed" />
      </div>

      <h2 className="mt-8 text-[20px] font-bold">Replies</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {households.length === 0 && <li className="py-3 text-soft">Nobody yet.</li>}
        {households.map((h) => {
          const bringing = items.filter((i) => i.household_id === h.id).map((i) => i.name);
          return (
            <li key={h.id} className="py-3 text-[16px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[17px] font-semibold">
                  {joinNames(h.names)}
                  {h.kids > 0 && <span className="font-normal text-soft"> +{h.kids} kid{h.kids > 1 ? "s" : ""}</span>}
                </span>
                <span className={h.going ? "text-green-700" : "text-soft"}>{h.going ? "Going" : "Can't"}</span>
              </div>
              {bringing.length > 0 && <p>{bringing.join(" · ")}</p>}
              {h.note && <p className="mt-1 rounded-lg bg-wash px-3 py-2">“{h.note}”</p>}
              {h.updated_by && <p className="text-[14px] text-soft">Last changed by {h.updated_by}</p>}
              <div className="mt-2 flex gap-5 text-[15px]">
                <CopyLink path={`/${slug}/r/${h.token}`} label="Copy their link" />
                <a href={`/${slug}/r/${h.token}`} className="font-semibold underline underline-offset-2">Edit</a>
                <Confirm label="Delete" action={act.removeHousehold.bind(null, slug, h.id)} />
              </div>
            </li>
          );
        })}
      </ul>

      {event.bring_prompt && (
        <>
          <h2 className="mt-8 text-[20px] font-bold">Needed list</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {needed.map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-3 py-3 text-[16px]">
                <span>{i.name}</span>
                <span className="flex items-baseline gap-3">
                  {i.household_id ? <span className="text-soft">{who.get(i.household_id)}</span> : <span className="font-semibold">Open</span>}
                  <Confirm label="✕" action={act.removeItem.bind(null, slug, i.id)} />
                </span>
              </li>
            ))}
          </ul>
          <form action={act.addItem.bind(null, slug)} className="mt-3 flex gap-2">
            <input name="name" className="field" placeholder="Add something needed" />
            <SaveButton>Add</SaveButton>
          </form>
        </>
      )}

      <details className="mt-8 rounded-2xl bg-wash p-4">
        <summary className="text-[17px] font-semibold">Edit event</summary>
        <form action={act.saveEvent.bind(null, slug)} className="mt-4 space-y-3">
          <EventFields event={event} />
          <SaveButton className="btn w-full">Save</SaveButton>
        </form>
      </details>

      <div className="mt-6 space-y-2">
        <form action={act.copyToNextYear.bind(null, slug)}>
          <SaveButton className="btn btn-quiet w-full">Copy to next year (as a draft)</SaveButton>
        </form>
        <form action={act.setStatus.bind(null, slug, event.status === "archived" ? "live" : "archived")}>
          <SaveButton className="btn btn-quiet w-full">{event.status === "archived" ? "Unarchive" : "Archive"}</SaveButton>
        </form>
      </div>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-wash py-3">
      <div className="text-[28px] font-bold tabular-nums">{n}</div>
      <div className="text-[14px] text-soft">{label}</div>
    </div>
  );
}

/** Two-step delete without any client code: tap, then confirm. */
function Confirm({ label, action }: { label: string; action: () => Promise<void> }) {
  return (
    <details className="inline">
      <summary className="cursor-pointer list-none font-semibold text-red-700 underline underline-offset-2">{label}</summary>
      <form action={action} className="inline">
        <button className="ml-2 font-semibold text-red-700">Sure?</button>
      </form>
    </details>
  );
}
