# chirk: status (Nov 23, 2026)

*A snapshot of where everything is. Update it after each round of work.*

## In one paragraph
chirk is live at chirk.fyi and ready for Thanksgiving (Thu Nov 26, 3 pm, replies by Nov 19). Guests reply without accounts; hosts (Hudson and Molly) sign in with an emailed code. Beyond the invite and bring list, it now handles named invitations, email invites and reminders, co-hosts, shared costs, poker nights and gift exchanges, with a 9 am morning job for scheduled emails. A full audit (stress tests, bugs, security, counts, wording) ran on Nov 16; its fixes are waiting on a branch.

## Live now (main)
Everything up to Nov 16's "fixes-3":
- Invite, RSVP, personal reply links, bring list, schedule with parts of the day, photos, drafts, Copy to next year
- Accounts by email code, co-hosts, Your events (with Select for bulk), privacy, terms, `noindex` on private pages
- Named invitations, email invites and reminders, Message your guests, reply notices to hosts
- Shared costs, poker (missing cash-outs worked out when the math allows), Venmo links, Mark paid
- Gift exchange: who's in, never-draw pairs, rules, draws, matches by email, reminders
- Hosts added to their own guest lists as going (new events, co-hosts, copies only)

## Waiting for review (Nov 23, `required-questions`)
- **Required questions** (Hudson): each question has "Guests who are going must answer it", like the note question. The RSVP shows "Required." and Send RSVP says "Please answer …" until it's answered; chirk's server checks it too. Guests who can't make it can skip. Off by default; saved inside the questions, so no database step.

## Went live Nov 23 (PR 8: `cohost-wrong-account`)
- **Text-box questions** (Hudson): a question with empty Choices is now a plain text box (no tick needed), e.g. "Your shoe size". Type one choice (like "Yes") to get the tick box that opens a text box, e.g. "Any food allergies?" (ticked with nothing written records "Yes"). Answers stay hosts-only.
- **Named links forgive a space:** `[Shoe choices] (www.…)` now works like `[Shoe choices](www.…)`.
- **Fix: a co-host link could look broken** (Hudson, added by Hannah). The email's link opens Your events. If you were already signed in with a different email than the one you were added under, it quietly showed your own events and not the shared one. Now it says "This link was for …" with **Sign out and switch**, which lands on sign-in with that address filled in. Code only, no database step.

## Went live Nov 23 (PR 7: `text-links`)
- **Named links in the Message** (Hudson): `[Diana](https://…)` shows "Diana" as the link, on the invite and in the emailed invite (plain-text email shows "Diana (https://…)"). Works inside bold too, and in question labels (invite, RSVP, host and reply pages). Plain pasted links still work, and links starting with `www.` now work too (with or without https://). The formatting help under the Message box now shows it. Code only, no database step.

## Went live Nov 23 (PR 6: `required-note`)
- **The note question can be required** (Hudson, for a shipping address). New tick in Edit event → Guest options, under Note question: "Guests who are going must answer it". When it's on, the RSVP says "Required" and Send RSVP points to the box if it's empty. Guests who can't make it can still skip it. chirk's server checks it too. Off by default.
- **Database step, before merging:** run `db/schema.sql` in the Neon SQL editor (adds `events.note_required`).

## Went live Nov 23 (PR 5: `question-boxes`)
- **Fix: only one question could be added on New event** (Hudson). The next box appeared only after saving, and New event has no Save. Now the next question box shows as soon as you type in the one above. Code only, no database step.
- **Tick-box questions with a write-in** (Hudson): leave a question's Choices empty and guests get a tick box ("Allergies?") that opens a box to write in. Only hosts see what they wrote (host page, Copy answers, and the guest's own reply page). Up to 5 questions now, so a brand dinner can ask pair, size, delivery, main and allergies.

## Went live Nov 23 (PR 4: `four-questions`)
- **Up to 4 questions** (was 3), so a brand dinner can ask shoe, size, delivery and main course.

## Went live Nov 23 (PR 3: `match-photo-links`)
- **Fix: "Match the invite's color to the photo" didn't stick for a pasted image link** (Hudson, on Thanksgiving's Pinterest cover). Sites like Pinterest and Google won't let the browser read their pictures, so no color was found and Save cleared the box. Now chirk's server fetches the picture for the color (hosts only, https images only, up to 4 MB). It says "Reading the photo's color…", then "Color matched ✓" or, if a link isn't an image (a pin.it share link), it unticks the box right away with the reason. No database step.
- **Plain warnings so a cover never looks broken:** a link that isn't a picture now says why ("Share links (like pin.it) open a page, not the image. Save the image and upload it, or paste the image's own address") and hides the Match box; the Image link box explains "press and hold it, then Copy Image Address".

