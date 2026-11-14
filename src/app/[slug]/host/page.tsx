import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventFields } from "@/components/EventFields";
import { CopyInvite } from "@/components/CopyInvite";
import { SaveButton } from "@/components/SaveButton";
import { CopyLink } from "@/components/YourLink";
import { OpenRow } from "@/components/OpenRow";
import { isHost } from "@/lib/auth";
import { arrivals, bringList, getEventData, joinNames } from "@/lib/data";
import * as act from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Host", robots: { index: false } };

export default async function HostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEventData(slug);
  if (!data) notFound();

  if (!(await isHost())) redirect(`/${slug}`);

  const { event, households, items } = data;
  const list = bringList(data);
  const whoHas = new Map(list.claimed.map((r) => [r.item.id, r.who]));
  const going = households.filter((h) => h.going);
  const adults = going.reduce((n, h) => n + h.names.length, 0);
  const kids = going.reduce((n, h) => n + h.kids, 0);
  const needed = items.filter((i) => i.kind === "needed");
  const open = list.open.length;
  // Who's there by each stage: arriving earlier counts for every later stage; no answer counts from the last.
  const stages = arrivals(event);
  const startsAt = (h: (typeof going)[number]) => (stages.includes(h.arrival ?? "") ? stages.indexOf(h.arrival!) : stages.length - 1);
  const thereBy = stages.map((_, i) => going.filter((h) => startsAt(h) <= i).reduce((n, h) => n + h.names.length + h.kids, 0));

  return (
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <div className="flex justify-between text-[16px] text-soft">
        <Link href="/host">‹ Your events</Link>
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

      <div className={`mt-4 grid gap-2 text-center ${event.bring_prompt ? "grid-cols-3" : "grid-cols-2"}`}>
        <Stat n={adults + kids} label="coming" sub={kids ? `${adults} adult${adults === 1 ? "" : "s"}, ${kids} kid${kids === 1 ? "" : "s"}` : undefined} />
        <Stat n={households.length} label={households.length === 1 ? "reply" : "replies"} sub={households.length - going.length ? `${households.length - going.length} can't make it` : undefined} />
        {event.bring_prompt && <Stat n={open} label="still needed" />}
      </div>

      {stages.length > 1 && (
        <div className="mt-4">
          <p className="text-[15px] text-soft">There by</p>
          <ul className="mt-1 divide-y divide-line border-y border-line">
            {stages.map((s, i) => (
              <li key={s} className="flex justify-between gap-3 py-2 text-[16px]"><span>{s}</span><span className="font-semibold tabular-nums">{thereBy[i]}</span></li>
            ))}
          </ul>
        </div>
      )}

      {event.status !== "draft" && <div className="mt-6"><CopyInvite event={event} /></div>}

      <h2 className="mt-8 text-[20px] font-bold">Replies</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {households.length === 0 && <li className="py-3 text-soft">Nobody yet.</li>}
        {households.map((h) => {
          const bringing = list.claimed.filter((r) => r.households.includes(h.id)).map((r) => r.item.name);
          return (
            <li key={h.id} className="py-3 text-[16px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[17px] font-semibold">
                  {joinNames(h.names)}
                  {h.kids > 0 && <span className="font-normal text-soft"> +{h.kids} kid{h.kids > 1 ? "s" : ""}</span>}
                </span>
                <span className={h.going ? "text-green-700" : "text-soft"}>{h.going ? "Going" : "Can't"}</span>
              </div>
              {h.going && h.arrival && <p className="text-soft">Coming for {h.arrival}</p>}
              {bringing.length > 0 && <p>{bringing.join(" · ")}</p>}
              {h.note && (
                <p className="mt-2 w-fit max-w-[85%] rounded-[20px] rounded-bl-[6px] bg-line px-4 py-2 leading-snug whitespace-pre-line italic">{h.note}</p>
              )}
              {h.updated_by && <p className="text-[14px] text-soft">Last changed by {h.updated_by}</p>}
              {h.email && <p className="text-[14px] text-soft">{h.email}</p>}
              <div className="mt-2 flex gap-5 text-[14px] text-soft">
                <CopyLink path={`/${slug}/r/${h.token}`} label="Copy their link" />
                <a href={`/${slug}/r/${h.token}`} className="underline underline-offset-2">Edit</a>
                <Confirm label="Delete" action={act.removeHousehold.bind(null, slug, h.id)} />
              </div>
            </li>
          );
        })}
      </ul>

      {event.bring_prompt && (
        <section>
          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="text-[20px] font-bold">What to bring</h2>
            <OpenRow id="bring">Edit list</OpenRow>
          </div>
          {list.open.length > 0 && (
            <>
              <p className="mt-3 text-[15px] text-soft">Still needed</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {list.open.map((i) => (
                  <span key={i.id} className="rounded-full border-[1.5px] border-dashed border-line px-3 py-1.5 text-[16px]">{i.name}</span>
                ))}
              </div>
            </>
          )}
          {list.claimed.length > 0 && (
            <>
              <p className="mt-3 text-[15px] text-soft">Covered</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {list.claimed.map((r) => (
                  <span key={r.item.id} className="rounded-full bg-wash px-3 py-1.5 text-[16px]">{r.item.name}</span>
                ))}
              </div>
            </>
          )}
          {!list.open.length && !list.claimed.length && <p className="mt-2 text-soft">Nothing on the list yet.</p>}
        </section>
      )}

      <h2 className="mt-8 text-[20px] font-bold">Event</h2>
      <form action={act.saveEvent.bind(null, slug)} className="mt-3 space-y-3">
        <EventFields event={event} needed={needed.map((i) => ({ name: i.name, by: whoHas.get(i.id) ?? null }))} />
        <SaveButton className="btn w-full">Save</SaveButton>
      </form>

      <div className="mt-6 space-y-2">
        <form action={act.copyToNextYear.bind(null, slug)}>
          <SaveButton className="btn btn-quiet w-full">Copy to next year (as a draft)</SaveButton>
        </form>
        <form action={act.setStatus.bind(null, slug, event.status === "archived" ? "live" : "archived")}>
          <SaveButton className="btn btn-quiet w-full">{event.status === "archived" ? "Unarchive" : "Archive"}</SaveButton>
        </form>
        <p className="pt-2 text-center text-[15px] text-soft">
          <Confirm label="Delete this event" action={act.deleteEvent.bind(null, slug)} />
        </p>
      </div>
    </main>
  );
}

function Stat({ n, label, sub }: { n: number; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-wash px-1 py-3">
      <div className="text-[28px] font-bold tabular-nums">{n}</div>
      <div className="text-[14px] text-soft">{label}</div>
      {sub && <div className="text-[12px] text-soft">{sub}</div>}
    </div>
  );
}

/** Two-step delete without any client code: tap, then confirm. */
function Confirm({ label, action }: { label: string; action: () => Promise<void> }) {
  return (
    <details className="inline">
      <summary className="inline cursor-pointer list-none underline underline-offset-2 [&::-webkit-details-marker]:hidden">{label}</summary>
      <form action={action} className="inline">
        <button className="ml-2 font-semibold text-red-700">Sure?</button>
      </form>
    </details>
  );
}
