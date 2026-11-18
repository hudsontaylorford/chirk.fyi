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
import { GRAHAM, SAM, withFixtures } from "./fixtures.mjs";

const ORIGIN = process.env.BASE_URL ?? "http://localhost:3000";
const update = process.argv.includes("--update");
const dir = update ? "visual/baseline" : "visual/current";
mkdirSync(dir, { recursive: true });
const { changed, total } = await withFixtures(async () => {
  const b = await chromium.launch();
  const phone = async () => (await b.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 1 })).newPage();
  const desktop = async () => (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const shots = [
    ["390-invite-detailed", phone, async (p) => p.goto(`${ORIGIN}/visual-detailed`)],
    ["390-invite-light", phone, async (p) => p.goto(`${ORIGIN}/visual-light`)],
    ["390-rsvp", phone, async (p) => { await p.goto(`${ORIGIN}/visual-detailed/rsvp`); await p.click("text=Going"); }],
    ["390-rsvp-picked", phone, async (p) => { await p.goto(`${ORIGIN}/visual-detailed`); await p.click("main a.choice >> nth=0"); await p.waitForURL(/pick=/); }],
    ["390-confirmation", phone, async (p) => p.goto(`${ORIGIN}/visual-detailed/r/${SAM}`)],
    ["desktop-invite", desktop, async (p) => p.goto(`${ORIGIN}/visual-detailed`)],
    ["desktop-confirmation", desktop, async (p) => p.goto(`${ORIGIN}/visual-detailed/r/${GRAHAM}`)],
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
  return { changed, total: shots.length };
});
if (update) console.log(`Baselines saved to visual/baseline (${total} screens).`);
else if (changed.length) { console.log(`Changed from baseline (see visual/current): ${changed.join(", ")}`); process.exit(1); }
else console.log(`All ${total} screens match the baseline ✓`);
