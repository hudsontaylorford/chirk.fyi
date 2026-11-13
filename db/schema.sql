-- chirk: database schema. Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- Three tables: an event, the households who reply, and the things people bring.

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,          -- the web address: chirk.fyi/<slug>
  title text not null,
  date date not null,
  time time,                          -- main start time (e.g. dinner)
  place text,                         -- "The Fords'"
  address text,
  details text,                       -- free text, blank line = new paragraph
  rsvp_by date,
  cover_url text,                     -- optional image
  bring_prompt text,                  -- null = no "what are you bringing" section
  created_at timestamptz not null default now()
);

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(12), 'hex'),  -- private edit link
  names text[] not null,              -- everyone this reply covers, e.g. {Hudson, Molly}
  going boolean not null,
  kids int not null default 0,
  note text,                          -- allergies, oven needs, arriving late...
  updated_by text,                    -- which name last touched it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 'needed' = on the host's list, claimable by one household.
-- 'main'   = a household's own main dish when it's not on the list.
-- 'extra'  = the optional "anything else?".
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kind text not null check (kind in ('needed', 'main', 'extra')),
  name text not null,
  household_id uuid references households(id) on delete set null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists items_event on items(event_id);
create index if not exists households_event on households(event_id);

-- Only the site's server reads the database; this shuts Supabase's public API out.
alter table events enable row level security;
alter table households enable row level security;
alter table items enable row level security;
