# chirk

A simple way to make plans with your people: one page per plan, one link to send. Phone first, invite only. First real event: Thanksgiving 2026.

- **Where things stand right now:** [STATUS.md](STATUS.md)
- **Getting it live / every Vercel setting:** [SETUP.md](SETUP.md)
- **What's next:** [ROADMAP.md](ROADMAP.md) · **Words:** [LANGUAGE.md](LANGUAGE.md) · **Look:** [DESIGN.md](DESIGN.md)

## What it does

**Guests** open `chirk.fyi/<event>`, tap **RSVP**: Going / Can't make it, their names (one reply for a couple or family), kids if asked, which parts of the day, what they're bringing, a note. No account. Named guests get a personal link that opens a reply already addressed to them, and every reply gets a private link to change it later (emailed if they leave an email).

**Hosts** sign in at `chirk.fyi/host` with their email and a 6-digit code. Anyone on a chirk guest list can sign in and make their own. Per event:
- the invite: photo, message, schedule, reply-by, what to bring, guest options, drafts until published
- guests: add names (and emails), send invites and reminders by text or email, Message your guests, Select for bulk actions
- co-hosts (one owner, any number of co-hosts); hosts are on their own guest list as going, marked Host
- shared costs (who paid, who owes whom, Pay with Venmo, Mark paid) and poker (buy-ins, cash-outs, payouts)
- gift exchange (who's in, never-draw pairs, rules, draw names, email matches)
- scheduled emails each morning at 9 am New York: the gift draw, gift reminders, reply reminders
- Copy to next year, Save as a template, Archive, Delete

## Links

**The site** (chirk.fyi; `chirkfyi.vercel.app` also works)
- Home: https://chirk.fyi · Sign in and your events: https://chirk.fyi/host
- Thanksgiving invite (send this): https://chirk.fyi/thanksgiving-2026 · its host page: https://chirk.fyi/thanksgiving-2026/host
- Any event: `/<event>`, `/<event>/rsvp`, `/<event>/host`, `/<event>/calendar.ics`
- Public pages: `/privacy`, `/terms` (everything else is `noindex`)

**Behind the scenes**
- Code: https://github.com/hudsontaylorford/chirk.fyi
- Hosting, database (Neon, Storage tab → Query), photos (Blob), the morning job (Cron): Vercel team "Flowers By Ford" → chirk.fyi project
- Email: Resend, sending from chirk.fyi · Domain/DNS: Cloudflare → chirk.fyi

## How it's built
- Next.js (App Router) + Tailwind on Vercel. Postgres on Neon through `DATABASE_URL`; only the server talks to the database.
- Schema in `db/schema.sql` (re-runnable; paste into the Neon SQL editor). Tables: `events`, `households` (one reply each, with a private `token`), `items` + `claims` (the bring list), `users`, `login_codes`, `event_hosts`, `costs`, `cost_shares`, `payments`, `poker_entries`, `gift_draws`, `sent_jobs`, `templates` (a host's saved templates), `inbound_emails` (forwarded emails, one draft each).
- Pure logic with unit tests in `src/lib` (`*.test.mts`): money math and poker (`costs.ts`), name draws (`gifts.ts`), what's due each morning (`due.ts`), counts and formatting (`format.ts`), emails.
- Forwarded emails: Resend `email.received` webhook → `/api/inbound` (needs `RESEND_WEBHOOK_SECRET`) → the same reader as Paste a text → a draft; `inbound_emails` keeps it to one draft per email.
- The morning job: `vercel.json` cron → `/api/cron` (needs `CRON_SECRET`) → `src/lib/jobs.ts`. Each job is claimed once in `sent_jobs`; every email has an idempotency key.
- The look is intentionally plain until it's designed. Tokens live in `src/app/globals.css`.

## Local development
```bash
cp .env.example .env.local
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/thanksgiving-2026.sql
npm run dev
```

Checks before anything goes live:
```bash
npm test                      # unit tests
npm run build && npm start    # then, in another terminal, with LOGIN_TEST_CODE=123456 CRON_SECRET=testcron set for the server:
npm run check                 # the full phone walkthrough (Playwright)
```
