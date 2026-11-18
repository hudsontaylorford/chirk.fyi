// Visual baselines for the guest flow (chirk v2, docs/CHIRK_UI_PATTERNS.md): invite → RSVP → confirmation,
// at 390px and desktop, on fixed fixture events so the pictures only change when the design does.
//   node scripts/visual.mjs           capture to visual/current and list screens that differ from visual/baseline
//   node scripts/visual.mjs --update  capture straight into visual/baseline (after a change is approved)
// Needs the local server (npm run build && npm start) and DATABASE_URL. Pixel-for-pixel (sha-256), no extra packages:
// shortcut: exact match only, so fonts or browser upgrades show as changes; add a tolerant diff if that gets noisy.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const postgres = (await import("postgres")).default;

const ORIGIN = process.env.BASE_URL ?? "http://localhost:3000";
const update = process.argv.includes("--update");
const dir = update ? "visual/baseline" : "visual/current";
mkdirSync(dir, { recursive: true });
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
const [g1] = await sql`insert into households ${sql({ event_id: d.id, names: ["Graham", "Ellen"], going: true, kids: 2, note: "Arriving around 5", token: "visualtokengraham000000000000000" })} returning id`;
await sql`insert into households ${sql({ event_id: d.id, names: ["Sam"], going: true, token: "visualtokensam000000000000000000" })}`;
const [mains] = await sql`select id from items where event_id = ${d.id} and name = 'Mains'`;
await sql`insert into claims (item_id, household_id) values (${mains.id}, ${g1.id})`;

const b = await chromium.launch();
const phone = async () => (await b.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 1 })).newPage();
const desktop = async () => (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const shots = [
  ["390-invite-detailed", phone, async (p) => p.goto(`${ORIGIN}/visual-detailed`)],
  ["390-invite-light", phone, async (p) => p.goto(`${ORIGIN}/visual-light`)],
  ["390-rsvp", phone, async (p) => { await p.goto(`${ORIGIN}/visual-detailed/rsvp`); await p.click("text=Going"); }],
  ["390-rsvp-picked", phone, async (p) => { await p.goto(`${ORIGIN}/visual-detailed`); await p.click("main a.choice >> nth=0"); await p.waitForURL(/pick=/); }],
  ["390-confirmation", phone, async (p) => p.goto(`${ORIGIN}/visual-detailed/r/visualtokensam000000000000000000`)],
  ["desktop-invite", desktop, async (p) => p.goto(`${ORIGIN}/visual-detailed`)],
  ["desktop-confirmation", desktop, async (p) => p.goto(`${ORIGIN}/visual-detailed/r/visualtokengraham000000000000000`)],
];
const changed = [];
for (const [name, open, go] of shots) {
  const p = await open();
  await go(p);
  await p.waitForLoadState("networkidle");
  const png = await p.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  const base = `visual/baseline/${name}.png`;
  if (!update && (!existsSync(base) || createHash("sha256").update(readFileSync(base)).digest("hex") !== createHash("sha256").update(png).digest("hex"))) changed.push(name);
}
await b.close();
await sql`delete from events where slug in ('visual-detailed', 'visual-light')`;
await sql.end();
if (update) console.log(`Baselines saved to visual/baseline (${shots.length} screens).`);
else if (changed.length) { console.log(`Changed from baseline (see visual/current): ${changed.join(", ")}`); process.exit(1); }
else console.log(`All ${shots.length} screens match the baseline ✓`);
