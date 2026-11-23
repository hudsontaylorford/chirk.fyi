-- chirk: database schema. Safe to re-run, on a new database or an existing one.
-- Vercel → Storage → your database → Query: turn off "Read-only", paste this whole file, Run.
-- It's wrapped in one do-block because that editor runs a single command at a time.
-- Tables: an event, the households who reply, the things on the list, who's bringing what (claims),
-- and host accounts with the events they host.
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
    theme text,                          -- the invite's color, matched to the cover ("#rrggbb"): null = plain
    bring_prompt text,                   -- null = no bring list
    status text not null default 'live' check (status in ('draft', 'live', 'archived')),
    ask_kids boolean not null default false,
    notify_host boolean not null default false,   -- email the host about replies
    note_prompt text,                    -- null = "Anything we should know?"
    note_hint text,                      -- the faded example in that box
    note_required boolean not null default false, -- guests who are going must answer the note question
    allow_doubles boolean not null default false, -- several people can bring the same thing
    allow_own boolean not null default true,      -- guests can add things that aren't on the list
    notes_public boolean not null default false,  -- show notes on the invite
    hide_guests boolean not null default false,   -- guests don't see who's coming (hosts still do)
    max_guests int,                      -- extra people per reply: null = no limit, 0 = just them
    schedule text,                       -- all-day events: one stage per line, time first
    ask_arrival boolean not null default false,   -- ask guests which stage they're coming for
    hosted_by text,                      -- "Hudson & Molly", shown on the invite (accounts later)
    long_times boolean not null default false,    -- times as 3:00 PM instead of 3 pm
    costs_on boolean not null default false,      -- shared costs on this event
    poker_on boolean not null default false,      -- poker buy-ins and cash-outs
    gift_on boolean not null default false,       -- gift exchange
    gift_budget text,                    -- "$30"
    gift_rules text,                     -- the host's house rules, shown to everyone in it
    gift_never jsonb not null default '[]',       -- pairs of replies who never draw each other
    gift_draw_on date,                   -- names drawn automatically that morning
    gift_remind_ideas boolean not null default true,  -- nudge to add ideas 3 days before the draw
    gift_remind_givers boolean not null default true, -- nudge givers a week before the event
    remind_replies boolean not null default false,    -- nudge anyone who hasn't replied, 3 days before reply-by
    poll_question text,                  -- one poll on the invite: null = none
    poll_choices text,                   -- its choices, one per line (old: moved into questions Nov 22)
    questions jsonb,                     -- up to 3: [{q, choices: [...], one: pick one?}]
    created_at timestamptz not null default now()
  );

  create table if not exists households (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    token text not null unique default encode(gen_random_bytes(12), 'hex'),
    names text[] not null,
    going boolean,                       -- null = on the guest list, no answer yet
    kids int not null default 0,
    note text,
    updated_by text,
    email text,                          -- optional; we email them their private link
    arrival text,                        -- old: one arrival part (replaced by parts)
    parts text[],                        -- the parts of the day they're coming to (when the event asks)
    venmo text,                          -- their Venmo username, so people can pay them back
    gift_in boolean not null default true,        -- in the gift exchange (when the event has one)
    gift_wish text,                      -- gift ideas for whoever draws them
    poll text[],                         -- the poll choices they picked (old: moved into answers Nov 22)
    answers jsonb,                       -- {question: [what they picked]}
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

  -- Host accounts (sign in with an emailed code), and who hosts which event.
  create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    name text,
    terms_version text,                  -- which Terms they agreed to (src/lib/terms.ts)
    terms_accepted_at timestamptz,
    created_at timestamptz not null default now()
  );
  create table if not exists login_codes (
    email text primary key,
    code_hash text not null,
    expires_at timestamptz not null,
    attempts int not null default 0,
    created_at timestamptz not null default now()
  );
  create table if not exists event_hosts (
    event_id uuid not null references events(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    role text not null check (role in ('owner', 'cohost')),
    created_at timestamptz not null default now(),
    primary key (event_id, user_id)
  );

  -- Shared costs: what was spent and by whom, who it's split between (shares = people), and payments made.
  create table if not exists costs (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    what text not null,
    amount int not null check (amount > 0),              -- cents
    paid_by uuid not null references households(id) on delete cascade,
    created_at timestamptz not null default now()
  );
  create table if not exists cost_shares (
    cost_id uuid not null references costs(id) on delete cascade,
    household_id uuid not null references households(id) on delete cascade,
    shares int not null check (shares > 0),
    primary key (cost_id, household_id)
  );
  create table if not exists payments (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    from_household uuid not null references households(id) on delete cascade,
    to_household uuid not null references households(id) on delete cascade,
    amount int not null check (amount > 0),              -- cents
    created_at timestamptz not null default now()
  );

  -- Poker night: buy-ins (rebuys are more of them) and each player's cash-out.
  create table if not exists poker_entries (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    household_id uuid not null references households(id) on delete cascade,
    kind text not null check (kind in ('buyin', 'cashout')),
    amount int not null check (amount >= 0),             -- cents
    created_at timestamptz not null default now()
  );

  -- Gift exchange: who gives to whom (the latest draw).
  create table if not exists gift_draws (
    event_id uuid not null references events(id) on delete cascade,
    giver uuid not null references households(id) on delete cascade,
    receiver uuid not null references households(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (event_id, giver)
  );

  -- Scheduled sends (the morning job): each one recorded once it's done, so nothing goes out twice.
  create table if not exists sent_jobs (
    event_id uuid not null references events(id) on delete cascade,
    job text not null,                   -- gift_draw, gift_ideas, gift_givers, reply_reminder (src/lib/due.ts)
    sent_at timestamptz not null default now(),
    primary key (event_id, job)
  );

  -- A host's own templates ("Save as a template"): an event's settings, wording and bring list, never its guests or dates.
  create table if not exists templates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name text not null,
    settings jsonb not null default '{}',  -- event fields, see TEMPLATE_FIELDS in src/lib/templates.ts
    items text[] not null default '{}',    -- the bring list
    created_at timestamptz not null default now()
  );
  create index if not exists templates_user on templates (user_id);

  -- Forwarded emails ("forward an email to chirk"): each one makes at most one draft, even if Resend sends it twice.
  create table if not exists inbound_emails (
    email_id text primary key,             -- Resend's id for the received email
    user_id uuid not null references users(id) on delete cascade,
    event_id uuid references events(id) on delete set null,
    created_at timestamptz not null default now()
  );

  create index if not exists items_event on items(event_id);
  create index if not exists households_event on households(event_id);
  alter table events enable row level security;
  alter table households enable row level security;
  alter table items enable row level security;
  alter table claims enable row level security;
  alter table users enable row level security;
  alter table login_codes enable row level security;
  alter table event_hosts enable row level security;
  alter table costs enable row level security;
  alter table cost_shares enable row level security;
  alter table payments enable row level security;
  alter table poker_entries enable row level security;
  alter table gift_draws enable row level security;
  alter table sent_jobs enable row level security;

  -- Upgrades for databases made before these existed (each does nothing once applied).
  alter table events add column if not exists status text not null default 'live' check (status in ('draft', 'live', 'archived'));
  alter table events add column if not exists ask_kids boolean not null default false;
  alter table events alter column ask_kids set default false;
  alter table events add column if not exists end_time time;
  alter table events add column if not exists notify_host boolean not null default false;
  alter table events add column if not exists note_prompt text;
  alter table events add column if not exists note_hint text;
  alter table events add column if not exists allow_doubles boolean not null default false;
  alter table events add column if not exists allow_own boolean not null default true;
  alter table events add column if not exists notes_public boolean not null default false;
  alter table events add column if not exists max_guests int;
  alter table households add column if not exists email text;
  alter table events add column if not exists schedule text;
  alter table events add column if not exists ask_arrival boolean not null default false;
  alter table households add column if not exists arrival text;
  alter table households add column if not exists parts text[];
  alter table households alter column going drop not null;
  alter table events add column if not exists hosted_by text;
  alter table users add column if not exists terms_version text;
  alter table events add column if not exists costs_on boolean not null default false;
  alter table events add column if not exists poker_on boolean not null default false;
  alter table events add column if not exists gift_on boolean not null default false;
  alter table events add column if not exists gift_budget text;
  alter table events add column if not exists gift_rules text;
  alter table events add column if not exists gift_never jsonb not null default '[]';
  alter table events add column if not exists gift_draw_on date;
  alter table events add column if not exists gift_remind_ideas boolean not null default true;
  alter table events add column if not exists gift_remind_givers boolean not null default true;
  alter table events add column if not exists remind_replies boolean not null default false;
  alter table households add column if not exists gift_in boolean not null default true;
  alter table households add column if not exists gift_wish text;
  alter table households add column if not exists venmo text;
  alter table users add column if not exists terms_accepted_at timestamptz;
  alter table events add column if not exists long_times boolean not null default false;
  -- Nov 14: claims used to live on items.household_id. Copy any that aren't in claims yet,
  -- then clear it on list items so a later re-run can't bring back something a guest un-picked.
  insert into claims (item_id, household_id, created_at)
    select i.id, i.household_id, i.created_at from items i
    where i.household_id is not null and not exists (select 1 from claims c where c.item_id = i.id)
    on conflict do nothing;
  update items set household_id = null where kind = 'needed' and household_id is not null;
  -- Nov 21: polls.
  alter table events add column if not exists poll_question text;
  alter table events add column if not exists poll_choices text;
  alter table households add column if not exists poll text[];
  -- Nov 22: hide the guest list.
  alter table events add column if not exists hide_guests boolean not null default false;
  -- Nov 23: a required note question (e.g. a shipping address).
  alter table events add column if not exists note_required boolean not null default false;
  -- Nov 22: the one poll becomes up to 3 questions. Once only: the site always saves questions, so it's never null again.
  alter table events add column if not exists questions jsonb;
  alter table households add column if not exists answers jsonb;
  update households h set answers = jsonb_build_object(e.poll_question, to_jsonb(h.poll))
    from events e where e.id = h.event_id and e.questions is null and e.poll_question is not null and h.poll is not null and h.answers is null;
  update events set questions = case when poll_question is null then '[]'::jsonb
    else jsonb_build_array(jsonb_build_object('q', poll_question, 'choices', to_jsonb(string_to_array(coalesce(poll_choices, ''), E'\n')), 'one', false)) end
    where questions is null;
  -- Nov 22: invite color from the cover.
  alter table events add column if not exists theme text;
end
$setup$;