## Went live Nov 23 (PR 2: brand events)
For Molly's brand (influencer) events, e.g. a brand ships each guest the shoe they pick before the event.
- **Hide who's coming:** a checkbox in Guest options. Guests no longer see the Coming list, notes, the questions' counts (questions are asked only in the reply), or who's already bringing an item; hosts still see everything. Off by default, so existing events don't change.
- **Poll → Questions:** up to 3 questions (4 since Nov 23) in the Questions row, each with up to 20 choices (half sizes fit) and a "Guests pick just one" box. Guests tap chips; the invite shows counts (unless hidden); the host page shows who picked what; the guest's page shows their answers. An existing poll moves over with its votes.
- **Copy answers** beside Guests on the host page: every reply as rows (name, email, reply, each question, the note) that paste into a spreadsheet, for handing to a brand.
- **Shipping address, no code:** rename the note question ("Shipping address", example "Street, apt, city, ZIP"). Product links go in the Message (already tappable).
- **Invite color from the cover (look OK'd by Hudson Nov 22):** "Match the invite's color to the photo" in the Photo row, off by default. A pale shade of the photo's main color behind the invite, RSVP and reply pages, and a deep shade on the RSVP button and picked choices (white or black text, whichever reads better; Hudson, Nov 23). Body text stays black, links slate blue; contrast tested for every hue. Read on the phone before upload; pasted links from sites that block it (Pinterest) get "upload the photo instead". Recorded in `docs/CHIRK_UI_PATTERNS.md` (§1 rule 5, §2).
- **Database step before merging:** run `db/schema.sql` again (adds `events.hide_guests`, `events.questions`, `households.answers`, `events.theme`, and moves any poll over; safe to re-run).
- Known: the phone walkthrough (`npm run check`) stops at "Add guests" (Yan & Xu) locally on main too, so not from this change. Not built: required questions, answers in the reply email to hosts.

## Went live Nov 21 (`polls`)
- **Polls:** one question per event, in the event form's new Poll row (under More options until it's set): a question and its choices, one per line (up to 10). Anyone replying, Going or not, can pick any in the RSVP form. The invite shows each choice with its vote count and a Vote link; the host page shows the counts and who picked what (Edit poll opens the row); the guest's own page says what they picked. Copy to next year keeps the poll, not the votes. Clearing the question turns it off.
- Database: `events.poll_question`, `events.poll_choices`, `households.poll` (in `db/schema.sql`).
- Not built: votes in the reply email to hosts, voting without replying, single-choice polls.

## Went live Nov 21 (`text-invite`)
- **Text invite / Text reminder:** in a guest's Send invite, two buttons open Messages on the phone with a personal note and their own link filled in ("Hi Sam! You’re invited to Thanksgiving 2026 on Thursday, November 26. RSVP here: …"); you pick who it goes to. chirk keeps no phone numbers and sends no texts. No database step.
- Roadmap (ROADMAP.md): polls, a photo album, and a second "classy" theme, from the Nov 21 app comparison.

## Went live Nov 20 (`unify`, merged as PR 1)
- **One look on every page (Stage 6):** host pages, sign-in, New event, costs, poker and gifts now use the v1 patterns: no black pills or gray boxes, hairlines, 8px corners, one primary per screen (Share invite or Publish; Save on the form), links for everything else, gray Remove / Delete then a red Sure?. + New event is a link beside Your events. The old utilities are gone and the guard test checks every screen.
- **Newcomer wording:** "No account needed." beside RSVP (page and invite email); "This page is your reply" after replying; "Every invite you get, in one place: chirk.fyi/me" in emails; sign-in is "Sign in to chirk"; /me with only invites says "Your plans".
- **One vocabulary:** Remove (guests) vs Delete (events), View invite, Edit reply, Send invite, "Hi Sam," in every email, Your plans for invites. Emails share one button (8px, like the site).
- **Audit, color comparison and Hannah walkthrough:** `docs/UX_COHERENCE_NOV20.md`. **Links are slate blue `#3d5a99`** (Hudson, Nov 20); everything else, including focus, picked choices and buttons, stays black. Emails unchanged.
- Also: a plain "Something went wrong / Try again" page instead of the framework's blank error; a clearer empty guest list; Knip run (two needless exports removed); useful-later tools added to ROADMAP.md.
- No behavior change, no database step. Checks: unit tests, `npm run check`, a11y all pass; guest baselines re-captured.

