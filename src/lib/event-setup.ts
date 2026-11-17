// Setting up an event's pieces, shared by the host's own actions and by forwarded emails (src/app/api/inbound).
// Not a "use server" file on purpose: nothing here can be called from a browser.
import { sql } from "./db";
import { splitNames } from "./format";

// Static routes that an event's web address must not shadow.
export const RESERVED = new Set(["host", "privacy", "terms", "robots.txt", "sitemap.xml", "api"]);

/** A free web address made from the title. */
export async function freeSlug(text: string) {
  const base = text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
  let slug = RESERVED.has(base) ? `${base}-event` : base;
  for (let n = 2; (await sql`select 1 from events where slug = ${slug}`).length; n++) slug = `${base}-${n}`;
  return slug;
}

/**
 * The host's list from the form (one thing per line): new things are added, things taken off are removed
 * (with anyone's claim on them), and the rest keep their claims and take the new order.
 */
export async function saveList(eventId: string, wanted: string[]) {
  const lines = wanted.map((s) => s.trim().slice(0, 120)).filter(Boolean).slice(0, 50);
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

/**
 * Hosts are going to their own events, like any guest (Partiful does the same): added once to the guest list as Going.
 * Skipped if they're already on it (same email, or a reply with their name), so nobody appears twice.
 */
export async function addHostAsGuest(eventId: string, user: { email: string; name: string | null }) {
  const name = user.name || user.email.split("@")[0];
  const first = name.split(/\s+/)[0].toLowerCase(); // "Hudson Ford" is the Hudson in "Hudson & Molly"
  const rows = await sql<{ id: string; names: string[]; email: string | null }[]>`select id, names, email from households where event_id = ${eventId}`;
  const byEmail = rows.find((h) => h.email?.toLowerCase() === user.email);
  if (byEmail) await sql`update households set going = true where id = ${byEmail.id} and going is null`;
  else if (!rows.some((h) => splitNames(h.names).some((n) => n.toLowerCase() === first || n.toLowerCase() === name.toLowerCase())))
    await sql`insert into households ${sql({ event_id: eventId, names: [name], going: true, email: user.email })}`;
}
