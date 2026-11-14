# chirk: notes for Claude

@AGENTS.md

Ponytail (above) is on for every session in this repo, at the **full** level.

## This project
- A tiny, phone-first DIY Partiful. Each event is one page at `chirk.fyi/<slug>`, with an RSVP, an optional "what are you bringing" list, and a password-protected `/host` page.
- **Fit new things into what's already there.** A new setting goes inside the row or box it affects (e.g. the 3:00 PM choice lives in Schedule), in the fewest plain words, before adding any new row, page or field. Examples and defaults stay neutral, never tied to one kind of event.
- **Simplicity beats features.** It's for one-day events with ~30 guests. If something isn't needed for the next real event, don't build it.
- **Phone first.** Test every screen at iPhone size. Big tap targets, short forms, no hover-only UI.
- **Every action shows it worked**: "Saving…" then "Saved ✓" (see `SaveButton`), or the page visibly changes.
- **The design isn't decided yet.** Keep the look plain (tokens in `src/app/globals.css`) and don't make bold visual choices until Hudson brings direction.
- **The owner (Hudson) isn't a developer.** Explain setup and deploy steps one at a time in plain language, and keep `SETUP.md` up to date.
- Stack: Next.js App Router + Tailwind on Vercel, Postgres on Neon (created through Vercel) via `DATABASE_URL`. Schema is `db/schema.sql` (paste into the Neon SQL editor; keep it re-runnable).
