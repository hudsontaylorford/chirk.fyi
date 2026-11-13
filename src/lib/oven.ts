import { clock, toMinutes } from "./format";
import type { Board, Dish } from "./types";

export interface OvenItem {
  dish: Dish;
  label: string;
  guestName: string;
  temp: number | null;
  start: number; // minutes after midnight
  end: number;
  overridden: boolean;
  missing: boolean; // temp or minutes not filled in
}

export interface OvenConflict {
  start: number;
  end: number;
  kind: "temperature" | "capacity";
  message: string;
  dishIds: string[];
}

/** Lays out every oven dish around dinner and finds overlaps the kitchen can't handle. */
export function ovenTimeline(board: Board) {
  const dinner = toMinutes(board.event.dinner_time);
  const dessert = dinner + board.event.meal_minutes;
  const ovens = board.kitchen.filter((k) => k.kind === "oven");
  const ovenCount = ovens.reduce((n, o) => n + o.quantity, 0) || 1;
  const capacity = ovens.reduce((n, o) => n + o.quantity * o.capacity, 0) || 2;
  const guests = new Map(board.guests.map((g) => [g.id, g.name]));
  const slots = new Map(board.slots.map((s) => [s.id, s.name]));
  const cats = new Map(board.categories.map((c) => [c.id, c.name]));

  const items: OvenItem[] = board.dishes
    .filter((d) => d.kitchen_needs.includes("oven"))
    .map((d) => {
      const minutes = d.oven_minutes ?? 30;
      const ready = d.oven_ready_at ? toMinutes(d.oven_ready_at) : d.timing === "after" ? dessert : dinner;
      return {
        dish: d,
        label: d.dish_name || (d.slot_id ? slots.get(d.slot_id) : null) || `${cats.get(d.category_id)} (TBD)`,
        guestName: guests.get(d.guest_id) ?? "?",
        temp: d.oven_temp_f,
        start: ready - minutes,
        end: ready,
        overridden: !!d.oven_ready_at,
        missing: !d.oven_temp_f || !d.oven_minutes,
      };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  // Sweep through every moment something goes in or comes out, then merge
  // back-to-back trouble of the same kind into one window.
  const points = [...new Set(items.flatMap((i) => [i.start, i.end]))].sort((a, b) => a - b);
  const windows: { kind: OvenConflict["kind"]; start: number; end: number; ids: Set<string>; peak: number }[] = [];
  for (let p = 0; p < points.length - 1; p++) {
    const t = points[p], next = points[p + 1];
    const active = items.filter((i) => i.start <= t && i.end > t);
    const temps = new Set(active.map((i) => i.temp).filter(Boolean));
    const issues: [OvenConflict["kind"], number][] = [];
    if (temps.size > ovenCount) issues.push(["temperature", temps.size]);
    if (active.length > capacity) issues.push(["capacity", active.length]);
    for (const [kind, peak] of issues) {
      const prev = windows.findLast((w) => w.kind === kind);
      if (prev && prev.end === t) {
        prev.end = next;
        prev.peak = Math.max(prev.peak, peak);
        active.forEach((i) => prev.ids.add(i.dish.id));
      } else {
        windows.push({ kind, start: t, end: next, peak, ids: new Set(active.map((i) => i.dish.id)) });
      }
    }
  }
  const byId = new Map(items.map((i) => [i.dish.id, i]));
  const conflicts: OvenConflict[] = windows.map((w) => {
    const list = [...w.ids].map((id) => byId.get(id)!).sort((a, b) => a.start - b.start);
    const names = list.map((i) => `${i.label}${i.temp ? ` (${i.temp}°)` : ""}`).join(", ");
    return {
      start: w.start, end: w.end, kind: w.kind, dishIds: [...w.ids],
      message: w.kind === "temperature"
        ? `Up to ${w.peak} different temperatures needed at once with ${ovenCount} oven${ovenCount > 1 ? "s" : ""}: ${names}`
        : `Up to ${w.peak} dishes in the oven at once (room for about ${capacity}): ${names}`,
    };
  });

  const min = Math.min(dinner - 60, ...items.map((i) => i.start));
  const max = Math.max(dessert, ...items.map((i) => i.end));
  return { items, conflicts, dinner, dessert, ovenCount, capacity, min, max };
}

export function range(start: number, end: number) {
  return `${clock(start)}–${clock(end)}`;
}
