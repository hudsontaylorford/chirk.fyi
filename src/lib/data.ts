import { sql } from "./db";
import type { Event, EventData, Household, Item } from "./types";

export async function getEvent(slug: string) {
  const [e] = await sql<Event[]>`
    select id, slug, title, date::text, time::text, place, address, details, rsvp_by::text, cover_url, bring_prompt
    from events where slug = ${slug}`;
  return e ?? null;
}

export async function getEventData(slug: string): Promise<EventData | null> {
  const event = await getEvent(slug);
  if (!event) return null;
  const [households, items] = await Promise.all([
    sql<Household[]>`select id, token, names, going, kids, note from households where event_id = ${event.id} order by created_at`,
    sql<Item[]>`select id, kind, name, household_id from items where event_id = ${event.id} order by sort, created_at`,
  ]);
  return { event, households, items };
}

/** "Hudson & Molly", "Ann, Bo & Cy" */
export function joinNames(names: string[]) {
  return names.length <= 1 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}
