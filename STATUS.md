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

## Waiting to go live (branch `trim`)
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
