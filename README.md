# chirk

A tiny, phone-first invite + RSVP site. Day one of a DIY Partiful. First event: Thanksgiving 2026.

**Guests** open `chirk.fyi/<event>` → tap **RSVP** → Going / Can't, their names (one reply for a couple), and optionally one dish from the "still needed" list plus one extra. They get a private link to change it later. That link works for everyone on the reply ("Who's this? Hudson / Molly").

**Hosts** open `chirk.fyi/host` (all events, New event) or `chirk.fyi/<event>/host` (password = `ADMIN_PASSWORD`): headcount, replies, the needed list, edit the event.

To get it live, see **[SETUP.md](SETUP.md)**.

## Links

**The site** (until chirk.fyi is connected, use `chirkfyi.vercel.app` in place of `chirk.fyi`)
- Home: https://chirk.fyi
- Host home (all events + New event): https://chirk.fyi/host
- Thanksgiving invite (send this): https://chirk.fyi/thanksgiving-2026
- Thanksgiving host page: https://chirk.fyi/thanksgiving-2026/host
- Any event: `chirk.fyi/<event>`, `/<event>/rsvp`, `/<event>/host`, `/<event>/calendar.ics`

**Behind the scenes**
- Code: https://github.com/hudsontaylorford/chirk.fyi (plan in `ROADMAP.md`, setup in `SETUP.md`)
- Hosting + database: https://vercel.com/post-up100 → chirk.fyi project (database: Storage tab → Query)
- Domain/DNS: https://dash.cloudflare.com → chirk.fyi
- Old Postup: https://github.com/hudsontaylorford/postup, https://postup-post-up100.vercel.app

## How it's built
- Next.js + Tailwind on Vercel. Postgres on Neon (free, created through Vercel), reached directly through `DATABASE_URL`.
- Three tables (`db/schema.sql`): `events`, `households` (one reply each, with a private `token`), `items` (needed list + what people bring).
- An event with no `bring_prompt` is a plain invite + RSVP (birthdays, dinners, anything).
- The look is intentionally plain until it's designed. Colors live in `src/app/globals.css`.

## Local development
```bash
cp .env.example .env.local
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/thanksgiving-2026.sql
npm run dev
```
