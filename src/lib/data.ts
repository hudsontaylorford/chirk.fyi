import { isHost } from "./auth";
import { sql } from "./db";
import type { Event, EventData, Household, Item } from "./types";

/** `forGuest`: drafts stay hidden from everyone but the host. */
export async function getEvent(slug: string, forGuest = false) {
  const [e] = await sql<Event[]>`
    select id, slug, title, date::text, time::text, end_time::text, place, address, details, rsvp_by::text, cover_url, bring_prompt, status, ask_kids
    from events where slug = ${slug}`;
  if (!e || (forGuest && e.status === "draft" && !(await isHost()))) return null;
  return e;
}

export async function getEventData(slug: string, forGuest = false): Promise<EventData | null> {
  const event = await getEvent(slug, forGuest);
  if (!event) return null;
  const [households, items] = await Promise.all([
    sql<Household[]>`select id, token, names, going, kids, note, updated_by, email from households where event_id = ${event.id} order by created_at`,
    sql<Item[]>`select id, kind, name, household_id from items where event_id = ${event.id} order by sort, created_at`,
  ]);
  return { event, households, items };
}

/** "Hudson & Molly", "Ann, Bo & Cy" */
export function joinNames(names: string[]) {
  return names.length <= 1 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}
