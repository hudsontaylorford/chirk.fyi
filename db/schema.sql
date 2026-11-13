-- chirk: database schema. Safe to re-run.
-- Vercel → Storage → your database → Query: turn off "Read-only", paste this whole file, Run.
-- It's wrapped in one do-block because that editor runs a single command at a time.
-- Three tables: an event, the households who reply, and the things people bring.
-- 'needed' items are on the host's list (claimable by one household); 'main' is a household's own dish; 'extra' is the optional "anything else?".
-- Row-level security is on so nothing but the site's server (which owns the tables) can read them.

do $setup$
begin
  create extension if not exists pgcrypto;

  create table if not exists events (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    date date not null,
    time time,
    end_time time,
    place text,
    address text,
    details text,
    rsvp_by date,
    cover_url text,
    bring_prompt text,
    status text not null default 'live' check (status in ('draft', 'live', 'archived')),
    ask_kids boolean not null default true,
    created_at timestamptz not null default now()
  );
  -- Added Nov 14 for databases created before it existed.
  alter table events add column if not exists status text not null default 'live' check (status in ('draft', 'live', 'archived'));
  alter table events add column if not exists ask_kids boolean not null default true;
  alter table households add column if not exists email text;
  alter table events add column if not exists end_time time; -- at or before the start = the next day
  alter table events add column if not exists notify_host boolean not null default false; -- email the host about replies
  alter table events add column if not exists note_prompt text; -- null = "Anything we should know?"
  alter table events add column if not exists note_hint text;   -- the faded example in that box

  create table if not exists households (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    token text not null unique default encode(gen_random_bytes(12), 'hex'),
    names text[] not null,
    going boolean not null,
    kids int not null default 0,
    note text,
    updated_by text,
    email text,                       -- optional; we email them their private link
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

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

  alter table events enable row level security;
  alter table households enable row level security;
  alter table items enable row level security;
end
$setup$;
