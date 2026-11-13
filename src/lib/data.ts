import { isHost } from "./auth";
import { sql } from "./db";
import type { Claim, Event, EventData, Household, Item } from "./types";
import { arrivalChoices, parseSchedule } from "./schedule.ts";

/** `forGuest`: drafts stay hidden from everyone but the host. */
export async function getEvent(slug: string, forGuest = false) {
  const [e] = await sql<Event[]>`
    select id, slug, title, date::text, time::text, end_time::text, place, address, details, rsvp_by::text, cover_url, bring_prompt, status, ask_kids, notify_host, note_prompt, note_hint, allow_doubles, allow_own, notes_public, max_guests, schedule, ask_arrival
    from events where slug = ${slug}`;
  if (!e || (forGuest && e.status === "draft" && !(await isHost()))) return null;
  return e;
}

export async function getEventData(slug: string, forGuest = false): Promise<EventData | null> {
  const event = await getEvent(slug, forGuest);
  if (!event) return null;
  const [households, items, claims] = await Promise.all([
    sql<Household[]>`select id, token, names, going, kids, note, updated_by, email, arrival from households where event_id = ${event.id} order by created_at`,
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
      ...(data.event.allow_doubles ? others.map((r) => ({ id: r.item.id, name: r.item.name, by: r.who })) : []),
    ],
    picks: mine.filter((r) => !ownAdded(r)).map((r) => r.item.id),
    own: mine.filter(ownAdded).map((r) => r.item.name),
    bringing: mine.map((r) => r.item.name),
  };
}

/** The stages guests can say they're arriving for; empty when the event doesn't ask. */
export const arrivals = (e: Event) => (e.ask_arrival ? arrivalChoices(parseSchedule(e.schedule, e.time)) : []);
