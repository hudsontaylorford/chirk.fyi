"use server";

import { revalidatePath } from "next/cache";
import { hostRole } from "@/lib/auth";
import { balances, money, parseMoney, poker, settle } from "@/lib/costs";
import { getCosts } from "@/lib/data";
import { headcount } from "@/lib/format";
import { sql } from "@/lib/db";

/**
 * Who's acting on an event's shared costs: a host (signed in, hosts this event), or a guest by their reply's token.
 * Everyone on the list counts unless they've said they can't make it (no reply needed: a host can just add names).
 * Nothing works unless the event has shared costs or poker on.
 */
async function actor(slug: string, token: string | null) {
  const [e] = await sql<{ id: string; costs_on: boolean; poker_on: boolean }[]>`select id, costs_on, poker_on from events where slug = ${slug}`;
  if (!e?.costs_on && !e?.poker_on) return null;
  const host = !!(await hostRole(slug));
  const [h] = token
    ? await sql<{ id: string }[]>`select id from households where token = ${token} and event_id = ${e.id} and going is not false`
    : [];
  if (!host && !h) return null;
  return { eventId: e.id, host, household: h?.id ?? null, costs: e.costs_on, poker: e.poker_on };
}

const done = (slug: string) => revalidatePath(`/${slug}`, "layout");

/**
 * Adds a cost: what, how much, who paid (a guest: themselves; a host: anyone going) and who it's split between
 * (anyone on the list who hasn't said can't; all of them if none ticked). Each reply's share is its number of people.
 */
export async function addCost(slug: string, token: string | null, _prev: string | null, f: FormData): Promise<string> {
  const a = await actor(slug, token);
  if (!a?.costs) return "Only people on the guest list can add costs.";
  const what = String(f.get("what") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const amount = parseMoney(String(f.get("amount") ?? ""));
  if (!what) return "What was it for?";
  if (!amount) return "Add the amount, like 42.50.";
  const going = (await sql<{ id: string; names: string[]; kids: number }[]>`
    select id, names, kids from households where event_id = ${a.eventId} and going is not false`).map((g) => ({ id: g.id, size: headcount(g.names) + g.kids }));
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
  // Only a payment the settle-up still shows, one at a time per event: a double tap (or host and guest both tapping) records it once.
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext(${a.eventId}))`;
    const [e] = await tx<{ costs_on: boolean }[]>`select costs_on from events where id = ${a.eventId}`;
    const all = await getCosts(a.eventId);
    const game = poker(all.poker);
    const owed = settle(balances(e.costs_on ? all.costs.map((c) => ({ amount: c.amount, paidBy: c.paid_by, split: c.split })) : [], all.payments, game.ready ? game.nets : undefined));
    if (!owed.some((p) => p.from === from && p.to === to && p.amount === Math.round(amount))) return;
    await tx`insert into payments ${sql({ event_id: a.eventId, from_household: from, to_household: to, amount: Math.round(amount) })}`;
  });
  done(slug);
}

/** A guest's Venmo username, so others can pay them back. */
export async function saveVenmo(slug: string, token: string, _prev: string | null, f: FormData): Promise<string> {
  const a = await actor(slug, token);
  if (!a?.household) return "Only people on the guest list can add this.";
  const venmo = String(f.get("venmo") ?? "").trim().replace(/^@/, "");
  if (venmo && !/^[A-Za-z0-9_-]{2,30}$/.test(venmo)) return "That doesn't look like a Venmo username.";
  await sql`update households set venmo = ${venmo || null} where id = ${a.household}`;
  done(slug);
  return "Saved ✓";
}

/**
 * Poker: a buy-in (rebuys are more buy-ins) or a cash-out (what their chips are worth at the end; a new one replaces the old).
 * Hosts enter for any player; players enter their own.
 */
export async function addPoker(slug: string, token: string | null, _prev: string | null, f: FormData): Promise<string> {
  const a = await actor(slug, token);
  if (!a?.poker) return "Only people on the guest list can play.";
  const kind = f.get("kind") === "cashout" ? "cashout" : "buyin";
  const typed = String(f.get("amount") ?? "").trim();
  const amount = kind === "cashout" && /^\$?0+(\.0+)?$/.test(typed) ? 0 : parseMoney(typed);
  if (amount === null) return "Add the amount, like 20.";
  const [player] = await sql<{ id: string }[]>`
    select id from households where event_id = ${a.eventId} and going is not false and id = ${a.host ? String(f.get("who") ?? a.household ?? "") : a.household ?? ""}`
    .catch(() => []);
  if (!player) return "Pick a player.";
  if (kind === "cashout") {
    // Nobody can walk away with more than the whole table put in: that's a typo.
    const [{ pot }] = await sql<{ pot: number }[]>`select coalesce(sum(amount), 0)::int as pot from poker_entries where event_id = ${a.eventId} and kind = 'buyin'`;
    if (amount > pot) return `That's more than the whole table put in (${money(pot)}). Check the amount.`;
  }
  await sql.begin(async (tx) => {
    if (kind === "cashout") await tx`delete from poker_entries where event_id = ${a.eventId} and household_id = ${player.id} and kind = 'cashout'`;
    await tx`insert into poker_entries ${tx({ event_id: a.eventId, household_id: player.id, kind, amount })}`;
  });
  done(slug);
  return kind === "cashout" ? "Cash-out saved ✓" : "Buy-in added ✓";
}

/** Removes a poker entry: a host, or the player it belongs to. */
export async function removePoker(slug: string, token: string | null, id: string) {
  const a = await actor(slug, token);
  if (!a) return;
  await sql`delete from poker_entries where id = ${id} and event_id = ${a.eventId} and (${a.host} or household_id = ${a.household})`;
  done(slug);
}

/** "Buy in all": one buy-in of the amount for everyone at the table who hasn't bought in yet (so tapping twice is safe). Hosts only. */
export async function buyInAll(slug: string, _prev: string | null, f: FormData): Promise<string> {
  const a = await actor(slug, null);
  if (!a?.poker || !a.host) return "Only hosts can buy everyone in.";
  const amount = parseMoney(String(f.get("amount") ?? ""));
  if (!amount) return "Add the buy-in, like 20.";
  const added = await sql`
    insert into poker_entries (event_id, household_id, kind, amount)
    select ${a.eventId}, h.id, 'buyin', ${amount} from households h
    where h.event_id = ${a.eventId} and h.going is not false
      and not exists (select 1 from poker_entries p where p.household_id = h.id and p.kind = 'buyin')
    returning 1`;
  done(slug);
  return added.length ? `Bought in ${added.length} at ${money(amount)} ✓` : "Everyone's already bought in.";
}
