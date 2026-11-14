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
await b.waitForSelector("text=Someone just grabbed Rolls");

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
assert.match(await a.textContent("main"), /Check A\s*Rolls/);
assert.equal((await a.locator("a.btn").first().textContent()).trim(), "Your RSVP"); // this phone remembers its reply

// Host makes a new event whose title is already taken: it gets its own web address and its list.
const h = await phone();
await h.goto(B.replace("/thanksgiving-2026", "/host"));
await h.fill("input[name=password]", process.env.ADMIN_PASSWORD ?? "gravy");
await h.click("text=Sign in");
await h.click("text=+ New event");
await h.waitForURL(/\/host\/new$/);
await h.fill("input[name=title]", "Thanksgiving 2026");
await h.fill("input[name=date]", "2027-11-25");
await h.click("summary:has-text('What to bring')");
await h.check("input[name=bring_on]");
await h.fill("input[aria-label='Add things']", "Pie, Cider");
await h.click("button:text-is('Add')");
await h.check("input[name=allow_doubles]");
await h.click("summary:has-text('Guest options')");
await h.check("input[name=notes_public]");
await h.click("text=Create event");
await h.waitForURL(/\/thanksgiving-2026-\d+\/host$/);
assert.match(await h.textContent("main"), /Pie[\s\S]*Cider/);
await h.click("button:text-is('Edit list')");
await h.fill("input[aria-label='Add things']", "Plates, Napkins");
await h.click("button:text-is('Add')");
await h.click("button:text-is('Save')");
await h.waitForSelector("text=Saved");
await h.reload();
assert.match(await h.textContent("main"), /Plates[\s\S]*Napkins/); // comma bulk-add
const kidless = h.url().replace(/\/host$/, "/rsvp");
const g = await phone();
await g.goto(kidless);
await g.click("text=Going");
assert.equal(await g.locator("text=Kids coming").count(), 0); // kids question is off by default

