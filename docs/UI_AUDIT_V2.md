# chirk UI/UX v2: Stage 1 audit (read-only)

*Nov 18, 2026. Done against the brief "chirk UI / UX v2: Audit, Design Constitution, and Claude Implementation Brief". No code was changed. Screens captured at 390px (iPhone 13) and 1280px on a local copy with realistic Thanksgiving data (4 replies, one "can't make it", one "no reply yet", kids, notes, claimed dishes).*

---

## 0. Summary

chirk's bones are right: one column, plain type, real words, few colors, finite pages. The guest flow is short and works. Most problems are **too many boxes and too many equal-weight buttons**, not missing features:

- **Guest side:** the invite is close. The RSVP page opens with the wrong thing (a gray "Already replied?" box above the question), and the confirmation page forgets the plan (no date, place or Add to calendar after you say you're going).
- **Host side:** the event page has drifted into a dashboard: stat tiles, a Send box, Guests, a Message box, What to bring, a whole settings form, then four full-width buttons. Everything has the same weight, so nothing says "do this next".
- **Geometry:** the 999px pill is used for primary buttons, secondary buttons, toggles, list items, chips, badges, status labels and links-as-chips. Once everything is a pill, nothing signals "tap me".
- **Color:** there is no accent yet (`--color-accent` is the same near-black as ink), so links are plain underlined black and gray. That's the slot the chirk blue fills.
- **Three real bugs** (section 7) and a handful of accessibility gaps (section 6). The bugs are worth fixing on their own, before or alongside the slice.

---

## 1. Page by page

### 1.1 Invite (`/thanksgiving-2026`): the core screen

**What you see:** cover photo full width → title → date · time → place · address (link) → schedule → Add to calendar → message → "— Hudson & Molly" → **RSVP** (black pill) → "Please reply by" → Still needed (dashed pills + "+ Add your own") → Coming · 7 (each household, what they're bringing, a gray italic note bubble) → footer.

**Works:** the decision layer (what, when, where) is together and early; the schedule is the most "chirk" thing on the page (quiet two-column times); Coming is a calm list; the page ends.

**Problems:**
- **RSVP is below the message.** With a long note, the one action a guest came for is two screens down (the pinned button helps only after scrolling past it). The decision layer should end with the action: *what · when · where · RSVP*, then context.
- **Still needed items look tappable but aren't** (bordered pills; only "+ Add your own" is a link). See bug B1.
- **Note bubbles** (gray, italic, rounded with a tail) are the only decorative element on the page and the only chat metaphor in the product. A note can be plain italic text under the name.
- **"Add to calendar"** sits between the schedule and the message, competing with both. After a reply it matters more (see 1.3); on the invite it can be a quiet link in the date line.
- **Cover photo** takes ~55% of the first screen at 390px and the whole first screen on desktop (title starts at y≈650 of 900). The brief says no arbitrary crop, so keep it, but cap height on desktop (today: phone column centered, image full column width).
- **Lightweight test:** with no photo, no schedule, no message and no bring list, the page collapses to title, when, where, RSVP, Coming. That already scales down well; keep it that way.

**Proposed hierarchy:**
1. Photo (if any)
2. **Title** · when (· Add to calendar) · where (address as a link)
3. **RSVP** (one strong button) · reply-by under it
4. Message, signed
5. Schedule (if any)
6. Still needed (plain list or tappable choices, see B1)
7. Coming

### 1.2 RSVP (`/…/rsvp`)

**What you see:** back link → "RSVP" → gray box "Already replied? Email me my link" → Are you coming? (Going / Can't make it, two big pills) → Your name (+ Add someone) → What are you bringing? (pill choices + "Add your own" field) → Anything we should know? → Send RSVP.

**Works:** short; one decision per block; good labels; Going/Can't are big and thumb-friendly.

**Problems:**
- **The first thing a new guest sees is for returning guests.** "Already replied?" is a filled box above the question. Move it to a quiet link under Send RSVP.
- **"RSVP" as a page title** says nothing; the event's name does. Title: the event name; the question is the heading.
- **Help text under every question** ("Bringing someone? Add them too, one reply for everyone." / "Tap one or two, or add your own." / "Optional. Shows on the invite."). Keep the one that explains a consequence ("Shows on the invite"); fold "one reply for everyone" into the "+ Add someone" control; drop "Tap one or two".
- **Bring choices are solid pills here, dashed on the invite.** Same items, two looks.
- **Name field:** on iPhone, Safari offers Contact AutoFill on fields it reads as a name (crewmaxxing hit this; see A4).

### 1.3 Confirmation / your reply (`/…/r/<token>`)

**What you see:** "You're going" · names → "Not bringing anything yet." → gray box "Keep your link" (email field + black Send + "Copy the link instead") → "Change my reply" (gray pill).

**Problems:**
- **It forgets the plan.** No date, time, place or Add to calendar right after the guest commits. This is the moment they want those.
- **The strongest button is "Send"** (inside the Keep your link box), not anything about the plan. Keeping the link matters, but it's secondary.
- **"Not bringing anything yet."** when the host asked: a missed nudge. "Pick something to bring →" (a link into the reply) does more.
- Two boxes/pills for two secondary actions.

**Proposed:** "You're going, Sam" → *when · where · Add to calendar* → what you're bringing (or the nudge) → Change my reply (link) → Keep your link (quiet, below).

### 1.4 Home (`/`)

Stranger: "chirk* / By invitation only". Guest who replied: "Your plans" list (title, date, Going ›). Good and finite. Note the status color is green text on this page and green on host lists; on the invite "Going" isn't colored. Fine, but decide once (section 5).

### 1.5 Sign in (`/host`)

Big two-line heading, two paragraphs, email field, black button, legal line. The heading and the two paragraphs say similar things; one short paragraph would do. Otherwise clear.

### 1.6 Your events (`/host`)

**What you see:** Sign out → "Your events" · "Signed in as …" → **+ New event** (black pill) → Select → rows: title + green **Live** / amber **Draft** pill, "Thu, Nov 26 · Hosted by …", `chirk.fyi/slug`, "7 coming ›".

**Problems:**
- **Live is a badge on every row.** Live is the normal state; only Draft (and Archived) need a word. Badges on every row are noise.
- **The URL line** (`chirk.fyi/…`) on every row is for the host to copy, but nothing on the row copies it. Drop it here (it's on the event page).
- "Hosted by …" repeats the host's own name on their own list; keep only when someone else co-hosts.
- **Future feed fit:** title · when · "7 coming" is already the shape of a plans-feed row. Good.

### 1.7 New event (`/host/new`)

Title, date, starts/ends, place, address, hosted by, then grouped rows (Message, Photo, What to bring, Reply by, More options), then Create event. Plus two quiet underlined lines at the top (Paste a text or screenshot; Start from a template).

**Works:** progressive disclosure is real (More options; switched-on rows come out). The row pattern (label left, current value right, ›) is the best host-side pattern in the app.

**Problems:**
- Seven open fields before the rows. For the brief's "What's happening? / Where? / When?" composer: Title, Date, Starts are the core; Ends, Address, Hosted by could sit in the rows ("Where" opens place + address; "Hosted by" defaults to your name).
- The two lines at the top are both underlined gray text, same weight as the back link.

### 1.8 Host event page (`/…/host`): the biggest change

**Top to bottom today:** back + View event → title → "Hosts: you (owner)" + "+ Add a co-host" → 3 stat tiles (boxes) → **Send the invite** box (heading, 2-line explanation, black Share button, outlined Copy for email button) → **Guests** (add field + black Add, help text, Select, then every reply with name, status word, what they're bringing, note bubble, and three small links: Copy their link · Edit · Delete) → **Message your guests** box (heading, 2 lines, three pills, warning line, textarea, checkbox, gray Send…) → **What to bring** (Still needed pills, Covered pills, Edit list) → **Event** (the whole settings form, 8 rows) → black **Save** → gray **Copy to next year** → gray **Save as a template** → gray **Archive** → Delete this event.

**Problems (the "dashboard" drift):**
- **Five black buttons** (Share, Add, Save, plus RSVP-black Send states) and **four full-width gray buttons** stacked at the bottom. No single next action.
- **Stats are boxes.** The brief's own example is right: one line, "7 coming · 4 of 5 replied · 5 still needed", with the number that needs attention linked to where you act on it.
- **Explanations every visit:** "Text it to a group, or copy it into an email (the photo, message and RSVP button come along)." / "An email to your guests, apart from the invite. Use it for updates or a day-before note. The invite doesn't change." / "Commas between guests. Add an email after a name…". Useful once; noise on the 20th visit.
- **Per-row actions** (Copy their link · Edit · Delete) on every guest are small (14px) and repeated 30 times on a big list. They belong behind the row (tap a guest → their actions) or Select.
- **Settings and maintenance** (the Event form, Copy to next year, Save as a template, Archive, Delete) take ~40% of the page and are rarely used once an event is live.

**Proposed shape: event → state → next action:**
1. Title · when · Live/Draft · **Share invite** (the one primary action) · View event
2. One stat line: **7 coming** · 4 of 5 replied · **5 still needed** (links)
3. *Needs attention* (only when true): "1 hasn't replied · Remind" / "Draft: publish when ready"
4. Guests (rows; tap one for its actions)
5. What to bring
6. Message your guests (collapsed to one line until opened)
7. **Edit event** → the settings form on its own screen or collapsed; Copy to next year, Save as a template, Archive, Delete in one "More" menu at the end.

---

## 2. Action map

| Screen | Primary (one) | Secondary | Overflow / quiet | Destructive |
|---|---|---|---|---|
| Invite | **RSVP** | Add to calendar, address → Maps | + Add your own | — |
| RSVP | **Send RSVP** | + Add someone | Already replied? (email link) | — |
| Confirmation | (none needed; it's a receipt) **Add to calendar** | Change my reply | Keep your link (email / copy) | — |
| Home | open a plan | — | — | — |
| Sign in | **Email me a code** | — | old host password | — |
| Your events | **New event** | open an event | Select (bulk) | Delete via Select |
| New event | **Create event** | Paste a text, template | More options | — |
| Host event | **Share invite** (Publish when draft) | Remind, Add guests, Message guests | Edit event, Copy to next year, Save as template, Archive, co-hosts | Delete event, delete guest |

Today the host page has ~5 primaries; the table's one-per-screen rule is the main fix.

---

## 3. Cards, pills and boxes inventory

**Boxes (rounded wash or bordered containers), 14 kinds:** stat tiles · Send the invite · Message your guests · Keep your link · Already replied? · Event settings group · Costs/Poker table area · gift match card · Everyone buys in · Add a cost (details) · Restored-draft notice · amber warnings · draft/archived banners · note bubbles.

Keep as boxes (containment means something): **warnings/alerts** (amber), **the settings row group** (it's a list of rows), **the gift match card** (it's a secret: the box marks it). Everything else can be type + spacing + a hairline.

**Pills (999px), 30 places:** primary buttons, secondary buttons, Going/Can't toggles, bring choices, Still needed items, Covered items, "+ Add your own", Live/Draft/Host badges, audience toggles, poker/split toggles, template chips.

Proposal: **buttons get a modest radius (8–10px), not 999**; **selection controls** (Going/Can't, bring choices, audience) stay tappable but read as choices (outlined, checked state), not decorations; **status** becomes a word (Draft) not a chip; **lists** (Still needed, Covered) become plain lists or real toggles; never a pill that does nothing.

---

## 4. Copy reductions (examples)

| Where | Today | Proposed |
|---|---|---|
| Send the invite | "Text it to a group, or copy it into an email (the photo, message and RSVP button come along)." | *(none; button says "Share invite")* |
| Message your guests | "An email to your guests, apart from the invite. Use it for updates or a day-before note. The invite doesn't change." | "An email apart from the invite." |
| Guests field | "Commas between guests. Add an email after a name to send it from here." | placeholder: "Sam, Graham & Ellen, ellen@…"; help only on first use |
| RSVP name | "Bringing someone? Add them too, one reply for everyone." | *(the "+ Add someone" control carries it)* |
| RSVP bring | "Tap one or two, or add your own." | *(drop)* |
| Keep your link | "This phone remembers your reply. For any other device, we'll email you the link." | "Email yourself the link for other devices." |
| Sign in | two paragraphs | one: "Sign in with the email you were invited with. We'll send a 6-digit code." |
| Ask question labels | "Are you coming?" · "Your name" · "What are you bringing?" · "Anything we should know?" | keep: these are good |

Voice check: no startup language anywhere; "chirk reads it and fills in…" style lines are fine but only once.

---

## 5. Color and type

- **Accent:** `--color-accent` = ink today, so every link is underlined black/gray and every primary is black. Introduce **one chirk blue** for: links (address, Add to calendar, Change my reply, Edit list), focus rings, and the *selected* state of choices. Keep primary buttons ink (black). No blue surfaces.
- **Status colors:** green for "Going" and "Live" (text), amber for Draft/warnings, red only for the final destructive confirm. Proposal: green only for "Going"; Live needs no color.
- **Type:** the scale is fine (34 / 28 / 20 / 17 / 15 / 13–14). Issues: page titles and section headings are both bold and close in size on host pages, so boxes do the grouping. Let headings (20px) + 32–40px section spacing + hairlines carry hierarchy; drop boxes.
- **Soft gray (#78716c) on wash (#f5f5f4)** is ~4.4:1, under AA for the 14px help text inside boxes. Either the boxes go (preferred) or that text darkens.

---

## 6. Accessibility findings

- **A1 Tap targets:** per-guest links (Copy their link · Edit · Delete), "Select", "+ Add a co-host", "Edit list", footer links are ~20–24px tall. Target 44px (padding, not bigger text).
- **A2 Focus:** fields set `outline: none` and rely on a border color change (OK); `.btn` and links use browser defaults, which differ by browser. Define one visible focus ring (the blue) for links, buttons and choices.
- **A3 Contrast:** soft text on wash (above). Disabled "Send…" gray-on-gray on the host page reads as broken rather than disabled.
- **A4 Name field:** label "Your name" invites Safari Contact AutoFill on iPhone; crewmaxxing solved the same thing. Check on a real iPhone.
- **A5 Headings/landmarks:** pages use h1/h2 well; the invite's "Coming · 7" count is inside the heading (fine). Confirm the pinned RSVP button isn't read twice by screen readers.
- **A6 Reduced motion:** only the row chevron rotates; fine. No other animation.

---

## 7. Behavior bugs (not cosmetic)

- **B1 Still needed items look tappable but do nothing.** On the invite they're bordered pills; only "+ Add your own" is a link. Either make each one a link into the reply with that item picked (best: one tap from "Mashed potatoes" to claiming it), or render them as plain text.
- **B2 "Message your guests" counts read as zero people.** With 3 going, the toggles say "Going · 0", because they count only guests with an email. The warning line below explains it, but the number is wrong for what the label says. Show "Going · 3" and say "0 have an email" in the line, or label it "0 emails".
- **B3 The confirmation page has no date, place or calendar link.** A guest who replies and closes the tab has nothing to add to their calendar from the page they land on (the invite has it; the reply page doesn't).
- Watch item: **"Hosts: you (owner)"** shows on events where a household like "Hudson & Molly" exists without an email, so the Host label doesn't attach (copied events). Not new; noted earlier as a known limit.

---

## 8. Change register (by impact)

| # | Change | Where | Impact | Size |
|---|---|---|---|---|
| 1 | RSVP right after what/when/where; message after | Invite | High (core action earlier) | S |
| 2 | Confirmation shows when/where + Add to calendar; Keep your link becomes quiet | Reply page | High (B3) | S |
| 3 | Still needed: tap an item to claim it, or plain text | Invite | High (B1) | M |
| 4 | "Already replied?" → quiet link at the bottom; title = event name | RSVP | Med | S |
| 5 | Introduce chirk blue for links/focus/selected; one focus ring | Global | Med | S |
| 6 | Buttons 8–10px radius; status as words; lists not pills | Global (start with guest flow) | Med | M |
| 7 | Note bubbles → plain italic under the name | Invite, host | Low | S |
| 8 | Message-your-guests counts (B2) | Host | Med (trust) | S |
| 9 | Host page: one stat line, one primary (Share/Publish), "needs attention" line, Edit event + More menu | Host | High | L |
| 10 | Your events: no Live badge, no URL line, no own "Hosted by" | Host list | Low | S |
| 11 | Tap targets to 44px; contrast on boxes | Global | Med (a11y) | S |
| 12 | Composer: Title · When · Where open; the rest as rows | New event | Med (future) | M |

---

## 9. Recommended first vertical slice (Stage 3)

**Guest: invite → RSVP → confirmation**, items 1, 2, 3, 4, 5, 6 (guest screens only), 7, 11 (guest screens). It sets:

- link style + chirk blue + focus ring
- primary button (ink, modest radius) and secondary action (blue link, no box)
- choice control (Going/Can't, bring items) with a clear selected state
- section rhythm (heading + spacing + hairline, no boxes)
- optional sections that vanish when empty (already true; keep)
- confirmation pattern ("You're going, Sam" + when/where/calendar)

Then capture Playwright baselines (390px + desktop) for those three screens, as the brief suggests; chirk's existing walkthrough (`scripts/check.mjs`) already drives these screens, so baselines fit in.

**Needs a decision before Stage 3:** the exact blue (a hex), and the button radius.

---

## 10. Constitution notes (Stage 2 input)

The constitution matches what the audit found. Three small proposals, not silent reinterpretations:

1. **5.4 Pills:** add "**a pill never does nothing**": anything shaped like a control must be one (B1 is the case).
2. **5.2 One primary action:** add that on the host page the primary is **Share invite** when live, **Publish** when draft.
3. **5.9 Color:** add that **green means Going** only (not Live), so status color keeps one meaning.

---

## 11. Future compatibility

- **Lightweight chirk** ("Hudson · Sey Coffee · now → 2"): the invite with no photo/message/schedule/list already collapses to that shape; the proposed order (what · when · where · RSVP) keeps it one screen.
- **Plans feed:** the Your events row (title · when · "7 coming") and the guest Home row ("Thanksgiving 2026 · Thu, Nov 26 · Going ›") are already feed rows. Drop the badges/URL and they're the same row.
- **Circles / map:** nothing here conflicts; host settings rows (label · value · ›) extend to visibility ("Who sees it: Thanksgiving crew ›").

*Not done in this pass: a real iPhone Safari check (A4), screen-reader run-through (A5), and the Anthropic Frontend Design / Vercel guideline passes (the brief puts those at Stage 4).*
