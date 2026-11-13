# chirk + Postup: roadmap

*Written Nov 13, 2026. Thinking, not commitments. Revisit after Thanksgiving.*

## The one idea

**A plan with a link, shown to the right people.** Everything is called **chirk** (Postup's ideas fold in; chirk.fyi is the domain).

The big picture: *close friends × find my friends × Craigslist × Partiful.* A small, peer-to-peer network for spontaneous or shared plans. You post a plan to **your circles**, like a Snapchat story goes to your friends, and people say if they're in.

- **Circles** belong to the poster and are only a filter for them: "work friends", "soccer", "family", anything. Nobody knows which circles they're in. A plan can go to one or more circles.
- **Private chirks** go to no circle. Only people with the link see them. **Thanksgiving is a private chirk**, and that's all that's built today.
- **Community chirks** (later): open to anyone nearby (concerts, shows), capped at a few per month per person to keep quality high. Maybe a paid feature someday.
- **Order:** peer to peer first, public later.

The feel stays the same at every size: lightweight, web-based, simple, mindless, not distracting.

## The shape (one object, optional layers)

| Layer | Wine on the dock | Thanksgiving | Weekend trip |
|---|---|---|---|
| **Basics**: title, when, where, a few words, host | ✓ | ✓ | ✓ (multi-day) |
| **Who can see it**: my circles / link only / community | a circle or two | link only (private) | link only or a circle |
| **Replies**: Going / Can't, names, kids | one tap "I'm in" | ✓ + couples | ✓ |
| **Lists**: things to claim | — | the menu | rooms, rides, gear |
| **Reply-by date** | — | ✓ | ✓ |

Every layer is **off unless the host turns it on**. A plan stays one screen for guests no matter which layers are on.

### People
- **Hosts have accounts** (Postup's sign-in), so they can see their plans in one place.
- **Guests never need an account.** They get a private link to their reply (chirk's model). That's what makes it work for grandma.
- Later, a guest who *does* sign up can attach past replies to their account. Optional, never required.

### Circles
Today: the group text is the circle. You paste a private link, and that already works.
Later, in this order:
1. **Friends**: two people with accounts connect, either by mutual add or by one person accepting the other.
2. **Circles**: the poster's private, named lists of friends.
3. **Feed**: you see plans from people who put you in a circle they posted to, soonest first, never ranked.
4. **Community**: nearby or open plans, with a monthly cap.

Private-link chirks keep working the whole time, for people without accounts.

## The "dishes table" question: fixed fields or open-ended?

**Answer: generic shape, fixed (few) fields. No custom-field builder.**

chirk's `items` table is already event-agnostic: *a thing, and who's got it*. That covers:
- Thanksgiving: Turkey → Hudson
- Camping: Tent, Cooler, Ice → Molly
- Trip: Room 2 → Victoria & Caleb; Car (driver) → Graham
- Birthday: Cake, Balloons, Pick up the cake at 3 → Nick

What generalizes, in the order we'd actually need it:
1. **Several lists per plan** ("Menu", "Rides"): add a `list` name to items. Add it when the first plan needs two lists, not before.
2. **Spots per item** ("Drinks: 3 people", "Car: 4 seats", "Room: 2 beds"): add a `spots` number. This one generalization unlocks rides, rooms and volunteer slots.
3. **A note per claim** ("needs the oven at 350°, 1 hr"): free text, not structured. Structured oven data was the over-built part of v0.

What we should **not** build: a form builder, custom question types, per-event schemas, or JSON blobs of "settings". They feel flexible but turn the host's 1-minute setup into a 10-minute one, and that's exactly the complexity we're avoiding.

## Postup audit (Nov 13, `main` @ `0eab59a`, plus open PR #5)

**Checks:** lint clean · 6/6 tests pass (PR #5 adds 9 more) · builds on Next 16.2.11.

### Working
- Feed (`/`) and plan page (`/post/[slug]`) read real rows from Supabase.
- Sign up with email confirmation, sign in, sign out, protected `/create` and `/account`.
- Careful bits: safe redirects (no open-redirect hole), a tested fix for the email-link-on-preview-URLs bug, friendly "couldn't load" pages instead of fake data.
- Code is small, plain and readable; `CLAUDE.md` rules are good and match Ponytail's spirit.

### Not built yet (visual only)
- **Create** form: renders, saves nothing.
- **Join** and **Share** buttons: do nothing.
- "Going" count is a number typed into the database, not real replies.
- Map is a placeholder box.

### Bugs and risks found
1. **Times show in the wrong time zone.** The server formats times in UTC, so a 2:00 PM plan shows as **6:00 PM** on Vercel. (Verified.) Fix: format with `timeZone: "America/New_York"` (or the plan's own zone).
2. **Security update needed.** Next 16.2.11 has a *critical* advisory (`npm audit`). Fix: update Next. (chirk's Next 15.5.29 is not flagged.)
3. **"Invite only" isn't private.** The database allows public reads of every Postup through the public key that ships to browsers, so invite-only/passcode plans can be listed by anyone who looks. Must fix before any real private plan goes in.
4. **PR #5 route clash.** The old hard-coded `/profile/hudson` page will shadow a real profile with username `hudson`, and the nav's "Profile" link always goes to the fake one. Delete the static page when merging PR #5.
5. **Host isn't linked to an account.** `host_name`/`host_username` are plain text. Needs a `host_id` → user once Create is built.
6. **Feed shows past plans** (all seed data is from July). Needs "upcoming only".
7. **No link previews.** Plan pages have no title/description for iMessage. Important for a "share the link" product.
8. **Free Supabase pauses after 7 days idle.** This is why Postup went dark.

## Where it lives: all on Vercel

**Decision: one app, the chirk repo, on Vercel, with the database on Neon (created through Vercel).** No Supabase, so no $25/mo and no 7-day pauses.

- **Database:** Neon. chirk already uses it, and Postup's tables are plain Postgres, so they move over easily.
- **Sign-in:** Supabase Auth is the one thing that doesn't come along. Replace it when accounts are first needed, with either:
  - **Auth.js / Better Auth** (a library; accounts live in our own Neon database) plus an email service like Resend for sign-in links. Free at our size, a bit more setup.
  - **Clerk** from the Vercel Marketplace (hosted sign-in screens, email or phone). Least code, one more company involved.
  - Pick when we get there. Lean: sign-in *links* by email (no passwords), because they're simplest for guests.
- **One rule:** the browser never talks to the database directly; only the server does. That fixes Postup's "invite only isn't private" problem by design, and it's how chirk already works.
- **Postup's Supabase project** can be retired once anything worth keeping is copied out.

## Roadmap

**0. Now → Nov 15: ship chirk for Thanksgiving.** Vercel + Neon + chirk.fyi. Nothing else.

**1. Nov 26: use it for real.** Watch what guests do and don't do.

**2. Early December: retro + Postup cleanup.**
- chirk: fix whatever Thanksgiving taught us.
- Postup: fix bugs 1, 2, 4, 6 (each small). Decide PR #5.

**3. Fold Postup into chirk (the chirk repo becomes the one app).**
- Upgrade chirk to Next 16 (Postup is already there).
- Bring over what's worth keeping from Postup: the feed page, profiles, the "couldn't load" pattern, its tests.
- Rename "Postup" to "chirk" everywhere; archive the Postup repo.

**4. Accounts (hosts first).**
- Add sign-in (see above). Hosts sign in to create plans; the shared host password goes away.
- Guests still use private links and never need an account.
- Create = a short form that makes a plan. Join = chirk's RSVP. Share = the phone's share sheet.

**5. Friends → circles → feed.** In that order, each one shipped and used before the next.

**6. Later, only when a real plan needs it.**
- Several lists / spots per item (see above).
- "Copy last year's plan."
- Multi-day plans.
- A map *link* (Apple/Google Maps), not a map provider.

**Never (on purpose).** Chat or comments, an algorithmic feed, likes or follower counts, ticketing or payments, push notifications, ads.

## Decided (Nov 13)
- **Name:** everything is chirk (chirk.fyi). Postup's ideas fold in.
- **Visibility:** peer to peer first (circles), public/community later.
- **Hosting:** all on Vercel + Neon; no Supabase.

## Open questions
1. Sign-in: email links (no passwords) OK as the default? Or phone number?
2. Friends: mutual add (both agree) or follow-style (one-way)?
