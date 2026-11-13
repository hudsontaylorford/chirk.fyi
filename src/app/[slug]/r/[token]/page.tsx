import { notFound } from "next/navigation";
import { RsvpForm } from "@/components/RsvpForm";
import { YourLink } from "@/components/YourLink";
import { bringChoices, getEventData, joinNames } from "@/lib/data";

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

  const { choices, picks, own, bringing } = bringChoices(data, h.id);

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
          {bringing.length ? <>Bringing: <strong>{bringing.join(", ")}</strong></> : "Not bringing anything yet."}
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
          choices={choices}
          initial={{
            token, names: h.names, going: h.going, kids: h.kids, note: h.note ?? "", email: h.email ?? "",
            picks, own,
          }}
        />
        </div>
      </details>
    </main>
  );
}
