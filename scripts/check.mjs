// Quick end-to-end check of the RSVP flow on a phone-sized browser.
// shortcut: uses the Playwright that's preinstalled in Claude's cloud sessions; switch to @playwright/test if checks grow.
// Run against a local server with a fresh database:  npm run build && npm start, then  node scripts/check.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const B = (process.env.BASE_URL ?? "http://localhost:3000") + "/thanksgiving-2026";
const browser = await chromium.launch();
const phone = async () => (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
const rsvp = async (page, name, dish) => {
  await page.goto(B + "/rsvp");
  await page.click("text=Going");
  await page.fill('input[aria-label="Your name"]', name);
  if (dish) await page.click(`button.pill:has-text("${dish}")`);
};

// Two guests race for the same dish: exactly one gets it.
const [a, b] = [await phone(), await phone()];
await rsvp(a, "Check A", "Rolls");
await rsvp(b, "Check B", "Rolls");
await a.click("text=Send RSVP");
await a.waitForURL(/\/r\//);
await b.click("text=Send RSVP");
await b.waitForSelector("text=Someone just grabbed that one");

// The emailed link (…/remember) makes a fresh device remember the reply.
const tokenA = a.url().match(/\/r\/([a-f0-9]+)/)[1];
const other = await phone();
await other.goto(`${B}/r/${tokenA}/remember`);
await other.goto(B);
assert.equal((await other.locator("a.btn").first().textContent()).trim(), "Your RSVP");

// A reused name is caught.
const c = await phone();
await rsvp(c, "check a");
await c.click("text=Send RSVP");
await c.waitForSelector("text=Someone with that name already replied");

// The invite shows the claim.
await a.goto(B);
assert.match(await a.textContent("main"), /Rolls\s*Check A/);
assert.equal((await a.locator("a.btn").first().textContent()).trim(), "Your RSVP"); // this phone remembers its reply

// Host makes a new event whose title is already taken: it gets its own web address and its list.
const h = await phone();
await h.goto(B.replace("/thanksgiving-2026", "/host"));
await h.fill("input[name=password]", process.env.ADMIN_PASSWORD ?? "gravy");
await h.click("text=Sign in");
await h.click("summary:has-text('New event')");
await h.fill("input[name=title]", "Thanksgiving 2026");
await h.fill("input[name=date]", "2027-11-25");
await h.fill("input[name=bring_prompt]", "Bring?");
await h.fill("textarea[name=needed]", "Pie\nCider");
await h.uncheck("input[name=ask_kids]");
await h.click("text=Create event");
await h.waitForURL(/\/thanksgiving-2026-\d+\/host$/);
assert.match(await h.textContent("main"), /Pie[\s\S]*Cider/);
await h.fill("input[placeholder^='Add things']", "Plates, Napkins");
await h.click("button:has-text('Add')");
await h.waitForSelector("text=Napkins");
assert.match(await h.textContent("main"), /Plates[\s\S]*Napkins/); // comma bulk-add
const kidless = h.url().replace(/\/host$/, "/rsvp");
const g = await phone();
await g.goto(kidless);
await g.click("text=Going");
assert.equal(await g.locator("text=Kids coming").count(), 0); // the host turned the kids question off

// The guest's phone lists the plan on the home page.
await a.goto(B.replace("/thanksgiving-2026", "/"));
assert.match(await a.textContent("main"), /Your plans[\s\S]*Thanksgiving 2026[\s\S]*Going/);

// Copy to next year: a draft one year (52 weeks) on, hidden from guests until published.
await h.goto(B + "/host");
await h.click("text=Copy to next year");
await h.waitForURL(/\/thanksgiving-2027(-\d+)?\/host$/);
assert.match(await h.textContent("main"), /Draft\./);
const draftUrl = h.url().replace(/\/host$/, "");
assert.equal((await (await phone()).goto(draftUrl)).status(), 404);
await h.click("button:has-text('Publish')");
await h.waitForSelector("text=Draft.", { state: "detached" });
assert.equal((await (await phone()).goto(draftUrl)).status(), 200);

await browser.close();
console.log("✓ RSVP checks passed (delete the 'Check' guests and the extra event afterwards)");
