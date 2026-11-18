// Fixed fixture events for the guest-flow checks (scripts/visual.mjs, scripts/a11y.mjs): a detailed invite with replies
// and the lightest possible one. Tokens are fixed so the reply pages have stable addresses.
import { readFileSync } from "node:fs";
const postgres = (await import("postgres")).default;

export const SAM = "visualtokensam000000000000000000";
export const GRAHAM = "visualtokengraham000000000000000";

export async function withFixtures(run) {
  const url = process.env.DATABASE_URL ?? readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1];
  const sql = postgres(url, { prepare: false, onnotice: () => {} });

  // Fixtures: a detailed invite (message, schedule, bring list, replies) and the lightest possible one.
  await sql`delete from events where slug in ('visual-detailed', 'visual-light')`;
  // The cover is the seed event's poster (stored in the database, so it renders the same every time).
  const [{ cover }] = await sql`select coalesce((select cover_url from events where slug = 'thanksgiving-2026'), '') as cover`;
  const [d] = await sql`insert into events ${sql({
    cover_url: cover || null,
    slug: "visual-detailed", title: "Harvest dinner", date: "2030-11-21", time: "15:00:00", place: "The Fords'", address: "56 Example St, Brooklyn, NY",
    details: "Come whenever!\n\nA few of us cover the mains; everyone else brings one thing.", hosted_by: "Hudson & Molly", rsvp_by: "2030-11-14",
    schedule: "1 pm Snacks\n3 pm Dinner\nAfter Games", bring_prompt: "What are you bringing?", allow_own: true, notes_public: true, status: "live",
  })} returning id`;
  await sql`insert into events ${sql({ slug: "visual-light", title: "Coffee at Sample Hall", date: "2030-11-22", time: "10:00:00", place: "Sample Hall", status: "live" })}`;
  for (const [i, name] of ["Mains", "Salad", "Dessert", "Drinks"].entries()) await sql`insert into items ${sql({ event_id: d.id, kind: "needed", name, sort: i + 1 })}`;
  const [g1] = await sql`insert into households ${sql({ event_id: d.id, names: ["Graham", "Ellen"], going: true, kids: 2, note: "Arriving around 5", token: GRAHAM })} returning id`;
  await sql`insert into households ${sql({ event_id: d.id, names: ["Sam"], going: true, token: SAM })}`;
  const [mains] = await sql`select id from items where event_id = ${d.id} and name = 'Mains'`;
  await sql`insert into claims (item_id, household_id) values (${mains.id}, ${g1.id})`;
  try {
    return await run();
  } finally {
    await sql`delete from events where slug in ('visual-detailed', 'visual-light')`;
    await sql.end();
  }
}
