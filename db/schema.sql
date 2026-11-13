-- Event Kit database schema.
-- Paste this whole file into Supabase → SQL Editor → Run. Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  event_date date not null,
  dinner_time time not null,
  meal_minutes int not null default 120,
  timezone text not null default 'America/New_York',
  location_name text,
  address text,
  invite_copy text,
  closing_note text,
  house_rules text,              -- one rule per line
  rsvp_deadline date,
  dish_name_deadline date,
  theme jsonb not null default '{}'::jsonb,   -- colors, images, etc.
  max_dishes_per_guest int not null default 2,   -- "less is more"
  is_archived boolean not null default false,  -- Phase 2
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columns added after the first version (safe to re-run).
alter table events add column if not exists max_dishes_per_guest int not null default 2;

-- Ovens, toaster ovens, slow cookers, outlets...
create table if not exists kitchen_resources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kind text not null,            -- 'oven' | 'toaster_oven' | 'slow_cooker' | 'outlet' | 'burner' | other
  label text not null,
  quantity int not null default 1,
  capacity int not null default 2,  -- dishes it can hold at once (ovens)
  sort_order int not null default 0
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  kind text not null default 'open' check (kind in ('core','open')),
  soft_cap int,                  -- null = no cap
  nudge text,                    -- friendly message when at/over cap
  description text,
  sort_order int not null default 0
);

create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  edit_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  status text not null default 'yes' check (status in ('yes','maybe','no','invited')),
  adults int not null default 1,
  kids int not null default 0,
  dietary_notes text,
  arrival_window text,           -- 'morning' | 'afternoon' | 'dinner'
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_id uuid not null references guests(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  slot_id uuid references slots(id) on delete set null,
  dish_name text,                -- null = "TBD"
  kitchen_needs text[] not null default '{}',  -- 'ready','oven','stovetop','outlet','fridge'
  oven_temp_f int,
  oven_minutes int,
  timing text check (timing in ('before','after')),
  oven_ready_at time,            -- host override: when it should come out of the oven
  assigned_by_host boolean not null default false,
  notes text,
  is_hit boolean,                -- Phase 2 archive
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One guest per core slot.
create unique index if not exists dishes_one_per_slot on dishes(slot_id) where slot_id is not null;
create index if not exists dishes_event on dishes(event_id);
create index if not exists guests_event on guests(event_id);

-- Only the app's server talks to the database; lock out Supabase's public API.
alter table events enable row level security;
alter table kitchen_resources enable row level security;
alter table categories enable row level security;
alter table slots enable row level security;
alter table guests enable row level security;
alter table dishes enable row level security;
