"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import type { Arrival, KitchenNeed, RsvpStatus, Timing } from "@/lib/types";

export interface DishInput {
  id?: string;
  category_id: string;
  slot_id?: string | null;
  dish_name?: string | null;
  kitchen_needs: KitchenNeed[];
  oven_temp_f?: number | null;
  oven_minutes?: number | null;
  timing?: Timing | null;
  notes?: string | null;
}

export interface RsvpInput {
  slug: string;
  token?: string;
  name: string;
  status: RsvpStatus;
  adults: number;
  kids: number;
  dietary_notes?: string;
  arrival_window?: Arrival | null;
  note?: string;
  dishes: DishInput[];
}

export type SaveResult = { ok: true; token: string } | { ok: false; error: string };

const NEEDS: KitchenNeed[] = ["ready", "oven", "stovetop", "outlet", "fridge"];
const clean = (s?: string | null) => (s ?? "").trim() || null;
const int = (n: unknown, min: number, max: number) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;
};

export async function saveRsvp(input: RsvpInput): Promise<SaveResult> {
  const name = clean(input.name);
  if (!name) return { ok: false, error: "Please add your name." };
  if (!["yes", "maybe", "no"].includes(input.status)) return { ok: false, error: "Please choose whether you're coming." };

  const [event] = await sql<{ id: string; slug: string }[]>`select id, slug from events where slug = ${input.slug}`;
  if (!event) return { ok: false, error: "We couldn't find this event." };

  const cats = await sql<{ id: string; kind: string }[]>`select id, kind from categories where event_id = ${event.id}`;
  const slots = await sql<{ id: string; name: string; category_id: string }[]>`
    select id, name, category_id from slots where event_id = ${event.id}`;
  const catIds = new Set(cats.map((c) => c.id));
  const slotById = new Map(slots.map((s) => [s.id, s]));

  const dishes = input.status === "no" ? [] : input.dishes.slice(0, 12).map((d) => {
    const needs = [...new Set(d.kitchen_needs.filter((n) => NEEDS.includes(n)))];
    const oven = needs.includes("oven");
    return {
      id: d.id,
      category_id: d.category_id,
      slot_id: d.slot_id || null,
      dish_name: clean(d.dish_name)?.slice(0, 120) ?? null,
      kitchen_needs: needs,
      oven_temp_f: oven ? int(d.oven_temp_f, 150, 550) : null,
      oven_minutes: oven ? int(d.oven_minutes, 5, 600) : null,
      timing: d.timing === "after" ? "after" : d.timing === "before" ? "before" : null,
      notes: clean(d.notes)?.slice(0, 300) ?? null,
    };
  });
  for (const d of dishes) {
    if (!catIds.has(d.category_id)) return { ok: false, error: "One of your dishes has an unknown category. Please refresh and try again." };
    if (d.slot_id && !slotById.has(d.slot_id)) return { ok: false, error: "One of the dishes you picked no longer exists. Please refresh." };
  }
  const slotIds = dishes.map((d) => d.slot_id).filter(Boolean);
  if (new Set(slotIds).size !== slotIds.length) return { ok: false, error: "You've picked the same main dish twice." };

  try {
    const token = await sql.begin(async (tx) => {
      let guestId: string, token: string;
      const fields = {
        name: name.slice(0, 80),
        status: input.status,
        adults: int(input.adults, 0, 20) ?? 1,
        kids: int(input.kids, 0, 20) ?? 0,
        dietary_notes: clean(input.dietary_notes)?.slice(0, 500) ?? null,
        arrival_window: ["morning", "afternoon", "dinner"].includes(input.arrival_window ?? "") ? input.arrival_window! : null,
        note: clean(input.note)?.slice(0, 500) ?? null,
      };
      if (input.token) {
        const [g] = await tx<{ id: string; edit_token: string }[]>`
          update guests set ${tx(fields)}, updated_at = now()
          where edit_token = ${input.token} and event_id = ${event.id}
          returning id, edit_token`;
        if (!g) throw new UserError("We couldn't find your RSVP. Your link may be out of date.");
        guestId = g.id; token = g.edit_token;
      } else {
        const [g] = await tx<{ id: string; edit_token: string }[]>`
          insert into guests ${tx({ ...fields, event_id: event.id })} returning id, edit_token`;
        guestId = g.id; token = g.edit_token;
      }

      const existing = await tx<{ id: string; assigned_by_host: boolean; slot_id: string | null }[]>`
        select id, assigned_by_host, slot_id from dishes where guest_id = ${guestId}`;
      const mine = new Map(existing.map((d) => [d.id, d]));
      const keep = new Set(dishes.map((d) => d.id).filter((id): id is string => !!id && mine.has(id)));
      // Remove dropped dishes first so their slots free up before anything is re-claimed.
      for (const d of existing) {
        if (keep.has(d.id)) continue;
        if (d.assigned_by_host && input.status !== "no") continue;
        await tx`delete from dishes where id = ${d.id}`;
      }

      for (const d of dishes) {
        const row = {
          category_id: d.category_id, slot_id: d.slot_id, dish_name: d.dish_name,
          kitchen_needs: d.kitchen_needs, oven_temp_f: d.oven_temp_f, oven_minutes: d.oven_minutes,
          timing: d.timing, notes: d.notes,
        };
        const prev = d.id ? mine.get(d.id) : undefined;
        try {
          if (prev) {
            // Guests can't move a dish the host assigned them to another slot.
            if (prev.assigned_by_host) row.slot_id = prev.slot_id;
            await tx`update dishes set ${tx(row)}, updated_at = now() where id = ${prev.id}`;
          } else {
            await tx`insert into dishes ${tx({ ...row, event_id: event.id, guest_id: guestId })}`;
          }
        } catch (e) {
          if ((e as { code?: string }).code === "23505" && d.slot_id) {
            throw new UserError(`Someone just claimed ${slotById.get(d.slot_id)?.name}. Could you pick something else?`);
          }
          throw e;
        }
      }
      return token;
    });
    revalidatePath(`/${event.slug}`, "layout");
    return { ok: true, token };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong saving your RSVP. Please try again." };
  }
}

class UserError extends Error {}
