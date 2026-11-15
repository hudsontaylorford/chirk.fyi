"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hostRole, requireUser } from "@/lib/auth";
import { cohostEmail } from "@/lib/code-email";
import { getEvent, joinNames } from "@/lib/data";
import { sql } from "@/lib/db";
import { sendEmail, siteUrl } from "@/lib/email";
import { parseGuests } from "@/lib/guests";
import { inviteEmail, reminderEmail } from "@/lib/invite-email";
import { messageEmail } from "@/lib/message-email";

const val = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** The event's id, once we know the signed-in host hosts it (owner or co-host; `owner` = owner only). */
async function eventId(slug: string, owner = false) {
  const role = await hostRole(slug);
  if (!role || (owner && role !== "owner")) throw new Error("Not a host of this event");
  const [e] = await sql<{ id: string }[]>`select id from events where slug = ${slug}`;
  return e.id;
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
  hosted_by: val(f, "hosted_by").slice(0, 80) || null,
  long_times: f.get("long_times") === "on",
  costs_on: f.get("costs_on") === "on",
  poker_on: f.get("poker_on") === "on",
  gift_on: f.get("gift_on") === "on",
  gift_budget: val(f, "gift_budget").slice(0, 40) || null,
});

// Static routes that an event's web address must not shadow.
const RESERVED = new Set(["host", "privacy", "terms"]);

/** "Thanksgiving 2026" → "thanksgiving-2026"; if taken, "thanksgiving-2026-2", and so on. */
async function freeSlug(text: string) {
  const base = text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
  let slug = RESERVED.has(base) ? `${base}-event` : base;
  for (let n = 2; (await sql`select 1 from events where slug = ${slug}`).length; n++) slug = `${base}-${n}`;
  return slug;
}

/**
 * Copy an event to next year as a draft: same details and needed list, and the same guests
 * (names and emails, each with a new personal link and no answer yet). Nobody's replies come along.
 * Dates move 52 weeks so the weekday holds (Thu Nov 26 2026 → Thu Nov 25 2027, next Thanksgiving).
 */
export async function copyToNextYear(slug: string) {
  await eventId(slug);
  const me = await requireUser();
  const [e] = await sql`
    select id, title, (date + 364)::text as date, time, end_time, place, address, details,
      (rsvp_by + 364)::text as rsvp_by, cover_url, bring_prompt, ask_kids, notify_host, note_prompt, note_hint, allow_doubles, allow_own, notes_public, max_guests, schedule, ask_arrival, hosted_by, long_times, costs_on, poker_on, gift_on, gift_budget
    from events where slug = ${slug}`;
  if (!e) return;
  const title = String(e.title).replace(/\b(19|20)\d\d\b/g, (y) => String(Number(y) + 1));
  const newSlug = await freeSlug(title);
  const { id: oldId, ...fields } = e;
  const [copy] = await sql<{ id: string }[]>`insert into events ${sql({ ...fields, title, slug: newSlug, status: "draft" })} returning id`;
  await sql`insert into items (event_id, kind, name, sort)
    select ${copy.id}, 'needed', name, sort from items where event_id = ${oldId} and kind = 'needed'`;
  await sql`insert into households (event_id, names, going, email)
    select ${copy.id}, names, null, email from households where event_id = ${oldId} order by created_at`;
  // The same hosts, with whoever copied it as the owner.
  await sql`insert into event_hosts (event_id, user_id, role)
    select ${copy.id}, user_id, case when user_id = ${me.id} then 'owner' else 'cohost' end from event_hosts where event_id = ${oldId}`;
  redirect(`/${newSlug}/host`);
}

export async function setStatus(slug: string, status: "draft" | "live" | "archived") {
  await eventId(slug);
  await sql`update events set status = ${status} where slug = ${slug}`;
  revalidatePath("/host");
  revalidatePath(`/${slug}`, "layout");
}

