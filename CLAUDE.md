# chirk: notes for Claude

@AGENTS.md

Ponytail (above) is on for every session in this repo, at the **full** level.

## This project
- A tiny, phone-first DIY Partiful. Each event is one page at `chirk.fyi/<slug>`, with an RSVP, an optional "what are you bringing" list, and a password-protected `/host` page.
- **Simplicity beats features.** It's for one-day events with ~30 guests. If something isn't needed for the next real event, don't build it.
- **Phone first.** Test every screen at iPhone size. Big tap targets, short forms, no hover-only UI.
- **The design isn't decided yet.** Keep the look plain (tokens in `src/app/globals.css`) and don't make bold visual choices until Hudson brings direction.
- **The owner (Hudson) isn't a developer.** Explain setup and deploy steps one at a time in plain language, and keep `SETUP.md` up to date.
- Stack: Next.js App Router + Tailwind on Vercel, Postgres on Supabase via `DATABASE_URL`. Schema is `db/schema.sql` (paste into the Supabase SQL editor; keep it re-runnable).
