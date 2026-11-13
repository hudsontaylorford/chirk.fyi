# Event Kit

A small, phone-first invite + RSVP + potluck planner. Guests claim the dishes that are actually needed. Hosts see headcount and an oven timeline with conflicts flagged.

- **Guests**: `/<event-slug>` (big invitation), `/<event-slug>/details` (details + live menu), `/<event-slug>/rsvp`, and a personal edit link `/<event-slug>/me/<token>`
- **Hosts**: `/<event-slug>/host` (password: the `ADMIN_PASSWORD` env var)

To get it live, see **[SETUP.md](SETUP.md)**.

## Stack
Next.js (App Router) + Tailwind on Vercel, and Postgres on Supabase. The app talks to Postgres directly through `DATABASE_URL`. Supabase's public API is locked off with row-level security.

## Local development
```bash
cp .env.example .env.local
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed-thanksgiving-2026.sql
node scripts/seed-demo.mjs      # optional: /demo filled with the 2025 contributions
npm run dev
```

## Layout
- `db/`: schema and event seed (paste into the Supabase SQL editor)
- `src/lib/`: data access, menu summary, oven timeline + conflict detection, host auth
- `src/components/`: invite, menu board, RSVP form, oven timeline
- `src/app/actions.ts`: guest save. `src/app/[slug]/host/actions.ts`: host actions