export async function createEvent(f: FormData) {
  const me = await requireUser();
  const fields = eventFields(f);
  if (!fields.title || !fields.date) return;
  const slug = await freeSlug(val(f, "slug") || fields.title);
  const [e] = await sql<{ id: string }[]>`insert into events ${sql({ ...fields, slug })} returning id`;
  await sql`insert into event_hosts (event_id, user_id, role) values (${e.id}, ${me.id}, 'owner')`;
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

/** Deletes an event with everything on it (replies, list, claims). The host page asks "Sure?" first. */
export async function deleteEvent(slug: string) {
  await sql`delete from events where id = ${await eventId(slug, true)}`; // owner only
  redirect("/host");
}

/** "Add guests": each entry becomes a reply with no answer yet; names already on the list are skipped. */
export async function addGuests(slug: string, f: FormData) {
  const ev = await eventId(slug);
  const have = (await sql<{ n: string }[]>`select lower(unnest(names)) as n from households where event_id = ${ev}`).map((r) => r.n);
  const fresh = parseGuests(val(f, "guests")).filter((g) => !g.names.some((n) => have.includes(n.toLowerCase())));
  if (fresh.length) {
    await sql`insert into households ${sql(fresh.map((g) => ({ event_id: ev, names: g.names, going: null, email: g.email })))}`;
  }
  revalidatePath(`/${slug}`, "layout");
}

/** A named guest's own link: it remembers them on that device, then opens the invite. */
const personalUrl = async (slug: string, token: string) => `${await siteUrl()}/${slug}/r/${token}/remember?to=invite`;

/**
 * Emails one guest their personal invite or a reminder. An email typed in the form is saved to them first.
 * Answers in plain words for the button: sent, email off (anywhere but the live site), or failed.
 */
export async function emailGuest(slug: string, id: string, kind: "invite" | "reminder", _prev: string | null, f: FormData): Promise<string> {
  const ev = await eventId(slug);
  const typed = val(f, "email").toLowerCase();
  if (typed) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typed)) return "That email doesn't look right.";
    await sql`update households set email = ${typed} where id = ${id} and event_id = ${ev}`;
    revalidatePath(`/${slug}`, "layout");
  }
  const [h] = await sql<{ token: string; names: string[]; email: string | null }[]>`select token, names, email from households where id = ${id} and event_id = ${ev}`;
  if (!h?.email) return "Add their email first.";
  const sent = await sendTo(slug, h as { token: string; names: string[]; email: string }, kind);
  return sent ? "Sent ✓" : process.env.VERCEL_ENV === "production" ? "Couldn't send. Try again?" : "Email only sends from the live site.";
}

/** "Remind everyone": a reminder email to each guest with an email who hasn't answered. */
export async function remindAll(slug: string): Promise<string> {
  const ev = await eventId(slug);
  const rows = await sql<{ token: string; names: string[]; email: string }[]>`
    select token, names, email from households where event_id = ${ev} and going is null and email is not null`;
  let sent = 0;
  for (const h of rows) if (await sendTo(slug, h, "reminder")) sent++;
  if (process.env.VERCEL_ENV !== "production") return "Email only sends from the live site.";
  return sent === rows.length ? `Reminders sent to ${sent} ✓` : `Sent ${sent} of ${rows.length}. Try again for the rest?`;
}

/** Who a guest message goes to: going, not replied yet, or both (never people who said they can't). */
export type Audience = "going" | "waiting" | "everyone";
const audienceSql = { going: "going is true", waiting: "going is null", everyone: "going is not false" } as const;

/**
 * "Message your guests": emails a note (and, if ticked, the date, place and schedule) to one group of guests.
 * The same note to the same guest is only ever sent once, so a double tap or a retry can't repeat it.
 */
export async function messageGuests(slug: string, _prev: string | null, f: FormData): Promise<string> {
  const ev = await eventId(slug);
  const note = val(f, "note").slice(0, 2000);
  const to = val(f, "to") as Audience;
  if (!note) return "Write your note first.";
  if (!(to in audienceSql)) return "Pick who it's for.";
  const e = await getEvent(slug, true); // as guests see it (Hosted by falls back to the hosts' names)
  if (!e) return "Something went wrong. Try again?";
  const rows = await sql<{ token: string; names: string[]; email: string }[]>`
    select token, names, email from households where event_id = ${ev} and email is not null and ${sql.unsafe(audienceSql[to])}`;
  if (!rows.length) return "Nobody in that group has an email yet.";
  const key = [...note].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7).toString(36); // same note → same key
  let sent = 0;
  for (const h of rows) {
    const mail = messageEmail(e, joinNames(h.names), note, await personalUrl(slug, h.token), f.get("details") === "on");
    if (await sendEmail({ to: h.email, ...mail, replyTo: await ownerEmail(ev), idempotencyKey: `note-${h.token}-${key}` })) sent++;
  }
  if (process.env.VERCEL_ENV !== "production") return "Email only sends from the live site.";
  return sent === rows.length ? `Sent to ${sent} ✓` : `Sent ${sent} of ${rows.length}. Try again for the rest?`;
}

/** Guests' replies to chirk's emails go to the event's owner. */
async function ownerEmail(eventId: string) {
  const [o] = await sql<{ email: string }[]>`select u.email from event_hosts h join users u on u.id = h.user_id where h.event_id = ${eventId} and h.role = 'owner'`;
  return o?.email ?? null;
}

