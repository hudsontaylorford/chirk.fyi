"use server";

import { revalidatePath } from "next/cache";
import { hostRole } from "@/lib/auth";
import { joinNames } from "@/lib/data";
import { sql } from "@/lib/db";
import { sendEmail, siteUrl } from "@/lib/email";
import { giftEmail } from "@/lib/gift-email";
import { drawNames } from "@/lib/gifts";

const done = (slug: string) => revalidatePath(`/${slug}`, "layout");

/** The event, if the signed-in person hosts it and it has a gift exchange. */
async function hostEvent(slug: string) {
  if (!(await hostRole(slug))) return null;
  const [e] = await sql<{ id: string; title: string; gift_on: boolean; gift_budget: string | null; gift_never: [string, string][] }[]>`
    select id, title, gift_on, gift_budget, gift_never from events where slug = ${slug}`;
  return e?.gift_on ? e : null;
}

/** Who's in: everyone ticked (of those who haven't said they can't make it). */
export async function saveGiftPeople(slug: string, f: FormData) {
  const e = await hostEvent(slug);
  if (!e) return;
  const ins = f.getAll("in").map(String);
  await sql`update households set gift_in = (id::text = any(${ins})) where event_id = ${e.id} and going is not false`;
  done(slug);
}

/** "Never draw each other": a pair of replies. */
export async function addNever(slug: string, f: FormData) {
  const e = await hostEvent(slug);
  const a = String(f.get("a") ?? ""), b = String(f.get("b") ?? "");
  if (!e || !a || !b || a === b) return;
  const [ok] = await sql`select count(*)::int as n from households where event_id = ${e.id} and id::text in (${a}, ${b})`;
  if (ok.n !== 2 || e.gift_never.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return;
  await sql`update events set gift_never = ${sql.json([...e.gift_never, [a, b]])} where id = ${e.id}`;
  done(slug);
}

export async function removeNever(slug: string, index: number) {
  const e = await hostEvent(slug);
  if (!e) return;
  await sql`update events set gift_never = ${sql.json(e.gift_never.filter((_, i) => i !== index))} where id = ${e.id}`;
  done(slug);
}

/** Draws names for everyone in, following the rules. Drawing again replaces everyone's match. */
export async function drawGifts(slug: string): Promise<string> {
  const e = await hostEvent(slug);
  if (!e) return "Turn on the gift exchange first.";
  const people = (await sql<{ id: string }[]>`
    select id from households where event_id = ${e.id} and going is not false and gift_in`).map((r) => r.id);
  if (people.length < 2) return "You need at least 2 people in.";
  const draw = drawNames(people, e.gift_never);
  if (!draw) return "No draw works with these rules. Remove a rule, or add someone.";
  await sql.begin(async (tx) => {
    await tx`delete from gift_draws where event_id = ${e.id}`;
    await tx`insert into gift_draws ${tx([...draw].map(([giver, receiver]) => ({ event_id: e.id, giver, receiver })))}`;
  });
  done(slug);
  return `Names drawn for ${people.length} ✓`;
}

/** Emails each giver (with an email) their own match, with a link to their personal page. */
export async function emailMatches(slug: string): Promise<string> {
  const e = await hostEvent(slug);
  if (!e) return "Turn on the gift exchange first.";
  const rows = await sql<{ token: string; giver_id: string; giver: string[]; email: string | null; receiver: string[]; wish: string | null }[]>`
    select g.token, g.id as giver_id, g.names as giver, g.email, r.names as receiver, r.gift_wish as wish
    from gift_draws d join households g on g.id = d.giver join households r on r.id = d.receiver where d.event_id = ${e.id}`;
  if (!rows.length) return "Draw names first.";
  const base = await siteUrl();
  let sent = 0;
  const withEmail = rows.filter((r) => r.email);
  for (const r of withEmail) {
    const mail = giftEmail({
      title: e.title, giver: joinNames(r.giver), receiver: joinNames(r.receiver), budget: e.gift_budget, wish: r.wish,
      url: `${base}/${slug}/r/${r.token}/remember?to=invite`,
    });
    // The same match is only emailed once (a new draw is a new match).
    if (await sendEmail({ to: r.email!, ...mail, idempotencyKey: `gift-${r.giver_id}-${joinNames(r.receiver)}` })) sent++;
  }
  const none = rows.length - withEmail.length;
  const note = none ? ` ${none} ${none === 1 ? "has" : "have"} no email: send them their link.` : "";
  if (process.env.VERCEL_ENV !== "production") return `Email only sends from the live site.${note}`;
  return `Sent ${sent} ✓${note}`;
}

/** A guest's gift ideas, for whoever draws them. */
export async function saveWish(slug: string, token: string, _prev: string | null, f: FormData): Promise<string> {
  const wish = String(f.get("wish") ?? "").trim().slice(0, 300);
  const [h] = await sql`
    update households h set gift_wish = ${wish || null}
    from events e where e.id = h.event_id and e.slug = ${slug} and e.gift_on and h.token = ${token} and h.going is not false
    returning h.id`;
  if (!h) return "Couldn't save that.";
  done(slug);
  return "Saved ✓";
}
