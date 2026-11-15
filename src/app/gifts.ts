"use server";

import { revalidatePath } from "next/cache";
import { hostRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import { siteUrl } from "@/lib/email";
import { drawFor, emailMatchesFor } from "@/lib/jobs";

const done = (slug: string) => revalidatePath(`/${slug}`, "layout");

/** The event, if the signed-in person hosts it and it has a gift exchange. */
async function hostEvent(slug: string) {
  if (!(await hostRole(slug))) return null;
  const [e] = await sql<{ id: string; slug: string; title: string; date: string; gift_on: boolean; gift_budget: string | null; gift_never: [string, string][]; gift_draw_on: string | null }[]>`
    select id, slug, title, date::text, gift_on, gift_budget, gift_never, gift_draw_on::text from events where slug = ${slug}`;
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
  const r = await drawFor(e);
  if ("error" in r) return r.error;
  done(slug);
  return `Names drawn for ${r.count} ✓`;
}

/** Emails each giver (with an email) their own match, with a link to their personal page. */
export async function emailMatches(slug: string): Promise<string> {
  const e = await hostEvent(slug);
  if (!e) return "Turn on the gift exchange first.";
  const r = await emailMatchesFor(e, await siteUrl());
  if (!r.total) return "Draw names first.";
  const note = r.none ? ` ${r.none} ${r.none === 1 ? "has" : "have"} no email: send them their link.` : "";
  if (process.env.VERCEL_ENV !== "production") return `Email only sends from the live site.${note}`;
  return `Sent ${r.sent} ✓${note}`;
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
