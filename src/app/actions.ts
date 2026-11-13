"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export interface RsvpInput {
  slug: string;
  token?: string;
  names: string[];
  going: boolean;
  kids: number;
  note: string;
  main: { itemId: string } | { name: string } | null; // one main dish
  extra: string; // optional "anything else?"
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

  const [event] = await sql<{ id: string }[]>`select id from events where slug = ${input.slug} and status <> 'draft'`;
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
        error: "Someone with that name already replied. If it was you, use the link you saved (Hudson or Molly can resend it).",
      };
    }
  }

  try {
    const token = await sql.begin(async (tx) => {
      const row = {
        names, going: input.going, kids: Math.max(0, Math.min(10, Math.round(input.kids) || 0)),
        note: tidy(input.note ?? "", 500) || null, updated_by: input.answeringAs ? tidy(input.answeringAs, 60) : null,
      };
      const [h] = input.token
        ? await tx<{ id: string; token: string }[]>`
            update households set ${tx(row)}, updated_at = now()
            where token = ${input.token} and event_id = ${event.id} returning id, token`
        : await tx<{ id: string; token: string }[]>`
            insert into households ${tx({ ...row, event_id: event.id })} returning id, token`;
      if (!h) throw new Oops("We couldn't find your RSVP. Is the link right?");

      // Start clean: let go of anything previously claimed or added, then record the new picks.
      await tx`update items set household_id = null where household_id = ${h.id} and kind = 'needed'`;
      await tx`delete from items where household_id = ${h.id} and kind <> 'needed'`;
      if (!input.going) return h.token;

      const main = input.main;
      if (main && "itemId" in main) {
        const [claimed] = await tx`
          update items set household_id = ${h.id}
          where id = ${main.itemId} and event_id = ${event.id} and kind = 'needed' and household_id is null
          returning id`;
        if (!claimed) throw new Oops("Someone just grabbed that one! Pick another?");
      } else if (main && tidy(main.name)) {
        await tx`insert into items (event_id, kind, name, household_id) values (${event.id}, 'main', ${tidy(main.name)}, ${h.id})`;
      }
      if (tidy(input.extra)) {
        await tx`insert into items (event_id, kind, name, household_id) values (${event.id}, 'extra', ${tidy(input.extra)}, ${h.id})`;
      }
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
    return { ok: true, token };
  } catch (e) {
    if (e instanceof Oops) return { ok: false, error: e.message, refresh: true };
    console.error(e);
    return { ok: false, error: "Something went wrong. Try again?" };
  }
}