## Went live Nov 18 (`me`)
- chirk.fyi/me goes to Your events (sign in with the emailed code if needed), which now also lists **Invited**: upcoming live events with a reply under your email, except ones you host, each with Going / Can’t make it / Reply. Someone who only has invites sees them first, with "+ Plan your own event" as a quiet link, and isn't asked the co-host name question.
- Invites chirk emails to a guest, and the "Your RSVP" link email, end with "All your chirk invites: chirk.fyi/me". Copied invites don't.
- "me" is now a reserved web address. Not listed: past invites (add if people ask).

## Went live Nov 18 (`import-big-images`)
- Auto-refresh: Your events and each event's host page pick up new replies every 20 seconds while on screen, and right away when you come back to the tab (never while you're typing in a field).
- Fix: a big poster (e.g. a Canva export, often 5–20 MB) in "Paste a text or screenshot" crashed the page, because Vercel turns away anything over 4.5 MB before chirk sees it. Images over 1 MB are now shrunk on the phone first (the same shrinker as cover photos, 1600px); a PDF over 4 MB gets a plain message instead. The walkthrough attaches a 12 MB poster.

## Went live Nov 18 (`freeze-v1`): Stage 5
- **UI patterns v1 frozen** (`docs/CHIRK_UI_PATTERNS.md`): rules, tokens, actions, choices, fields, focus and feedback, type and spacing, boxes, the invite / form / confirmation patterns, what's still provisional, and the old → new map for Stage 6 (~100 old-style uses across ~20 host files). Changing a frozen pattern needs a reason, Hudson's OK, the doc and new baselines.
- **Guard test** (`src/lib/patterns.test.mts`): fails if a guest screen uses an old class (`btn`, `pill`, filled boxes, pill corners) or an off-token color, or if the accent becomes a fill. Docs and a test only; nothing on the site changes.
- CLAUDE.md now points future work at the patterns doc.

