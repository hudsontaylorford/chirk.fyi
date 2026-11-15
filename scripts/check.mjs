// Quick end-to-end check of the RSVP flow on a phone-sized browser.
// shortcut: uses the Playwright that's preinstalled in Claude's cloud sessions; switch to @playwright/test if checks grow.
// Run against a local server with a fresh database:  npm run build && npm start, then  node scripts/check.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const B = (process.env.BASE_URL ?? "http://localhost:3000") + "/thanksgiving-2026";
const browser = await chromium.launch();
const phone = async () => (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
// Host sign-in: email, then the code. Locally the server runs with LOGIN_TEST_CODE so no inbox is needed.
// The first time on a fresh database, the old password claims the events made before accounts.
const ORIGIN = B.replace("/thanksgiving-2026", "");
const hostSignIn = async (page, email) => {
  await page.goto(ORIGIN + "/host");
  if (await page.locator("text=Have the old host password?").count()) {
    await page.click("text=Have the old host password?");
    await page.fill("input[aria-label='Old host password']", process.env.ADMIN_PASSWORD ?? "gravy");
    await page.click("button:text-is('Continue')");
    await page.waitForSelector("text=Set up your account");
  }
  await page.fill("input[aria-label='Your email']", email);
  await page.click("button:text-is('Email me a code')");
  await page.fill("input[aria-label='Code']", process.env.LOGIN_TEST_CODE ?? "123456");
  await page.click("button:text-is('Sign in')");
  await page.waitForSelector("text=Your events");
};

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
assert.match(await a.getAttribute("a:text-is('+ Add your own')", "href"), /\/r\/[a-f0-9]+$/); // the chip opens their reply

// Host makes a new event whose title is already taken: it gets its own web address and its list.
const h = await phone();
await hostSignIn(h, "host@example.com");
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
await h.click("#bring button:text-is('Add')");
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
assert.match(await s1.textContent("header"), /10 am\s*Bagels\s*1 pm\s*Snacks & wine\s*4:30 pm\s*Dinner\s*Late\s*Leftovers/);
assert.equal(await s1.locator("header li.font-bold").textContent(), "4:30 pmDinner");
await s1.goto(kidless);
await s1.click("text=Going");
await s1.fill('input[aria-label="Your name"]', "Early Bird");
await s1.click("button.pill:text-is('Snacks & wine')");
await s1.click("button.pill:text-is('Leftovers')");
await s1.click("text=Send RSVP");
await s1.waitForURL(/\/r\//);
assert.match(await s1.textContent("main"), /Coming to: Snacks & wine · Leftovers/);
await h.reload();
assert.match(await h.textContent("main"), /Coming to each part\s*Bagels\s*0\s*Snacks & wine\s*1\s*Dinner\s*0\s*Leftovers\s*1\s*Didn't say\s*\d+/);
assert.match(await h.textContent("main"), /Coming to Snacks & wine · Leftovers/);

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

// Named guests: the host adds them, each gets a personal link that says hi and fills in their names.
await h.goto(kidless.replace(/\/rsvp$/, "/host"));
await h.fill("input[aria-label='Add guests']", "Zed, Yan & Xu yan@example.com");
await h.click("form:has(input[aria-label='Add guests']) button:text-is('Add')");
await h.waitForSelector("li:has-text('Yan & Xu')");
assert.match(await h.textContent("main"), /Zed\s*No reply yet/);
assert.match(await h.textContent("main"), /of \d+ replied/);
await h.click("li:has-text('Yan & Xu') summary:has-text('Send')");
await h.click("li:has-text('Yan & Xu') button:text-is('Email invite')");
await h.waitForSelector("li:has-text('Yan & Xu') >> text=Email only sends from the live site.");
const zedReply = await h.getAttribute("li:has-text('Zed') a:text-is('Edit')", "href");
const z = await phone();
await z.goto(new URL(zedReply + "/remember?to=invite", h.url()).href);
assert.equal(new URL(z.url()).pathname, new URL(kidless).pathname.replace(/\/rsvp$/, ""));
assert.match(await z.textContent("header"), /Hi Zed, you're invited!/);
assert.doesNotMatch(await z.textContent("main"), /Yan & Xu/); // unanswered guests aren't listed as coming
await z.click("a.btn:text-is('RSVP')");
assert.match(await z.textContent("main"), /Hi Zed!/);
assert.equal(await z.inputValue('input[aria-label="Your name"]'), "Zed");
await z.click("text=Going");
await z.click("text=Send RSVP");
await z.waitForSelector("text=You're in!");
const y = await phone();
await y.goto(kidless);
await y.click("text=Going");
await y.fill('input[aria-label="Your name"]', "Yan");
await y.click("text=Send RSVP");
await y.waitForSelector("text=You're on the guest list!");

// Message your guests: a separate note to one group, with a confirm step.
await h.goto(kidless.replace(/\/rsvp$/, "/host"));
await h.click("button.pill:has-text('Everyone')");
await h.fill("textarea[aria-label='Your note']", "Parking is on the street.");
await h.click("button:text-is('Send…')");
await h.click("button:has-text('Send to 1 guest')");
await h.waitForSelector("text=Email only sends from the live site.");

// Co-hosts: any host adds one by email; they sign in and can run the event, but only the owner deletes it or removes hosts.
// Someone never invited anywhere can't get in, even with the right code.
await h.goto(kidless.replace(/\/rsvp$/, "/host"));
await h.click("summary:has-text('+ Add a co-host')");
await h.fill("input[aria-label=\"Co-host's email\"]", "molly@example.com");
await h.click("form:has(input[aria-label=\"Co-host's email\"]) button:text-is('Add')");
await h.waitForSelector("text=Added ✓");
const m = await phone();
await hostSignIn(m, "molly@example.com");
await m.goto(kidless.replace(/\/rsvp$/, "/host"));
assert.match(await m.textContent("main"), /Hosts:\s*host@example\.com \(owner\)|Hosts:[^\n]*\(owner\)[^\n]*you/);
assert.equal(await m.locator("summary:has-text('Delete this event')").count(), 0);
const nobody = await phone();
await nobody.goto(ORIGIN + "/host");
await nobody.fill("input[aria-label='Your email']", "nobody@example.com");
await nobody.click("button:text-is('Email me a code')");
await nobody.fill("input[aria-label='Code']", process.env.LOGIN_TEST_CODE ?? "123456");
await nobody.click("button:text-is('Sign in')");
await nobody.waitForSelector("text=That code didn't work");
await h.reload();
await h.click("summary:text-is('Remove')");
await h.click("details:has(summary:text-is('Remove')) button:text-is('Sure?')");
await h.waitForSelector("summary:text-is('Remove')", { state: "detached" }); // wait for the removal to finish
await m.goto(kidless.replace(/\/rsvp$/, "/host"));
assert.equal(new URL(m.url()).pathname, new URL(kidless).pathname.replace(/\/rsvp$/, "")); // no longer a host

// Hosted by signs the message; notes show in italics; 3:00 PM style when asked for.
await h.goto(kidless.replace(/\/rsvp$/, "/host"));
await h.click("summary:has-text('Basics')");
await h.fill("input[name=hosted_by]", "Pat & Lee");
await h.click("summary:has-text('Schedule')");
await h.check("input[name=long_times]");
await h.click("summary:has-text('Message')");
await h.fill("textarea[name=details]", "Come hungry.");
await h.click("button:text-is('Save')");
await h.waitForSelector("text=Saved");
const s2 = await phone();
await s2.goto(kidless.replace(/\/rsvp$/, ""));
assert.match(await s2.textContent("main"), /Come hungry\.\s*— Pat & Lee/);
assert.match(await s2.textContent("header"), /4:30 PM[\s\S]*10:00 AM\s*Bagels/);

// The footer shows only to people who belong: link holders, hosts and repliers; never strangers or bad links.
const stranger = await phone();
await stranger.goto(B.replace("/thanksgiving-2026", "/"));
assert.equal(await stranger.locator("footer").count(), 0);
await stranger.goto(B.replace("/thanksgiving-2026", "/no-such-event"));
assert.equal(await stranger.locator("footer").count(), 0);
for (const path of ["", "/rsvp"]) {
  await stranger.goto(B + path);
  assert.match(await stranger.textContent("footer"), /By invitation only/);
}
await stranger.goto(B.replace("/thanksgiving-2026", "/privacy"));
assert.equal(await stranger.locator("footer").count(), 1);
await stranger.goto(B.replace("/thanksgiving-2026", "/terms"));
assert.match(await stranger.textContent("main"), /Use it kindly/);
assert.match(await stranger.textContent("footer"), /Privacy · Terms/);
await stranger.goto(B.replace("/thanksgiving-2026", "/host"));
assert.match(await stranger.textContent("main"), /By continuing, you agree to the Terms and Privacy policy\./);
await h.goto(B.replace("/thanksgiving-2026", "/host"));
assert.equal(await h.locator("footer").count(), 1);
await h.goto(B.replace("/thanksgiving-2026", "/"));
assert.equal(await h.locator("footer").count(), 1); // a host's own device

// The guest's phone lists the plan on the home page.
await a.goto(B.replace("/thanksgiving-2026", "/"));
assert.match(await a.textContent("main"), /Your plans[\s\S]*Thanksgiving 2026[\s\S]*Going/);
assert.equal(await a.locator("footer").count(), 1); // a device that has replied

// Copy to next year: a draft one year (52 weeks) on, hidden from guests until published.
await h.goto(B + "/host");
await h.click("text=Copy to next year");
await h.waitForURL(/\/thanksgiving-2027(-\d+)?\/host$/);
assert.match(await h.textContent("main"), /Draft\./);
assert.match(await h.textContent("main"), /Check A\s*No reply yet/); // last year's guests come along, unanswered
assert.match(await h.textContent("main"), /0\s*of \d+ replied/);
const draftUrl = h.url().replace(/\/host$/, "");
assert.equal((await (await phone()).goto(draftUrl)).status(), 404);
await h.click("button:has-text('Publish')");
await h.waitForSelector("text=Draft.", { state: "detached" });
assert.equal((await (await phone()).goto(draftUrl)).status(), 200);

// Deleting an event takes two taps and lands back on Your events, without it.
await h.goto(draftUrl + "/host");
await h.click("summary:has-text('Delete this event')");
await h.click("details:has(summary:has-text('Delete this event')) button:text-is('Sure?')");
await h.waitForURL(/\/host$/);
assert.equal((await (await phone()).goto(draftUrl)).status(), 404);

await browser.close();
console.log("✓ RSVP checks passed (delete the 'Check' guests and the extra event afterwards)");
