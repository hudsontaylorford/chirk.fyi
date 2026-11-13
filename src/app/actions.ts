"use server";

import { revalidatePath } from "next/cache";
import type postgres from "postgres";
import { cookies } from "next/headers";
import { isHost } from "@/lib/auth";
import { joinNames } from "@/lib/data";
import { sql } from "@/lib/db";
import { sendEmail, siteUrl } from "@/lib/email";
import { linkEmail } from "@/lib/link-email";
import { replyEmail } from "@/lib/reply-email";

export interface RsvpInput {
  slug: string;
  token?: string;
  names: string[];
  going: boolean;
  kids: number;
  note: string;
  email?: string; // optional: we email them their private link
  picks: string[]; // items they tapped (from the list, or doubling up on someone else's)
  own: string[]; // things they typed in themselves
  answeringAs?: string;
  sameNameOk?: boolean;
}

export type RsvpResult =
  | { ok: true; token: string }
  | { ok: false; error: string; sameName?: boolean; refresh?: boolean };

class Oops extends Error {}
const tidy = (s: string, max = 120) => s.trim().replace(/\s+/g, " ").slice(0, max);

export async function saveRsvp(input: RsvpInput): Promise<RsvpResult> {
  const names = input.names.map((n) => tidy(n, 60)).filter(Boolean).slice(0, 8);
  if (!names.length) return { ok: false, error: "Add your name." };
  const email = (input.email ?? "").trim().toLowerCase().slice(0, 200) || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "That email doesn't look right." };

  const [event] = await sql<{ id: string; notify_host: boolean; allow_doubles: boolean }[]>`
    select id, notify_host, allow_doubles from events where slug = ${input.slug} and status <> 'draft'`;
  if (!event) return { ok: false, error: "This event isn't open for replies." };

  // A second reply under a name that's already here is almost always a mistake.
  if (!input.token && !input.sameNameOk) {
    const lower = names.map((n) => n.toLowerCase());
    const [dupe] = await sql`
      select 1 from households, unnest(names) n
      where event_id = ${event.id} and lower(n) = any(${lower})`;
    if (dupe) {
      return {
        ok: false, sameName: true,
        error: "Someone with that name already replied. If it was you, use your saved link, or \"Email me my link\" above (or ask the host to resend it).",
      };
    }
  }

  let emailChanged = false;
  try {
    const token = await sql.begin(async (tx) => {
      const row = {
        names, going: input.going, kids: Math.max(0, Math.min(10, Math.round(input.kids) || 0)),
        note: tidy(input.note ?? "", 500) || null, updated_by: input.answeringAs ? tidy(input.answeringAs, 60) : null,
        email,
      };
      const [before] = input.token ? await tx<{ email: string | null }[]>`select email from households where token = ${input.token}` : [];
      emailChanged = !!email && email !== before?.email;
      const [h] = input.token
        ? await tx<{ id: string; token: string }[]>`
            update households set ${tx(row)}, updated_at = now()
            where token = ${input.token} and event_id = ${event.id} returning id, token`
        : await tx<{ id: string; token: string }[]>`
            insert into households ${tx({ ...row, event_id: event.id })} returning id, token`;
      if (!h) throw new Oops("We couldn't find your RSVP. Is the link right?");

      await saveBringing(tx, event, h.id, input.going ? input.picks : [], input.going ? input.own : []);
      return h.token;
    });
    // Remember this phone's reply. Server-set so Safari keeps it (it can wipe localStorage after 7 idle days).
    // Only on a new reply, so a host editing someone else's RSVP doesn't take it over.
    if (!input.token) {
      (await cookies()).set(`chirk_${input.slug}`, token, {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365,
      });
    }
    revalidatePath(`/${input.slug}`, "layout");
    // A new or changed email gets the private link right away.
    if (emailChanged) await emailLinks(input.slug, { token });
    // The host's own edits (from the host page) don't email the host.
    if (event.notify_host && !(await isHost())) await notifyHost(input.slug, token, !!input.token);
    return { ok: true, token };
  } catch (e) {
    if (e instanceof Oops) return { ok: false, error: e.message, refresh: true };
    console.error(e);
    return { ok: false, error: "Something went wrong. Try again?" };
  }
}

type Tx = postgres.TransactionSql;

/**
 * Records what one reply is bringing. Claims they keep stay put (so the list keeps its order);
 * dropped ones go, and so do things they added that nobody else is bringing.
 * With doubling up off, an item someone else already has can't be picked (the item row is locked
 * while checking, so two people can't grab the last one at once).
 */