// Several things at once: two from the list, plus "Wine, Pie" typed in (two items).
await g.fill('input[aria-label="Your name"]', "Picker");
await g.click('button.pill:has-text("Pie")');
await g.click('button.pill:has-text("Cider")');
await g.fill('input[aria-label="Add your own"]', "Wine, Pie");
await g.click('button:text-is("Add")');
await g.click("text=Send RSVP");
await g.waitForURL(/\/r\//);
assert.match(await g.textContent("main"), /Bringing: Pie, Cider, Wine/);

// Doubling up is on for this event: someone else can bring Wine too (after confirming).
const d2 = await phone();
await d2.goto(kidless);
await d2.click("text=Going");
await d2.fill('input[aria-label="Your name"]', "Doubler");
d2.once("dialog", (dlg) => dlg.accept());
await d2.click('button.pill:has-text("Wine")');
await d2.click("text=Send RSVP");
await d2.waitForURL(/\/r\//);
await d2.goto(kidless.replace(/\/rsvp$/, ""));
assert.match(await d2.textContent("main"), /Picker\s*[^\n]*Wine[\s\S]*Doubler\s*[^\n]*Wine/);

// Public notes show on the invite as bubbles.
const n1 = await phone();
await n1.goto(kidless);
await n1.click("text=Going");
await n1.fill('input[aria-label="Your name"]', "Noter");
await n1.fill("textarea", "Can't wait!");
await n1.click("text=Send RSVP");
await n1.waitForURL(/\/r\//);
await n1.goto(kidless.replace(/\/rsvp$/, ""));
assert.match(await n1.textContent("main"), /Noter\s*Can't wait!/);

// The host turns off "add your own" and allows no extra guests: the RSVP form follows.
await h.click("summary:has-text('What to bring')");
await h.uncheck("input[name=allow_own]");
await h.click("summary:has-text('Guest options')");
await h.selectOption("select[name=max_guests]", "0");
await h.click("form:has(select[name=max_guests]) button:text-is('Save')");
await h.waitForSelector("text=Saved");
const t = await phone();
await t.goto(kidless);
await t.click("text=Going");
assert.equal(await t.locator('input[aria-label="Add your own"]').count(), 0);
assert.equal(await t.locator("text=+ Add someone").count(), 0);

// A schedule shows on the invite, and guests can say when they're arriving; the host sees who's there by each stage.
await h.reload();
await h.click("summary:has-text('Basics')");
await h.fill("input[name=time]", "16:30");
await h.click("summary:has-text('Schedule')");
await h.fill("textarea[name=schedule]", "10am Bagels\n1pm Snacks & wine\n4:30pm Dinner\nLate Leftovers");
await h.check("input[name=ask_arrival]");
await h.click("form:has(textarea[name=schedule]) button:text-is('Save')");
await h.waitForSelector("text=Saved");
const s1 = await phone();
await s1.goto(kidless.replace(/\/rsvp$/, ""));
assert.match(await s1.textContent("header"), /10am\s*Bagels\s*1pm\s*Snacks & wine\s*4:30pm\s*Dinner\s*Late\s*Leftovers/);
assert.equal(await s1.locator("header li.font-bold").textContent(), "4:30pmDinner");
await s1.goto(kidless);
await s1.click("text=Going");
await s1.fill('input[aria-label="Your name"]', "Early Bird");
await s1.click("button.pill:text-is('Snacks & wine')");
await s1.click("text=Send RSVP");
await s1.waitForURL(/\/r\//);
assert.match(await s1.textContent("main"), /Coming for: Snacks & wine/);
await h.reload();
assert.match(await h.textContent("main"), /There by\s*Bagels\s*0\s*Snacks & wine\s*1\s*Dinner\s*\d+/);
assert.match(await h.textContent("main"), /Coming for Snacks & wine/);

// Half-typed new events survive a reload, and Discard clears them.
await h.goto(B.replace("/thanksgiving-2026", "/host"));
await h.goto(B.replace("/thanksgiving-2026", "/host/new"));
await h.fill("input[name=title]", "Half typed");
await h.click("summary:has-text('Message')");
await h.fill("textarea[name=details]", "Bring a chair");
await h.waitForTimeout(100);
await h.reload();
await h.waitForSelector("text=Restored what you were typing");
assert.equal(await h.inputValue("input[name=title]"), "Half typed");
assert.equal(await h.inputValue("textarea[name=details]"), "Bring a chair");
await h.click("button:text-is('Discard')");
await h.waitForLoadState();
await h.waitForTimeout(300);
assert.equal(await h.locator("text=Restored what you were typing").count(), 0);

// A host link sent to a guest by mistake just opens the invite.
const nosy = await phone();
await nosy.goto(B + "/host");
assert.equal(new URL(nosy.url()).pathname, "/thanksgiving-2026");

// Hosted by signs the message; notes show in italics; 3:00 PM style when asked for.
await h.goto(kidless.replace(/\/rsvp$/, "/host"));
await h.click("summary:has-text('Basics')");
await h.fill("input[name=hosted_by]", "Pat & Lee");
await h.check("input[name=long_times]");
await h.click("summary:has-text('Message')");
await h.fill("textarea[name=details]", "Come hungry.");
await h.click("button:text-is('Save')");
await h.waitForSelector("text=Saved");
const s2 = await phone();
await s2.goto(kidless.replace(/\/rsvp$/, ""));
assert.match(await s2.textContent("main"), /Come hungry\.\s*— Pat & Lee/);
assert.match(await s2.textContent("header"), /4:30 PM/);

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

// Deleting an event takes two taps and lands back on Your events, without it.
await h.goto(draftUrl + "/host");
await h.click("summary:has-text('Delete this event')");
await h.click("button:text-is('Sure?')");
await h.waitForURL(/\/host$/);
assert.equal((await (await phone()).goto(draftUrl)).status(), 404);

await browser.close();
console.log("✓ RSVP checks passed (delete the 'Check' guests and the extra event afterwards)");
