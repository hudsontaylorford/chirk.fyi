"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, clearHostCookie, requireHost, setHostCookie } from "@/lib/auth";
import { sql } from "@/lib/db";

const val = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function eventId(slug: string) {
  await requireHost();
  const [e] = await sql<{ id: string }[]>`select id from events where slug = ${slug}`;
  if (!e) throw new Error("No such event");
  return e.id;
}

/** `next` is where to land afterwards, e.g. "/host" or "/thanksgiving-2026/host". */
export async function signIn(next: string, f: FormData) {
  if (!checkPassword(val(f, "password"))) redirect(`${next}?wrong=1`);
  await setHostCookie();
  redirect(next);
}

export async function signOut() {
  await clearHostCookie();
  redirect("/");
}

const eventFields = (f: FormData) => ({
  title: val(f, "title"),
  date: val(f, "date"),
  time: val(f, "time") || null,
  place: val(f, "place") || null,
  address: val(f, "address") || null,
  details: val(f, "details") || null,
  rsvp_by: val(f, "rsvp_by") || null,
  cover_url: val(f, "cover_url") || null,
  bring_prompt: val(f, "bring_prompt") || null,
});

// Static routes that an event's web address must not shadow.
const RESERVED = new Set(["host"]);

export async function createEvent(f: FormData) {
  await requireHost();
  const fields = eventFields(f);
  if (!fields.title || !fields.date) return;
  // "Thanksgiving 2026" → "thanksgiving-2026"; if taken, "thanksgiving-2026-2", and so on.
  const base = (val(f, "slug") || fields.title).toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
  let slug = RESERVED.has(base) ? `${base}-event` : base;
  for (let n = 2; (await sql`select 1 from events where slug = ${slug}`).length; n++) slug = `${base}-${n}`;

  const [e] = await sql<{ id: string }[]>`insert into events ${sql({ ...fields, slug })} returning id`;
  const needed = val(f, "needed").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 50);
  if (fields.bring_prompt && needed.length) {
    await sql`insert into items ${sql(needed.map((name, i) => ({ event_id: e.id, kind: "needed", name, sort: i + 1 })))}`;
  }
  redirect(`/${slug}/host`);
}

export async function addItem(slug: string, f: FormData) {
  const ev = await eventId(slug);
  const name = val(f, "name");
  if (name) await sql`insert into items (event_id, kind, name, sort)
    values (${ev}, 'needed', ${name}, (select coalesce(max(sort), 0) + 1 from items where event_id = ${ev}))`;
  revalidatePath(`/${slug}`, "layout");
}

export async function removeItem(slug: string, id: string) {
  await sql`delete from items where id = ${id} and event_id = ${await eventId(slug)}`;
  revalidatePath(`/${slug}`, "layout");
}

export async function removeHousehold(slug: string, id: string) {
  const ev = await eventId(slug);
  await sql`delete from items where household_id = ${id} and kind <> 'needed'`;
  await sql`delete from households where id = ${id} and event_id = ${ev}`; // their list picks reopen
  revalidatePath(`/${slug}`, "layout");
}

export async function saveEvent(slug: string, f: FormData) {
  await eventId(slug);
  const fields = eventFields(f);
  if (!fields.title || !fields.date) return;
  await sql`update events set ${sql(fields)} where slug = ${slug}`;
  revalidatePath(`/${slug}`, "layout");
}