async function saveBringing(tx: Tx, event: { id: string; allow_doubles: boolean }, householdId: string, picks: string[], own: string[]) {
  const wanted = new Set(picks.slice(0, 20));
  const typed = [...new Set(own.map((n) => tidy(n)).filter(Boolean))].slice(0, 10);
  const create: string[] = [];
  for (const name of typed) {
    // Typed something already on the list (theirs, still needed, or doubling is on)? Use that item.
    const [same] = await tx<{ id: string }[]>`
      select i.id from items i where i.event_id = ${event.id} and lower(i.name) = lower(${name})
        and (i.household_id = ${householdId} or ${event.allow_doubles}
             or (i.kind = 'needed' and not exists (select 1 from claims c where c.item_id = i.id and c.household_id <> ${householdId})))
      order by (i.household_id = ${householdId}) desc nulls last limit 1`;
    if (same) wanted.add(same.id);
    else create.push(name);
  }
  const keep = [...wanted];
  await tx`delete from claims where household_id = ${householdId} and not (item_id = any(${keep}::uuid[]))`;
  await tx`delete from items i where i.household_id = ${householdId} and i.kind <> 'needed'
    and not exists (select 1 from claims c where c.item_id = i.id)`;
  for (const id of keep) {
    const [item] = await tx<{ name: string }[]>`select name from items where id = ${id} and event_id = ${event.id} for update`;
    if (!item) throw new Oops("Something on the list changed. Pick again?");
    if (!event.allow_doubles) {
      const [taken] = await tx`select 1 from claims where item_id = ${id} and household_id <> ${householdId}`;
      if (taken) throw new Oops(`Someone just grabbed ${item.name}! Pick something else?`);
    }
    await tx`insert into claims (item_id, household_id) values (${id}, ${householdId}) on conflict do nothing`;
  }
  for (const name of create) {
    const [item] = await tx<{ id: string }[]>`
      insert into items (event_id, kind, name, household_id) values (${event.id}, 'extra', ${name}, ${householdId}) returning id`;
    await tx`insert into claims (item_id, household_id) values (${item.id}, ${householdId})`;
  }
}

/**
 * Emails a reply's private link. `by` is the reply's token (right after saving)
 * or an email address ("Email me my link": every reply on this event with that address).
 * The button goes to /<event>/r/<token>/remember, which also makes that device remember them.
 */
async function emailLinks(slug: string, by: { token: string } | { email: string }) {
  const rows = await sql<{ id: string; token: string; names: string[]; going: boolean; email: string; title: string; bringing: string[] }[]>`
    select h.id, h.token, h.names, h.going, h.email, e.title,
      coalesce((select array_agg(i.name order by c.created_at) from claims c join items i on i.id = c.item_id where c.household_id = h.id), '{}') as bringing
    from households h join events e on e.id = h.event_id
    where e.slug = ${slug} and h.email is not null
      and ${"token" in by ? sql`h.token = ${by.token}` : sql`h.email = ${by.email}`}`;
  const base = await siteUrl();
  const minute = Math.floor(Date.now() / 60_000); // a double tap within the same minute sends once
  for (const r of rows) {
    const mail = linkEmail({ title: r.title, names: joinNames(r.names), going: r.going, bringing: r.bringing, url: `${base}/${slug}/r/${r.token}/remember` });
    await sendEmail({ to: r.email, ...mail, idempotencyKey: `rsvp-link-${r.id}-${minute}` });
  }
}

/** "Already replied? Email me my link." Always answers the same way, so it never reveals who's on the list. */
export async function emailMyLink(slug: string, _prev: string | null, f: FormData): Promise<string> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That email doesn't look right.";
  await emailLinks(slug, { email });
  return `If ${email} is on a reply, the link is on its way. Check your inbox (and spam).`;
}

/** Emails the host about a reply. Replying to that email goes straight to the guest when they left an email. */
async function notifyHost(slug: string, token: string, changed: boolean) {
  const to = process.env.EMAIL_REPLY_TO;
  if (!to) return;
  const [r] = await sql<{ id: string; names: string[]; going: boolean; kids: number; note: string | null; email: string | null; title: string; bringing: string[] }[]>`
    select h.id, h.names, h.going, h.kids, h.note, h.email, e.title,
      coalesce((select array_agg(i.name order by c.created_at) from claims c join items i on i.id = c.item_id where c.household_id = h.id), '{}') as bringing
    from households h join events e on e.id = h.event_id where e.slug = ${slug} and h.token = ${token}`;
  if (!r) return;
  const mail = replyEmail({
    title: r.title, names: joinNames(r.names), going: r.going, adults: r.names.length, kids: r.kids,
    bringing: r.bringing, note: r.note, changed, hostUrl: `${await siteUrl()}/${slug}/host`,
  });
  await sendEmail({ to, ...mail, replyTo: r.email, idempotencyKey: `reply-note-${r.id}-${Math.floor(Date.now() / 60_000)}` });
}
