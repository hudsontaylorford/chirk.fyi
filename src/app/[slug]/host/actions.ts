"use server";

import { put } from "@vercel/blob";
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
  ask_kids: f.get("ask_kids") === "on",
});

// Static routes that an event's web address must not shadow.
const RESERVED = new Set(["host"]);

/** "Thanksgiving 2026" → "thanksgiving-2026"; if taken, "thanksgiving-2026-2", and so on. */
async function freeSlug(text: string) {
  const base = text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
  let slug = RESERVED.has(base) ? `${base}-event` : base;
  for (let n = 2; (await sql`select 1 from events where slug = ${slug}`).length; n++) slug = `${base}-${n}`;
  return slug;
}

/**
 * Copy an event to next year as a draft: same details and needed list, nobody's replies.
 * Dates move 52 weeks so the weekday holds (Thu Nov 26 2026 → Thu Nov 25 2027, next Thanksgiving).
 */
export async function copyToNextYear(slug: string) {
  await requireHost();
  const [e] = await sql`
    select id, title, (date + 364)::text as date, time, place, address, details,
      (rsvp_by + 364)::text as rsvp_by, cover_url, bring_prompt, ask_kids
    from events where slug = ${slug}`;
  if (!e) return;
  const title = String(e.title).replace(/\b(19|20)\d\d\b/g, (y) => String(Number(y) + 1));
  const newSlug = await freeSlug(title);
  const { id: oldId, ...fields } = e;
  const [copy] = await sql<{ id: string }[]>`insert into events ${sql({ ...fields, title, slug: newSlug, status: "draft" })} returning id`;
  await sql`insert into items (event_id, kind, name, sort)
    select ${copy.id}, 'needed', name, sort from items where event_id = ${oldId} and kind = 'needed'`;
  redirect(`/${newSlug}/host`);
}

export async function setStatus(slug: string, status: "draft" | "live" | "archived") {
  await eventId(slug);
  await sql`update events set status = ${status} where slug = ${slug}`;
  revalidatePath("/host");
  revalidatePath(`/${slug}`, "layout");
}

export async function createEvent(f: FormData) {
  await requireHost();
  const fields = eventFields(f);
  if (!fields.title || !fields.date) return;
  const slug = await freeSlug(val(f, "slug") || fields.title);
  const [e] = await sql<{ id: string }[]>`insert into events ${sql({ ...fields, slug })} returning id`;
  const needed = val(f, "needed").split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 50);
  if (fields.bring_prompt && needed.length) {
    await sql`insert into items ${sql(needed.map((name, i) => ({ event_id: e.id, kind: "needed", name, sort: i + 1 })))}`;
  }
  redirect(`/${slug}/host`);
}

export async function addItem(slug: string, f: FormData) {
  const ev = await eventId(slug);
  // "Chairs, grill, blankets" adds three.
  const names = val(f, "name").split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 50);
  const [{ max }] = await sql<{ max: number }[]>`select coalesce(max(sort), 0)::int as max from items where event_id = ${ev}`;
  if (names.length) await sql`insert into items ${sql(names.map((name, i) => ({ event_id: ev, kind: "needed", name, sort: max + i + 1 })))}`;
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

/**
 * Stores an already-shrunk cover photo (a JPEG made on the host's phone) and returns its public link,
 * which the event form then saves like any other cover link.
 */
export async function uploadPhoto(f: FormData): Promise<{ url: string } | { error: string }> {
  await requireHost();
  const file = f.get("photo");
  if (!(file instanceof File) || file.type !== "image/jpeg" || file.size > 2 * 1024 * 1024) {
    return { error: "That photo didn't come through. Try again." };
  }
  // Local testing without Blob storage: PHOTOS_FAKE=true keeps the photo inline.
  if (process.env.PHOTOS_FAKE === "true" && !process.env.BLOB_READ_WRITE_TOKEN) {
    return { url: `data:image/jpeg;base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}` };
  }
  try {
    const blob = await put("covers/photo.jpg", file, { access: "public", contentType: "image/jpeg", addRandomSuffix: true });
    return { url: blob.url };
  } catch (e) {
    console.error("Photo upload failed:", e);
    return { error: "The upload didn't work. Try again in a moment." };
  }
}
