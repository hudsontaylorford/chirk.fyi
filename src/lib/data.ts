import { hostRole } from "./auth";
import { sql } from "./db";
import type { Claim, Event, EventData, Household, Item } from "./types";
import { parseSchedule, partChoices, partsFromArrival } from "./schedule.ts";

/**
 * `forGuest`: what guests see. Drafts stay hidden from everyone but the hosts, and an empty "Hosted by"
 * falls back to the hosts' names (owner first). The host's own form gets the raw value.
 */
export async function getEvent(slug: string, forGuest = false) {
  const [e] = await sql<Event[]>`
    select id, slug, title, date::text, time::text, end_time::text, place, address, details, rsvp_by::text, cover_url, theme, bring_prompt, status, ask_kids, notify_host, note_prompt, note_hint, allow_doubles, allow_own, notes_public, hide_guests, max_guests, schedule, ask_arrival, hosted_by, long_times, costs_on, poker_on, gift_on, gift_budget, gift_rules, gift_never, gift_draw_on::text, gift_remind_ideas, gift_remind_givers, remind_replies, questions
    from events where slug = ${slug}`;
  if (!e || (forGuest && e.status === "draft" && !(await hostRole(slug)))) return null;
  if (forGuest && !e.hosted_by) {
    const hosts = await sql<{ name: string }[]>`
      select u.name from event_hosts h join users u on u.id = h.user_id
      where h.event_id = ${e.id} and u.name is not null order by h.role desc, h.created_at`;
    e.hosted_by = hosts.length ? joinNames(hosts.map((h) => h.name)) : null;
  }
  return e;
}

export async function getEventData(slug: string, forGuest = false): Promise<EventData | null> {
  const event = await getEvent(slug, forGuest);
  if (!event) return null;
  const [households, items, claims] = await Promise.all([
    sql<Household[]>`select id, token, names, going, kids, note, updated_by, email, arrival, parts, venmo, gift_in, gift_wish, answers from households where event_id = ${event.id} order by created_at`,
    sql<Item[]>`select id, kind, name, household_id from items where event_id = ${event.id} order by sort, created_at`,
    sql<Claim[]>`select c.item_id, c.household_id from claims c join items i on i.id = c.item_id
      where i.event_id = ${event.id} order by c.created_at`,
  ]);
  return { event, households, items, claims };
}

/** "Hudson & Molly", "Ann, Bo & Cy" */
export function joinNames(names: string[]) {
  return names.length <= 1 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}

/** Items in the order they were first claimed, each with who's bringing it; plus what's still unclaimed. */
export function bringList({ households, items, claims }: EventData) {
  const names = new Map(households.map((h) => [h.id, joinNames(h.names)]));
  const by = new Map<string, string[]>();
  for (const c of claims) by.set(c.item_id, [...(by.get(c.item_id) ?? []), c.household_id]);
  const byId = new Map(items.map((i) => [i.id, i]));
  return {
    claimed: [...by.keys()].map((id) => ({ item: byId.get(id)!, households: by.get(id)!, who: by.get(id)!.map((h) => names.get(h)).join(", ") })).filter((r) => r.item),
    open: items.filter((i) => i.kind === "needed" && !by.has(i.id)),
  };
}

/** What one reply is bringing, and the chips its RSVP form offers. */
export function bringChoices(data: EventData, householdId?: string) {
  const { claimed, open } = bringList(data);
  const mine = claimed.filter((r) => householdId && r.households.includes(householdId));
  const others = claimed.filter((r) => !householdId || !r.households.includes(householdId));
  const ownAdded = (r: (typeof claimed)[number]) => r.item.kind !== "needed" && r.item.household_id === householdId;
  return {
    // Chips: what's still needed, what I picked, and (when doubling up is on) what others are bringing.
    choices: [
      ...open.map((i) => ({ id: i.id, name: i.name, by: null as string | null })),
      ...mine.filter((r) => !ownAdded(r)).map((r) => ({ id: r.item.id, name: r.item.name, by: null })),
      ...(data.event.allow_doubles ? others.map((r) => ({ id: r.item.id, name: r.item.name, by: data.event.hide_guests ? null : r.who })) : []),
    ],
    picks: mine.filter((r) => !ownAdded(r)).map((r) => r.item.id),
    own: mine.filter(ownAdded).map((r) => r.item.name),
    bringing: mine.map((r) => r.item.name),
  };
}

/** The parts of the day guests can pick; empty when the event doesn't ask. */
export const arrivals = (e: Event) => (e.ask_arrival ? partChoices(parseSchedule(e.schedule, e.time)) : []);

/** The parts a reply is coming to (older replies said one arrival time instead). */
export const partsOf = (e: Event, h: Household) => {
  const choices = arrivals(e);
  return (h.parts ?? partsFromArrival(parseSchedule(e.schedule, e.time), h.arrival)).filter((p) => choices.includes(p));
};

export type CostRow = { id: string; what: string; amount: number; paid_by: string; split: { who: string; shares: number }[] };

/** An event's shared costs (with who each is split between) and the payments marked as made. */
export async function getCosts(eventId: string) {
  const [costs, payments, poker] = await Promise.all([
    sql<CostRow[]>`
      select c.id, c.what, c.amount, c.paid_by,
        coalesce((select json_agg(json_build_object('who', s.household_id, 'shares', s.shares)) from cost_shares s where s.cost_id = c.id), '[]') as split
      from costs c where c.event_id = ${eventId} order by c.created_at`,
    sql<{ from_household: string; to_household: string; amount: number }[]>`
      select from_household, to_household, amount from payments where event_id = ${eventId} order by created_at`,
    sql<{ id: string; who: string; kind: "buyin" | "cashout"; amount: number }[]>`
      select id, household_id as who, kind, amount from poker_entries where event_id = ${eventId} order by created_at`,
  ]);
  return { costs, poker, payments: payments.map((p) => ({ from: p.from_household, to: p.to_household, amount: p.amount })) };
}

/** The latest gift-exchange draw: giver → receiver. */
export async function getDraws(eventId: string) {
  const rows = await sql<{ giver: string; receiver: string }[]>`select giver, receiver from gift_draws where event_id = ${eventId}`;
  return new Map(rows.map((r) => [r.giver, r.receiver]));
}

/** Scheduled sends already done for an event: job → when. */
export async function getSentJobs(eventId: string) {
  const rows = await sql<{ job: string; sent_at: Date }[]>`select job, sent_at from sent_jobs where event_id = ${eventId}`;
  return new Map(rows.map((r) => [r.job, r.sent_at]));
}