/** Adds a co-host by email (making their account if they don't have one) and emails them. Any host can add. */
export async function addCohost(slug: string, _prev: string | null, f: FormData): Promise<string> {
  const ev = await eventId(slug);
  const me = await requireUser();
  const email = val(f, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That email doesn't look right.";
  const [u] = await sql<{ id: string }[]>`insert into users (email) values (${email}) on conflict (email) do update set email = excluded.email returning id`;
  const [added] = await sql`insert into event_hosts (event_id, user_id, role) values (${ev}, ${u.id}, 'cohost') on conflict do nothing returning 1`;
  revalidatePath(`/${slug}/host`);
  if (!added) return "They're already a host.";
  const [e] = await sql<{ title: string }[]>`select title from events where id = ${ev}`;
  const mail = cohostEmail({ by: me.name || me.email, title: e.title, url: `${await siteUrl()}/host?email=${encodeURIComponent(email)}` });
  const sent = await sendEmail({ to: email, ...mail, replyTo: me.email, idempotencyKey: `cohost-${ev}-${u.id}` });
  return sent ? "Added ✓ They've been emailed." : process.env.VERCEL_ENV === "production" ? "Added ✓ (the email didn't send; tell them yourself)" : "Added ✓ (email only sends from the live site)";
}

/** Removes a co-host. Owner only, and the owner can't be removed. */
export async function removeCohost(slug: string, userId: string) {
  const ev = await eventId(slug, true);
  await sql`delete from event_hosts where event_id = ${ev} and user_id = ${userId} and role = 'cohost'`;
  revalidatePath(`/${slug}/host`);
}

async function sendTo(slug: string, h: { token: string; names: string[]; email: string }, kind: "invite" | "reminder") {
  const e = await getEvent(slug, true); // as guests see it (Hosted by falls back to the hosts' names)
  if (!e) return false;
  const url = await personalUrl(slug, h.token);
  const names = joinNames(h.names);
  const mail = kind === "invite" ? inviteEmail(e, url, names) : reminderEmail(e, url, names);
  // The same invite within a minute, or a second reminder the same day, is only sent once.
  const when = kind === "invite" ? Math.floor(Date.now() / 60_000) : new Date().toISOString().slice(0, 10);
  return sendEmail({ to: h.email, ...mail, replyTo: await ownerEmail(e.id), idempotencyKey: `${kind}-${h.token}-${when}` });
}

/** "Select" on the guest list: email invites or reminders to the ticked guests (those with an email), or remove them. */
export async function bulkGuests(slug: string, _prev: string | null, f: FormData): Promise<string> {
  const ev = await eventId(slug);
  const ids = f.getAll("pick").map(String);
  if (!ids.length) return "Tick some guests first.";
  const rows = await sql<{ id: string; token: string; names: string[]; email: string | null }[]>`
    select id, token, names, email from households where event_id = ${ev} and id in ${sql(ids)}`;
  const what = String(f.get("do"));
  if (what === "remove") {
    for (const h of rows) await removeHousehold(slug, h.id);
    return `Removed ${rows.length} ✓`;
  }
  const kind = what === "reminder" ? "reminder" : "invite";
  const withEmail = rows.filter((h): h is typeof h & { email: string } => !!h.email);
  let sent = 0;
  for (const h of withEmail) if (await sendTo(slug, h, kind)) sent++;
  const skipped = rows.length - withEmail.length;
  const note = skipped ? ` ${skipped} had no email.` : "";
  if (process.env.VERCEL_ENV !== "production") return `Email only sends from the live site.${note}`;
  return `${kind === "invite" ? "Invites" : "Reminders"} sent to ${sent} ✓${note}`;
}

/** "Select" on Your events: archive the ticked events, or delete the ones you own. */
export async function bulkEvents(_prev: string | null, f: FormData): Promise<string> {
  const slugs = f.getAll("pick").map(String);
  if (!slugs.length) return "Tick some events first.";
  const what = String(f.get("do"));
  let done = 0, skipped = 0;
  for (const slug of slugs) {
    const role = await hostRole(slug);
    if (!role || (what === "delete" && role !== "owner")) { skipped++; continue; }
    if (what === "delete") await sql`delete from events where slug = ${slug}`;
    else await sql`update events set status = ${what === "unarchive" ? "live" : "archived"} where slug = ${slug}`;
    done++;
  }
  revalidatePath("/host");
  const verb = what === "delete" ? "Deleted" : what === "unarchive" ? "Unarchived" : "Archived";
  return `${verb} ${done} ✓${skipped ? ` (${skipped} skipped: only the owner can delete)` : ""}`;
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
  await requireUser();
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