## Went live Nov 18 (`design-review`)
- **Stage 4 design reviews** (Anthropic frontend-design skill + Vercel Web Interface Guidelines, read from source): `docs/DESIGN_REVIEWS_V2.md`. Fixed: typographic apostrophes, balanced headings, the cover gets a description and loads first, Send RSVP always tappable (says what's missing and focuses it), no spellcheck in email boxes, press/hover feedback without color, no trailing "›". Five open calls for Hudson (typeface, middle dots, centered reply-by, photo size reservation, type scale); declines explained.

## Went live Nov 18 (`a11y`)
- **Accessibility pass on the guest flow** (`docs/A11Y_CHECKS.md`, `node scripts/a11y.mjs`): tap targets, names, contrast, headings, keyboard focus, 320px, reduced motion. Fixed: two links under 44px (the RSVP page's event name, "Pick something to bring"), and the confirmation's event name is now a heading. Everything else passed. Baselines re-captured.
- **Real iPhone (Hudson):** AutoFill, no zoom on typing, Still needed → RSVP and Add to calendar all ✓. **Safari's largest zoom broke the layout** (long title and schedule ran off the screen): fixed (long words wrap, the schedule stacks under 240px, email rows wrap) and the a11y script now checks 130px wide. VoiceOver still to try (`docs/A11Y_CHECKS.md`).

## Went live Nov 18 (`b2-counts`)
- **B2 fixed (Message your guests):** the Going / Haven't replied / Everyone choices no longer show a bare email count ("Going · 0" when 3 were going). One quiet line says delivery for the chosen group: "2 emails · 3 need a text".
- **Copy cleanup (Hudson's brief):** "Send an update without changing the invite." · Going / No reply yet / Everyone · "Write a note" · "Include event details" · **Send update** (then the existing confirm, "Send to 2 guests", and "Sent to 2 ✓"). Copy only: recipients, sending and layout unchanged; the host redesign is still Stage 6. No database step.

## Went live Nov 18 (`mono-cover`)
- **Cover regression fixed:** Stage 3's desktop cap (`md:max-h-[55vh]`) plus the existing `object-cover object-top` cropped the Thanksgiving poster by 196px at 1280×900 (273px on a 760px-tall laptop). From 768px wide the cap is gone: the photo shows whole at full column width (measured: 0px cut). The phone cap (70% of the screen, since Nov 14) is gone too: covers are never cropped on any screen.
- **Guest UI back to monochrome:** chirk blue removed; links ink and underlined, picked choices ink outline + ✓, ink focus ring. All via `--color-accent` (ink for now), so a brand color is one value later. Baselines re-captured.

## Went live Nov 18 (`guest-v2`): UI v2, Stage 3 guest slice
- **Invite → RSVP → confirmation** in the v2 system (`docs/CHIRK_UI_PATTERNS.md`): (shipped with chirk blue #2457F5 for links, focus and picked choices, since taken back to monochrome); 8px ink primary button; choices with a blue outline and ✓; no guest-side boxes; notes as plain quotes; RSVP right after what/when/where; Coming hidden until someone's going.
- **B1 fixed:** each Still needed item opens the RSVP with it already picked. **B3 fixed:** the confirmation shows the event, date, place and Add to calendar.
- RSVP keeps the event name and date on top, then "Your RSVP" / "Are you coming?"; "Already replied?" is a quiet link at the bottom.
- Desktop cover photo capped at 55% of the screen height; phones unchanged.
- Visual baselines: `node scripts/visual.mjs` (7 screens, 390px + desktop). Host pages untouched. No database step.
- Also live: the forwarded-email 401 fix (accepts Resend's `svix-*` signature headers). Next for forwarding: retry the webhook in Resend.
- Next for UI v2: B2 (message-guests counts), real-iPhone + screen-reader checks, Anthropic Frontend Design + Vercel guideline reviews, then Stage 5/6 (host tools).

## Went live Nov 17 (`forward-email`)
- **Forward an email to chirk (roadmap 44):** forward an invite, reservation or ticket email from your chirk sign-in address to the forwarding address; it becomes a **draft** in Your events (same reader as Paste a text), and you get "Draft ready: …" with a link. Signature-checked, only chirk accounts' own addresses, one draft per email, 20 a day. The address shows inside "Paste a text or screenshot". Setup in Resend, Cloudflare and Vercel: SETUP.md §8.
- **Database step:** the `inbound_emails` table (run Nov 17). Resend, Cloudflare and Vercel setup (SETUP.md §8) still to do.
- Under the hood: the event set-up helpers (free web address, host on the guest list, bring list) moved to `src/lib/event-setup.ts` so the email handler shares them; nothing a browser can call.

## Went live Nov 17 (`import-voice`)
- **Paste a text or screenshot, tuned from the first real try** (a Halloween stoop party text): the Message now keeps the host's own words nearly verbatim (voice, slang, emojis), and **Hosted by** fills in when the text names hosts ("me & ahmad" → "Hudson & Ahmad", using the signed-in host's name). No database step.

## Went live Nov 17 (`import`)
- **Paste a text or screenshot (roadmap 43):** on New event, paste a group text or email, or add a screenshot, photo or PDF; Claude (Opus 5.5) reads it and New event opens filled in like a template (title, date, times, place, address, message, schedule, what to bring). Unknowns stay blank; nothing is saved until Create event; the file is never stored. Adapted from crewmaxxing's import (prompt rules, file checks, refusal fallback, plain errors). Anthropic key added by Hudson Nov 17; first real read worked (title, date, times, bring list right; no place invented). New dependency: `@anthropic-ai/sdk`. No database step.

## Went live Nov 17 (`tiles`)
- **Event tiles (roadmap 37):** the host page's number tiles follow what each event uses: **still owed** (costs or poker, with how many payments), **in the pot** (poker: cashed out ✓ or how many still to cash out), **giving gifts** (drawn ✓ · N without ideas, or not drawn yet), beside coming, replies and still needed. The money math now lives in one helper (`settleUp`) shared by the Costs section, Mark paid and the tiles. No database step.

## Went live Nov 17 (`local-first`)
- **Nearby places first:** Place and Address suggestions favor places within about 30 miles of the host, from Vercel's rough city guess for their connection (no location prompt, never stored). Faraway matches still show.

## Went live Nov 17 (`address-search`)
- **The Address box searches too:** typing a street there suggests full addresses; a tap fills it in ("56 bogar" → "56 Bogart St, Brooklyn, NY 11206"). Both boxes now ask the phone's contact AutoFill to stay out of the way. Google key confirmed working Nov 17 (Place found "MetLife").

## Went live Nov 16 (`places`)
- **Address lookup (roadmap 14b):** typing in Place suggests real places from Google; tapping one fills in the Address. The Place box keeps your own words (Google's terms). Copied from crewmaxxing's approach. Google key added by Hudson Nov 16 (SETUP.md §6); first real check is step 9 there. No database step.

## Went live Nov 16 (`own-templates`)
- **Save as a template:** on any event's host page (under Copy to next year). Keeps the settings, message, times, place, photo and what to bring; never the title, dates or guests. Your templates list first under New event → Start from a template, each with Remove. Up to 30 per person.
- **Database step:** the `templates` table (run Nov 16; also in `db/schema.sql`).

## Went live Nov 16 (`trim`)
- **Schedule** moved under More options (it shows on its own once it has lines or asks which parts guests are coming to).
- **Templates cut to three** that switch a feature on: Poker night, Secret Santa, White elephant. Saving your own is next on the roadmap.
- **Roadmap:** import (43), forward an email (44), crewmaxxing → chirk (45), address lookup reusing crew-scheduler's Google approach (14b).

## Went live Nov 16 (`templates`)
- **Templates (roadmap 29):** a quiet "Start from a template" line on New event opens ten: Dinner or potluck, Holiday meal, Party or birthday, Shower or celebration, Game or watch night, Poker night, Secret Santa, White elephant, Tickets or an outing, Quick hang. Picking one fills in settings and example wording only; "Start blank" undoes it. No database step.

## Went live Nov 16 (`more-options`)
- **More options (roadmap 35):** the event form shows the everyday rows (Basics, Message, Photo, What to bring, Schedule, Reply by). Guest options, Shared costs, Gift exchange and Web address wait under one "More options" row; any of them that's switched on shows as its own row. No database step.

## Went live Nov 16 (`notes-4`, includes `audit`)
- **Security:** sign-in code guessing closed (a burst of guesses could skip the 5-try limit); test sign-in code can't work on any Vercel deploy.
- **Privacy:** archiving can't make a draft public; "Email me my link" ignores drafts; gift matches moved into Edit event → Gift exchange → "Trouble with the draw?".
- **Money:** Mark paid records once (no double taps); deleting a guest with costs or poker warns first.
- **Morning job:** can't draw names twice; the "you're giving to" reminder waits for the draw.
- **Counts:** hosts don't count as replies; "Sam, Priya" is two people; no duplicate host rows.
- **Wording:** about 20 fixes (plurals, couples, one term per thing, neutral examples); new sign-in page: "Been invited to an event? You're invited to chirk."

## Checked on Nov 16
- **Stress:** 25 phones replying at once all saved; 10 people racing for one dish → exactly one got it; a double-tapped Send made one reply; the morning job fired 5 times at once → one draw, no repeat emails; 20 simultaneous wrong codes → capped at 5 tries.
- **Tests:** 41 unit tests and the full phone walkthrough pass (twice in a row before each push).
- **Setup:** all Vercel settings are in place, including `CRON_SECRET`; the morning job ran at 9 am Nov 16 (200).

## Decisions made
- Hosts RSVP automatically (Partiful-style): on the list as going, labeled Host, never counted as a reply.
- Poker and gift exchange can both be on one event; templates and advanced options (roadmap 29, 35) will tidy the form.
- Everyone on the list is in the gift exchange unless they can't make it or the host unticks them.
- Who can sign in: anyone on any chirk guest list, framed as "You're invited to chirk".
- Gift matches stay out of sight unless something goes wrong.

## Held on purpose
- **The "join chirk" email** to Thanksgiving guests: once more emails are collected. Not built.
- **Tightening who can get an account** (only emails a host added): before chirk goes beyond friends. Today anyone who finds an event address can reply with an email and then sign in.

## Known limits
- Deleting a guest also deletes their costs and poker (with a warning).
- Cost shares are fixed when a cost is added (a later +1 doesn't change an older split).
- Copied events: an old reply without an email ("Hudson & Molly") stays "No reply yet" until changed.
- Neon can be slow to wake (a rare `CONNECT_TIMEOUT`); auto-retry is offered but not built.
- Email greetings vary slightly ("Hi X," vs "Hi X!").

## Next moves (suggested)
1. Use chirk for Thanksgiving and watch what guests do.
2. After Nov 26: a short retro.
3. Phase 1 picks from ROADMAP.md: event tiles (37), Cash App button and payment links (33, 34), place autocomplete (14).
4. Phase 2: Your people (12, 24) and the "join chirk" email.
