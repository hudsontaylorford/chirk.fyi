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

export async function signIn(slug: string, f: FormData) {
  if (!checkPassword(val(f, "password"))) redirect(`/${slug}/host?wrong=1`);
  await setHostCookie();
  redirect(`/${slug}/host`);
}

export async function signOut(slug: string) {
  await clearHostCookie();
  redirect(`/${slug}`);
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
  await sql`update events set ${sql({
    title: val(f, "title"),
    date: val(f, "date"),
    time: val(f, "time") || null,
    place: val(f, "place") || null,
    address: val(f, "address") || null,
    details: val(f, "details") || null,
    rsvp_by: val(f, "rsvp_by") || null,
    cover_url: val(f, "cover_url") || null,
    bring_prompt: val(f, "bring_prompt") || null,
  })} where slug = ${slug}`;
  revalidatePath(`/${slug}`, "layout");
}
