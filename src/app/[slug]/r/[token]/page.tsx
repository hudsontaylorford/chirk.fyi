import { notFound } from "next/navigation";
import { RsvpForm } from "@/components/RsvpForm";
import { YourLink } from "@/components/YourLink";
import { getEventData, joinNames } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your RSVP", robots: { index: false } };

export default async function YourRsvp({
  params, searchParams,
}: {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { slug, token } = await params;
  const isNew = !!(await searchParams).new;
  const data = await getEventData(slug, true);
  const h = data?.households.find((x) => x.token === token);
  if (!data || !h) notFound();

  const mine = data.items.filter((i) => i.household_id === h.id);
  const picked = mine.find((i) => i.kind === "needed");
  const own = mine.find((i) => i.kind === "main");
  const extra = mine.find((i) => i.kind === "extra");
  const open = data.items.filter((i) => i.kind === "needed" && (!i.household_id || i.household_id === h.id));
  const bringing = [picked ?? own, extra].filter(Boolean).map((i) => i!.name);

  return (
    <main className="mx-auto max-w-lg px-5 pt-4 pb-12">
      <a href={`/${slug}`} className="text-[16px] text-soft">‹ {data.event.title}</a>

      <h1 className="mt-6 text-[28px] leading-tight font-bold">
        {h.going ? (isNew ? "You're in!" : "You're going") : "You can't make it"}
      </h1>
      <p className="mt-1 text-[17px] text-soft">
        {joinNames(h.names)}
        {h.kids > 0 && ` + ${h.kids} kid${h.kids > 1 ? "s" : ""}`}
      </p>
      {h.going && (
        <p className="mt-3 text-[17px]">
          {bringing.length ? <>Bringing: <strong>{bringing.join(" and ")}</strong></> : "Not bringing anything yet."}
        </p>
      )}

      <div className="mt-6">
        <YourLink slug={slug} token={token} />
      </div>

      <details className="group mt-3">
        <summary className="btn btn-quiet list-none group-open:hidden">Change my reply</summary>
        <div className="mt-8 border-t border-line pt-6">
        <RsvpForm
          slug={slug}
          bringPrompt={data.event.bring_prompt}
          askKids={data.event.ask_kids}
          notePrompt={data.event.note_prompt}
          noteHint={data.event.note_hint}
          openItems={open}
          initial={{
            token, names: h.names, going: h.going, kids: h.kids, note: h.note ?? "", email: h.email ?? "",
            mainItemId: picked?.id ?? null, mainName: own?.name ?? "", extra: extra?.name ?? "",
          }}
        />
        </div>
      </details>
    </main>
  );
}
