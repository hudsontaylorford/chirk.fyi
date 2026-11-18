# chirk: status (Nov 16, 2026)

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
