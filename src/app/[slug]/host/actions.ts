"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, clearHostCookie, requireHost, setHostCookie } from "@/lib/auth";
import { sql } from "@/lib/db";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const n = (f: FormData, k: string) => {
  const v = s(f, k);
  return v === "" ? null : Number(v);
};

async function eventId(slug: string) {
  const [e] = await sql<{ id: string }[]>`select id from events where slug = ${slug}`;
  if (!e) throw new Error("No such event");
  return e.id;
}
function done(slug: string) {
  revalidatePath(`/${slug}`, "layout");
}

export async function login(slug: string, _prev: string | null, f: FormData) {
  if (!checkPassword(s(f, "password"))) return "That’s not the password.";
  await setHostCookie();
  redirect(`/${slug}/host`);
}

export async function logout(slug: string) {
  await clearHostCookie();
  redirect(`/${slug}`);
}

/** Give a core slot to an existing guest or a new name. Replaces any current claim. */
export async function assignSlot(slug: string, f: FormData) {
  await requireHost();
  const ev = await eventId(slug);
  const slotId = s(f, "slot_id");
  let guestId = s(f, "guest_id");
  const newName = s(f, "new_name");
  const [slot] = await sql<{ category_id: string; name: string }[]>`
    select category_id, name from slots where id = ${slotId} and event_id = ${ev}`;
  if (!slot || (!guestId && !newName)) return;
  await sql.begin(async (tx) => {
    if (!guestId) {
      const [g] = await tx<{ id: string }[]>`
        insert into guests (event_id, name, status) values (${ev}, ${newName}, 'invited') returning id`;
      guestId = g.id;
    }
    await tx`delete from dishes where slot_id = ${slotId}`;
    await tx`insert into dishes (event_id, guest_id, category_id, slot_id, assigned_by_host)
             values (${ev}, ${guestId}, ${slot.category_id}, ${slotId}, true)`;
  });
  done(slug);
}

export async function deleteDish(slug: string, dishId: string) {
  await requireHost();
  await sql`delete from dishes where id = ${dishId} and event_id = ${await eventId(slug)}`;
  done(slug);
}

export async function deleteGuest(slug: string, guestId: string) {
  await requireHost();
  await sql`delete from guests where id = ${guestId} and event_id = ${await eventId(slug)}`;
  done(slug);
}

export async function setOvenReady(slug: string, f: FormData) {
  await requireHost();
  const t = s(f, "ready_at") || null;
  await sql`update dishes set oven_ready_at = ${t} where id = ${s(f, "dish_id")} and event_id = ${await eventId(slug)}`;
  done(slug);
}

export async function updateEvent(slug: string, f: FormData) {
  await requireHost();
  const fields = {
    title: s(f, "title"),
    tagline: s(f, "tagline") || null,
    event_date: s(f, "event_date"),
    dinner_time: s(f, "dinner_time"),
    meal_minutes: n(f, "meal_minutes") ?? 120,
    location_name: s(f, "location_name") || null,
    address: s(f, "address") || null,
    invite_copy: s(f, "invite_copy") || null,
    house_rules: s(f, "house_rules") || null,
    closing_note: s(f, "closing_note") || null,
    rsvp_deadline: s(f, "rsvp_deadline") || null,
    dish_name_deadline: s(f, "dish_name_deadline") || null,
  };
  await sql`update events set ${sql(fields)}, updated_at = now() where slug = ${slug}`;
  done(slug);
}

export async function updateCategory(slug: string, f: FormData) {
  await requireHost();
  const ev = await eventId(slug);
  await sql`update categories set name = ${s(f, "name")}, soft_cap = ${n(f, "soft_cap")}, nudge = ${s(f, "nudge") || null}
            where id = ${s(f, "id")} and event_id = ${ev}`;
  done(slug);
}

export async function addCategory(slug: string, f: FormData) {
  await requireHost();
  const ev = await eventId(slug);
  const name = s(f, "name");
  if (!name) return;
  await sql`insert into categories (event_id, name, kind, soft_cap, sort_order)
            values (${ev}, ${name}, 'open', ${n(f, "soft_cap")}, (select coalesce(max(sort_order),0)+1 from categories where event_id = ${ev}))`;
  done(slug);
}

export async function deleteCategory(slug: string, id: string) {
  await requireHost();
  await sql`delete from categories where id = ${id} and event_id = ${await eventId(slug)} and kind = 'open'`;
  done(slug);
}

export async function saveSlot(slug: string, f: FormData) {
  await requireHost();
  const ev = await eventId(slug);
  const id = s(f, "id"), name = s(f, "name");
  if (!name) return;
  if (id) {
    await sql`update slots set name = ${name} where id = ${id} and event_id = ${ev}`;
  } else {
    const [core] = await sql<{ id: string }[]>`select id from categories where event_id = ${ev} and kind = 'core' order by sort_order limit 1`;
    if (!core) return;
    await sql`insert into slots (event_id, category_id, name, sort_order)
              values (${ev}, ${core.id}, ${name}, (select coalesce(max(sort_order),0)+1 from slots where event_id = ${ev}))`;
  }
  done(slug);
}

export async function deleteSlot(slug: string, id: string) {
  await requireHost();
  // Anyone who'd claimed it keeps their dish, listed under the main-dish category.
  await sql`delete from slots where id = ${id} and event_id = ${await eventId(slug)}`;
  done(slug);
}

export async function updateKitchen(slug: string, f: FormData) {
  await requireHost();
  const ev = await eventId(slug);
  const count = Math.max(1, n(f, "ovens") ?? 1);
  const cap = Math.max(1, n(f, "capacity") ?? 2);
  const [o] = await sql`select id from kitchen_resources where event_id = ${ev} and kind = 'oven' limit 1`;
  if (o) await sql`update kitchen_resources set quantity = ${count}, capacity = ${cap} where id = ${o.id}`;
  else await sql`insert into kitchen_resources (event_id, kind, label, quantity, capacity) values (${ev}, 'oven', 'Oven', ${count}, ${cap})`;
  done(slug);
}
