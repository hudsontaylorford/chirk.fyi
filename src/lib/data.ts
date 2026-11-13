import { sql } from "./db";
import type { Board, Category, Dish, EventRow, Guest, KitchenResource, Slot } from "./types";

const EVENT_COLS = sql`
  id, slug, title, tagline, event_date::text as event_date, dinner_time::text as dinner_time,
  meal_minutes, max_dishes_per_guest, timezone, location_name, address, invite_copy, closing_note, house_rules,
  rsvp_deadline::text as rsvp_deadline, dish_name_deadline::text as dish_name_deadline, theme`;

export async function getEvent(slug: string): Promise<EventRow | null> {
  const rows = await sql<EventRow[]>`select ${EVENT_COLS} from events where slug = ${slug}`;
  return rows[0] ?? null;
}

export async function listEvents(): Promise<EventRow[]> {
  return sql<EventRow[]>`select ${EVENT_COLS} from events where not is_archived order by event_date desc`;
}

export async function getBoard(slug: string): Promise<Board | null> {
  const event = await getEvent(slug);
  if (!event) return null;
  const [categories, slots, guests, dishes, kitchen] = await Promise.all([
    sql<Category[]>`select id, name, kind, soft_cap, nudge, description, sort_order
      from categories where event_id = ${event.id} order by sort_order, name`,
    sql<Slot[]>`select id, category_id, name, description, sort_order
      from slots where event_id = ${event.id} order by sort_order, name`,
    sql<Guest[]>`select id, name, edit_token, status, adults, kids, dietary_notes, arrival_window, note,
      created_at::text as created_at
      from guests where event_id = ${event.id} order by created_at`,
    sql<Dish[]>`select id, guest_id, category_id, slot_id, dish_name, kitchen_needs, oven_temp_f, oven_minutes,
      timing, oven_ready_at::text as oven_ready_at, assigned_by_host, notes
      from dishes where event_id = ${event.id} order by created_at`,
    sql<KitchenResource[]>`select id, kind, label, quantity, capacity
      from kitchen_resources where event_id = ${event.id} order by sort_order`,
  ]);
  return { event, categories, slots, guests, dishes, kitchen };
}

export async function getGuestByToken(token: string) {
  const rows = await sql<(Guest & { slug: string })[]>`
    select g.id, g.name, g.edit_token, g.status, g.adults, g.kids, g.dietary_notes, g.arrival_window, g.note,
      g.created_at::text as created_at, e.slug
    from guests g join events e on e.id = g.event_id where g.edit_token = ${token}`;
  return rows[0] ?? null;
}
