"use server";

import { revalidatePath } from "next/cache";
import { hostRole } from "@/lib/auth";
import { parseMoney } from "@/lib/costs";
import { sql } from "@/lib/db";

/**
 * Who's acting on an event's shared costs: a host (signed in, hosts this event), or a guest by their reply's token.
 * Guests count only if they're going. Nothing works unless the event has shared costs on.
 */
async function actor(slug: string, token: string | null) {
  const [e] = await sql<{ id: string; costs_on: boolean }[]>`select id, costs_on from events where slug = ${slug}`;
  if (!e?.costs_on) return null;
  const host = !!(await hostRole(slug));
  const [h] = token
    ? await sql<{ id: string }[]>`select id from households where token = ${token} and event_id = ${e.id} and going is true`
    : [];
  if (!host && !h) return null;
  return { eventId: e.id, host, household: h?.id ?? null };
}

const done = (slug: string) => revalidatePath(`/${slug}`, "layout");

/**
 * Adds a cost: what, how much, who paid (a guest: themselves; a host: anyone going) and who it's split between
 * (anyone going; everyone going if none ticked). Each reply's share is its number of people.
 */
export async function addCost(slug: string, token: string | null, _prev: string | null, f: FormData): Promise<string> {
  const a = await actor(slug, token);
  if (!a) return "Only people who are going can add costs.";
  const what = String(f.get("what") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const amount = parseMoney(String(f.get("amount") ?? ""));
  if (!what) return "What was it for?";
  if (!amount) return "Add the amount, like 42.50.";
  const going = await sql<{ id: string; size: number }[]>`
    select id, cardinality(names) + kids as size from households where event_id = ${a.eventId} and going is true`;
  const ids = new Set(going.map((g) => g.id));
  const paidBy = a.host && ids.has(String(f.get("paid_by"))) ? String(f.get("paid_by")) : a.household;
  if (!paidBy) return "Pick who paid.";
  const picked = f.getAll("split").map(String).filter((id) => ids.has(id));
  const split = going.filter((g) => !picked.length || picked.includes(g.id));
  await sql.begin(async (tx) => {
    const [c] = await tx<{ id: string }[]>`insert into costs ${tx({ event_id: a.eventId, what, amount, paid_by: paidBy })} returning id`;
    await tx`insert into cost_shares ${tx(split.map((g) => ({ cost_id: c.id, household_id: g.id, shares: Math.max(1, g.size) })))}`;
  });
  done(slug);
  return "Added ✓";
}

/** Removes a cost: a host, or whoever paid it. */
export async function removeCost(slug: string, token: string | null, id: string) {
  const a = await actor(slug, token);
  if (!a) return;
  await sql`delete from costs where id = ${id} and event_id = ${a.eventId} and (${a.host} or paid_by = ${a.household})`;
  done(slug);
}

/** Marks a payment as made: the person being paid confirms it, or a host does. */
export async function markPaid(slug: string, token: string | null, from: string, to: string, amount: number) {
  const a = await actor(slug, token);
  if (!a || !(a.host || a.household === to) || !(amount > 0)) return;
  const [ok] = await sql`select count(*)::int as n from households where event_id = ${a.eventId} and id in (${from}, ${to})`;
  if (ok.n !== 2) return;
  await sql`insert into payments ${sql({ event_id: a.eventId, from_household: from, to_household: to, amount: Math.round(amount) })}`;
  done(slug);
}

/** A guest's Venmo username, so others can pay them back. */
export async function saveVenmo(slug: string, token: string, _prev: string | null, f: FormData): Promise<string> {
  const a = await actor(slug, token);
  if (!a?.household) return "Only people who are going can add this.";
  const venmo = String(f.get("venmo") ?? "").trim().replace(/^@/, "");
  if (venmo && !/^[A-Za-z0-9_-]{2,30}$/.test(venmo)) return "That doesn't look like a Venmo username.";
  await sql`update households set venmo = ${venmo || null} where id = ${a.household}`;
  done(slug);
  return "Saved ✓";
}
