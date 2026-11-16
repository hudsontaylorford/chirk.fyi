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

// Shared costs: a guest adds what they paid, another guest sees their share and pays with Venmo,
// the person paid marks it done, and the host sees everyone settle up.
await h.goto(kidless.replace(/\/rsvp$/, "/host"));
await h.click("summary:has-text('Shared costs')");
await h.check("input[name=costs_on]");
await h.click("form:has(input[name=costs_on]) button:text-is('Save')");
await h.waitForSelector("text=Saved");
const invite = kidless.replace(/\/rsvp$/, "");
await z.goto(invite);
await z.click("summary:has-text('+ Add a cost')");
await z.fill("input[aria-label='What for']", "Pizza");
await z.fill("input[aria-label='Amount']", "40");
await z.click("button:text-is('Add cost')");
await z.waitForSelector("text=Added ✓");
await z.fill("#venmo", "@zed-v");
await z.click("form:has(#venmo) button:text-is('Save')");
await z.waitForSelector("text=Saved ✓");
await s1.goto(invite);
assert.match(await s1.textContent("body"), /Costs\s*·\s*\$40 so far[\s\S]*Pizza\s*\$40[\s\S]*Zed paid/);
assert.match(await s1.textContent("body"), /You owe Zed \$\d+(\.\d\d)?/);
assert.match(await s1.getAttribute("a:text-is('Pay with Venmo')", "href"), /^https:\/\/venmo\.com\/zed-v\?txn=pay&amount=\d+\.\d\d&note=/);
assert.equal(await s1.locator("text=Mark paid").count(), 0); // only the person paid (or a host) confirms
await z.reload();
await z.click("li:has-text('Early Bird owes you') button:text-is('Mark paid')");
await z.waitForSelector("li:has-text('Early Bird owes you')", { state: "detached" });
await s1.reload();
assert.match(await s1.textContent("body"), /You're even ✓/);
await h.reload();
assert.match(await h.textContent("main"), /Settle up[\s\S]*owes Zed/);

// Poker: buy-ins (a player can add their own rebuy), cash-outs, and settling only once the chips add up.
await h.click("summary:has-text('Shared costs')");
await h.check("input[name=poker_on]");
await h.click("form:has(input[name=poker_on]) button:text-is('Save')");
await h.waitForSelector("text=Saved");
const pokerIn = async (page, who, amount, kind = "buyin") => {
  await page.click(`label:has(input[name=kind][value=${kind}])`); // the pill is what people tap
  if (who) await page.selectOption("select[aria-label=Player]", { label: who });
  await page.fill("input[aria-label='Poker amount']", amount);
  await page.click("form:has(input[aria-label='Poker amount']) button:text-is('Add')");
  await page.waitForSelector(`text=${kind === "buyin" ? "Buy-in added ✓" : "Cash-out saved ✓"}`);
};
await h.reload();
await pokerIn(h, "Zed", "20");
await h.reload();
await pokerIn(h, "Early Bird", "20");
await s1.goto(invite);
await pokerIn(s1, null, "20"); // Early Bird rebuys from their own phone
await h.reload();
await pokerIn(h, "Zed", "50", "cashout");
await h.reload();
assert.match(await h.textContent("main"), /In \$60 · Out \$60 ✓ Added to settle up\.\s*Early Bird hasn't cashed out, so they're counted as the \$10 left on the table/); // worked out, no waiting
await pokerIn(h, "Early Bird", "10", "cashout");
await h.reload();
assert.match(await h.textContent("main"), /In \$60 · Out \$60 ✓ Added to settle up\./);
assert.match(await h.textContent("main"), /Zed\s*\$20\s*\$50\s*\+\$30[\s\S]*Early Bird\s*\$40\s*\$10\s*−\$30/);
await s1.reload();
assert.match(await s1.textContent("body"), /You owe Zed \$30/);

// A poker night where nobody replies: the host adds names, and they're players straight away.
await h.goto(ORIGIN + "/host/new");
await h.fill("input[name=title]", "Poker test");
await h.fill("input[name=date]", "2027-01-08");
await h.click("button:text-is('Create event')");
await h.waitForURL(/\/poker-test(-\d+)?\/host$/);
const pokerHost = h.url();
await h.fill("input[aria-label='Add guests']", "Hudson, Sam, Lee");
await h.click("form:has(input[aria-label='Add guests']) button:text-is('Add')");
await h.waitForSelector("li:has-text('Lee')");
await h.click("summary:has-text('Shared costs')");
await h.check("input[name=poker_on]");
await h.click("form:has(input[name=poker_on]) button:text-is('Save')");
await h.waitForSelector("text=Saved");
await h.goto(pokerHost);
await h.fill("input[aria-label='Buy-in for everyone']", "20");
await h.click("button:text-is('Buy in all')");
await h.waitForSelector("text=Bought in 4 at $20 ✓"); // the host is at the table too
await h.click("button:text-is('Buy in all')"); // tapping again doubles nobody
await h.waitForSelector("text=Everyone's already bought in.");
await h.goto(pokerHost);
assert.equal(await h.inputValue("input[aria-label='Poker amount']"), "20"); // the usual buy-in is prefilled
await h.click("label:has(input[name=kind][value=cashout])");
await h.selectOption("select[aria-label=Player]", { label: "Sam" });
await h.fill("input[aria-label='Poker amount']", "10000");
await h.click("form:has(input[aria-label='Poker amount']) button:text-is('Add')");
await h.waitForSelector("text=That's more than the whole table put in ($80). Check the amount.");
assert.equal(await h.isChecked("input[name=kind][value=cashout]"), true); // the choice stays after submitting
assert.equal(await h.inputValue("select[aria-label=Player]"), await h.getAttribute("select[aria-label=Player] option:text-is('Sam')", "value"));
for (const [who, amount, kind] of [["Lee", "20"], ["Hudson", "55", "cashout"], ["Sam", "25", "cashout"], ["Lee", "0", "cashout"]]) {
  await h.goto(pokerHost);
  await pokerIn(h, who, amount, kind);
}
await h.goto(pokerHost);
assert.match(await h.textContent("main"), /Poker night[\s\S]*In \$100 · Out \$100 ✓ Added to settle up\.\s*Hostie hasn't cashed out, so they're counted as the \$20 left on the table/); // the host never cashed out: their $20 is what's left
assert.match(await h.textContent("main"), /Lee owes Hudson \$35[\s\S]*Lee owes Sam \$5/);
const leeLink = await h.getAttribute("li:has-text('Lee') a:text-is('Edit')", "href");
const lee = await phone();
await lee.goto(new URL(leeLink + "/remember?to=invite", h.url()).href);
assert.match(await lee.textContent("body"), /You owe Hudson \$35[\s\S]*You owe Sam \$5/); // no reply needed to see their share
assert.equal(await lee.locator("text=Mark paid").count(), 0);

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
await h.click("#hosts summary:text-is('Remove')");
await h.click("#hosts details:has(summary:text-is('Remove')) button:text-is('Sure?')");
await h.waitForSelector("#hosts summary:text-is('Remove')", { state: "detached" }); // wait for the removal to finish
await m.goto(kidless.replace(/\/rsvp$/, "/host"));
assert.equal(new URL(m.url()).pathname, new URL(kidless).pathname.replace(/\/rsvp$/, "")); // no longer a host

// Head counts: "Graham and Ellen" typed in one box is two people; hosts' names sign an invite with no Hosted by.
const ge = await phone();
await ge.goto(pokerHost.replace(/\/host$/, "/rsvp")); // an event with no limit on extra guests
await ge.click("text=Going");
await ge.fill('input[aria-label="Your name"]', "Gil and Eve");
await ge.click("text=Send RSVP");
await ge.waitForURL(/\/r\//);
await h.goto(pokerHost);
assert.match(await h.textContent("main"), /Gil & Eve/); // saved as two people
// Your events and the event page count the same (couples typed together are two people).
const tile = Number((await h.locator("div.rounded-2xl:has-text('coming') >> div.text-\\[28px\\]").first().textContent()).trim());
await h.goto(ORIGIN + "/host");
assert.match(await h.textContent("li:has-text('Poker test')"), new RegExp(`${tile} coming`));
await h.goto(pokerHost);

await h.goto(ORIGIN + "/");
assert.equal(await h.locator("a:text-is('Your events ›')").count(), 1);
const nobodyHome = await phone();
await nobodyHome.goto(ORIGIN + "/");
assert.equal(await nobodyHome.locator("a:text-is('Your events ›')").count(), 0);
await h.goto(ORIGIN + "/host");
if (await h.locator("input#name").count()) { await h.fill("input#name", "Hostie"); await h.click("form:has(input#name) button:text-is('Save')"); await h.waitForSelector("input#name", { state: "detached" }); }
const signer = await phone();
await signer.goto(pokerHost.replace(/\/host$/, ""));
assert.match(await signer.textContent("header"), /Hosted by Hostie/);

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
// Private chirks are kept out of search; the public pages are listed.
await stranger.goto(B);
assert.match(await stranger.getAttribute('meta[name="robots"]', "content"), /noindex/);
const robots = await (await fetch(ORIGIN + "/robots.txt")).text();
assert.match(robots, /Disallow: \/host/);
assert.match(await (await fetch(ORIGIN + "/sitemap.xml")).text(), /\/privacy<\/loc>/);
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
assert.match(await h.textContent("main"), /0\s*of \d+ replied/); // the host is going, but hosts aren't counted as replies
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

// Gift exchange: names in, a "never draw each other" rule, a draw, and each person seeing only their own match.
await h.goto(ORIGIN + "/host/new");
await h.fill("input[name=title]", "Gift test");
await h.fill("input[name=date]", "2026-12-20");
await h.click("button:text-is('Create event')");
await h.waitForURL(/\/gift-test(-\d+)?\/host$/);
const giftHost = h.url();
await h.fill("input[aria-label='Add guests']", "Ann, Ben, Cal, Dee & Eve");
await h.click("form:has(input[aria-label='Add guests']) button:text-is('Add')");
await h.waitForSelector("li:has-text('Dee & Eve')");
await h.click("summary:has-text('Gift exchange')");
await h.check("input[name=gift_on]");
await h.fill("input[name=gift_budget]", "$30");
await h.fill("textarea[name=gift_rules]", "Something secondhand. Bring it wrapped.");
await h.click("form:has(input[name=gift_on]) button:text-is('Save')");
await h.waitForSelector("text=Saved");
await h.goto(giftHost);
await h.selectOption("select[aria-label='First person']", { label: "Ann" });
await h.selectOption("select[aria-label='Second person']", { label: "Ben" });
await h.click("form:has(select[aria-label='First person']) button:text-is('Add')");
await h.waitForSelector("text=Ann ↔ Ben");
await h.click("button:text-is('Draw names')");
await h.waitForSelector("text=Names drawn for 5 ✓"); // Ann, Ben, Cal, Dee & Eve, and the host
const annLink = await h.getAttribute("li:has-text('Ann') a:text-is('Edit')", "href");
const ann = await phone();
await ann.goto(new URL(annLink + "/remember?to=invite", h.url()).href);
const match = (await ann.textContent("section:has(h2:has-text('Gift exchange'))")).match(/giving a gift to(.+?)(Their ideas|They haven)/)[1].trim();
assert.ok(match && !["Ann", "Ben"].includes(match), `Ann drew ${match}`); // never herself, never Ben
assert.match(await ann.textContent("body"), /Gift exchange · \$30/);
assert.match(await ann.textContent("body"), /5 in: Hostie · you · Ben · Cal · Dee & Eve[\s\S]*Something secondhand\. Bring it wrapped\./); // the details and rules, for everyone in it
await ann.fill("#wish", "Books, hot sauce");
await ann.click("button:text-is('Save ideas')");
await ann.waitForSelector("text=Saved ✓");
await h.goto(giftHost);
await h.click("button:text-is('Email everyone their match')");
await h.waitForSelector("text=Email only sends from the live site.");
assert.equal(await h.locator("text=giving a gift to").count(), 0); // hosts aren't spoiled
await h.click("label.pill-check:has-text('Cal')"); // untick Cal
await h.click('button:has-text("Save who")');
await h.waitForSelector("text=draw again to include everyone");

// The morning job: draws today's gift exchange and sends due reminders, once; without the secret it does nothing.
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const cron = (auth) => fetch(ORIGIN + "/api/cron", { headers: auth ? { authorization: `Bearer ${process.env.CRON_SECRET ?? "testcron"}` } : {} });
assert.equal((await cron(false)).status, 401);
await h.goto(ORIGIN + "/host/new");
await h.fill("input[name=title]", "Auto draw");
await h.fill("input[name=date]", "2026-12-24");
await h.click("button:text-is('Create event')");
await h.waitForURL(/\/auto-draw(-\d+)?\/host$/);
const autoHost = h.url();
const autoSlug = new URL(autoHost).pathname.split("/")[1];
await h.fill("input[aria-label='Add guests']", "Ana ana@example.com, Bo bo@example.com, Cy");
await h.click("form:has(input[aria-label='Add guests']) button:text-is('Add')");
await h.waitForSelector("li:has-text('Cy')");
await h.click("summary:has-text('Gift exchange')");
await h.check("input[name=gift_on]");
await h.fill("input[name=gift_draw_on]", today);
await h.click("summary:has-text('Reply by')");
await h.fill("input[name=rsvp_by]", today);
await h.check("input[name=remind_replies]");
await h.click("form:has(input[name=gift_on]) button:text-is('Save')");
await h.waitForSelector("text=Saved");
let ran = await (await cron(true)).json();
assert.ok(ran.done.includes(`${autoSlug}: gift_draw (0)`), JSON.stringify(ran)); // drawn; emails don't send off the live site
assert.ok(ran.done.includes(`${autoSlug}: reply_reminder (2)`), JSON.stringify(ran)); // Ana and Bo have emails, Cy doesn't
ran = await (await cron(true)).json();
assert.ok(!ran.done.some((d) => d.startsWith(`${autoSlug}:`)), "nothing twice");
await h.goto(autoHost);
assert.match(await h.textContent("main"), /Names drawn and emailed: [^·]+· sent ✓/);
assert.match(await h.textContent("main"), /Names drawn for 4 ✓/); // Ana, Bo, Cy and the host
assert.match(await h.textContent("main"), /Automatic reminder to anyone who hasn't replied: [^·]+· sent ✓/);

// Select several: guests (email them, then remove them), and events (archive, then unarchive).
await h.goto(pokerHost);
await h.fill("input[aria-label='Add guests']", "Bulk One, Bulk Two bulk2@example.com");
await h.click("form:has(input[aria-label='Add guests']) button:text-is('Add')");
await h.waitForSelector("li:has-text('Bulk Two')");
assert.equal(await h.locator("input[aria-label='Select Bulk One']").isVisible(), false); // hidden until Select
await h.click("details.bulk summary:text-is('Select')");
await h.check("input[aria-label='Select Bulk One']");
await h.check("input[aria-label='Select Bulk Two']");
await h.click("#bulk-guests button:text-is('Email reminder')");
await h.waitForSelector("text=Email only sends from the live site. 1 had no email.");
await h.check("input[aria-label='Select Bulk One']"); // ticks clear after each action
await h.check("input[aria-label='Select Bulk Two']");
h.once("dialog", (d) => d.accept());
await h.click("#bulk-guests button:text-is('Remove')");
await h.waitForSelector("li:has-text('Bulk One')", { state: "detached" });
assert.equal(await h.locator("li:has-text('Bulk Two')").count(), 0);
await h.goto(ORIGIN + "/host");
await h.click("details.bulk summary:text-is('Select')");
await h.check("input[aria-label='Select Poker test']");
await h.click("#bulk-events button:text-is('Archive')");
await h.waitForSelector("text=Archived 1 ✓");
await h.reload();
assert.match(await h.textContent("main"), /Archived \(\d+\)/);
await h.click("summary:has-text('Archived')");
await h.click("details.bulk summary:text-is('Select')");
await h.check("input[aria-label='Select Poker test']");
await h.click("#bulk-events button:text-is('Unarchive')");
await h.waitForSelector("text=Unarchived 1 ✓");

await browser.close();
console.log("✓ RSVP checks passed (delete the 'Check' guests and the extra event afterwards)");
