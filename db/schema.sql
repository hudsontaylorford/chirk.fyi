-- chirk: database schema. Safe to re-run, on a new database or an existing one.
-- Vercel → Storage → your database → Query: turn off "Read-only", paste this whole file, Run.
-- It's wrapped in one do-block because that editor runs a single command at a time.
-- Tables: an event, the households who reply, the things on the list, and who's bringing what (claims).
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
    end_time time,                       -- at or before the start = the next day
    place text,
    address text,
    details text,
    rsvp_by date,
    cover_url text,
    bring_prompt text,                   -- null = no bring list
    status text not null default 'live' check (status in ('draft', 'live', 'archived')),
    ask_kids boolean not null default false,
    notify_host boolean not null default false,   -- email the host about replies
    note_prompt text,                    -- null = "Anything we should know?"
    note_hint text,                      -- the faded example in that box
    allow_doubles boolean not null default false, -- several people can bring the same thing
    created_at timestamptz not null default now()
  );

  create table if not exists households (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    token text not null unique default encode(gen_random_bytes(12), 'hex'),
    names text[] not null,
    going boolean not null,
    kids int not null default 0,
    note text,
    updated_by text,
    email text,                          -- optional; we email them their private link
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- 'needed' = on the host's list; 'main'/'extra' = something a guest added (household_id = who added it).
  create table if not exists items (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    kind text not null check (kind in ('needed', 'main', 'extra')),
    name text not null,
    household_id uuid references households(id) on delete set null,
    sort int not null default 0,
    created_at timestamptz not null default now()
  );

  -- Who's bringing which item (several households per item when the event allows doubling up).
  create table if not exists claims (
    item_id uuid not null references items(id) on delete cascade,
    household_id uuid not null references households(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (item_id, household_id)
  );

  create index if not exists items_event on items(event_id);
  create index if not exists households_event on households(event_id);
  alter table events enable row level security;
  alter table households enable row level security;
  alter table items enable row level security;
  alter table claims enable row level security;

  -- Upgrades for databases made before these existed (each does nothing once applied).
  alter table events add column if not exists status text not null default 'live' check (status in ('draft', 'live', 'archived'));
  alter table events add column if not exists ask_kids boolean not null default false;
  alter table events alter column ask_kids set default false;
  alter table events add column if not exists end_time time;
  alter table events add column if not exists notify_host boolean not null default false;
  alter table events add column if not exists note_prompt text;
  alter table events add column if not exists note_hint text;
  alter table events add column if not exists allow_doubles boolean not null default false;
  alter table households add column if not exists email text;
  -- Nov 14: claims used to live on items.household_id. Copy any that aren't in claims yet,
  -- then clear it on list items so a later re-run can't bring back something a guest un-picked.
  insert into claims (item_id, household_id, created_at)
    select i.id, i.household_id, i.created_at from items i
    where i.household_id is not null and not exists (select 1 from claims c where c.item_id = i.id)
    on conflict do nothing;
  update items set household_id = null where kind = 'needed' and household_id is not null;
end
$setup$;
