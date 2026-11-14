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
  end_time: (val(f, "time") && val(f, "end_time")) || null, // an end needs a start
  place: val(f, "place") || null,
  address: val(f, "address") || null,
  details: val(f, "details") || null,
  rsvp_by: val(f, "rsvp_by") || null,
  cover_url: val(f, "cover_url") || null,
  // The bring list is switched on or off; on with a blank question uses the default question.
  bring_prompt: f.get("bring_on") === "on" ? val(f, "bring_prompt") || "What are you bringing?" : null,
  allow_own: f.get("allow_own") === "on",
  notes_public: f.get("notes_public") === "on",
  max_guests: val(f, "max_guests") === "" ? null : Math.max(0, Math.min(10, Number(val(f, "max_guests")) || 0)),
  ask_kids: f.get("ask_kids") === "on",
  notify_host: f.get("notify_host") === "on",
  allow_doubles: f.get("allow_doubles") === "on",
  note_prompt: val(f, "note_prompt") || null,
  note_hint: val(f, "note_hint") || null,
  schedule: val(f, "schedule") || null,
  ask_arrival: f.get("ask_arrival") === "on",
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
    select id, title, (date + 364)::text as date, time, end_time, place, address, details,
      (rsvp_by + 364)::text as rsvp_by, cover_url, bring_prompt, ask_kids, notify_host, note_prompt, note_hint, allow_doubles, allow_own, notes_public, max_guests, schedule, ask_arrival
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
  await saveList(e.id, f);
  redirect(`/${slug}/host`);
}

/**
 * The host's list from the form (one thing per line): new things are added, things taken off are removed
 * (with anyone's claim on them), and the rest keep their claims and take the new order.
 */
async function saveList(eventId: string, f: FormData) {
  const lines = val(f, "needed").split("\n").map((s) => s.trim().slice(0, 120)).filter(Boolean).slice(0, 50);
  const names = [...new Map(lines.map((n) => [n.toLowerCase(), n])).values()];
  await sql.begin(async (tx) => {
    const have = await tx<{ id: string; name: string }[]>`select id, name from items where event_id = ${eventId} and kind = 'needed'`;
    const byName = new Map(have.map((i) => [i.name.toLowerCase(), i.id]));
    const gone = have.filter((i) => !names.some((n) => n.toLowerCase() === i.name.toLowerCase())).map((i) => i.id);
    if (gone.length) await tx`delete from items where id in ${tx(gone)}`;
    for (const [i, name] of names.entries()) {
      const id = byName.get(name.toLowerCase());
      if (id) await tx`update items set name = ${name}, sort = ${i + 1} where id = ${id}`;
      else await tx`insert into items ${tx({ event_id: eventId, kind: "needed", name, sort: i + 1 })}`;
    }
  });
}

export async function removeHousehold(slug: string, id: string) {
  const ev = await eventId(slug);
  // Things they added go too, unless someone else is also bringing them; their list picks reopen.
  await sql`delete from items i where i.household_id = ${id} and i.kind <> 'needed'
    and not exists (select 1 from claims c where c.item_id = i.id and c.household_id <> ${id})`;
  await sql`delete from households where id = ${id} and event_id = ${ev}`;
  revalidatePath(`/${slug}`, "layout");
}

export async function saveEvent(slug: string, f: FormData) {
  await eventId(slug);
  const fields = eventFields(f);
  if (!fields.title || !fields.date) return;
  const [e] = await sql<{ id: string }[]>`update events set ${sql(fields)} where slug = ${slug} returning id`;
  await saveList(e.id, f);
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
