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
- **Hosts have accounts** (sign-in, see "Where it lives"), so they can see their plans in one place.
- **Guests never need an account.** They get a private link to their reply (chirk's model). That's what makes it work for grandma.
- Later, a guest who *does* sign up can attach past replies to their account. Optional, never required.

### Circles
Today: the group text is the circle. You paste a private link, and that already works.
Later, in this order:
1. **Friends**: two-way. One person asks, the other accepts.
2. **Circles**: your private, named lists of friends, used to pick who sees a plan *and* to filter (or quiet) your own feed.
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

## What carries over from the Post Up brief and mockups (Nov 14)

The original brief (Post Up: "tell people where you'll be, when, and whether they're welcome") is the same product as chirk. Its rules still hold:
- **One object with a URL.** Guests never install or sign up; account creation is an enhancement.
- **Create in under 30 seconds, respond in under 15.**
- **Chronological, never ranked. Information is enough.**
- **"Easier to create than an event, easier to open than an app invite, more intentional than sharing your live location."**

**For the invite page, soon (small):**
- **Show the host:** "Hudson & Molly are hosting", or Post Up's "Hudson is posted up at…".
- **End time:** "4:30 → 9 PM" or "until late".
- **State:** "Starts in 2 days" / "Happening now" / "Ended".
- **Coming as initials in colored circles** (like the mockups) rather than a plain line of names.
- **One row of quiet actions:** Directions · Calendar · Share.

**For the feed, when circles exist:** the "schedule" mockup is the right shape. One block per plan:
- initial or avatar
- **WHO**
- **WHERE** (biggest)
- area · date
- `1:00 PM → 11:00 PM` with "3H LEFT" or "UNTIL 11PM" on the right
- friends-going circles
- one small tag (Ticketed show, Outside, Working)

Group it under **Today / Tomorrow / This week**.

The Craigslist version's *look* is great, but its table columns are what make it hard to read on a 390px phone. Keep the monospace type, blue links and thin rules, and **stack** each plan into two or three lines instead of five columns. Both are the same data rendered differently (brief §18), which is why chirk keeps its look in a few tokens.

**The map comes after the feed.** The brief itself concluded the feed answers the better question ("who's around today?"). Start with "Directions" links to Apple/Google Maps; add a real map view of the same feed only once the feed is used.

**Fields to add when we build plans (not before):** end time, time zone, host account, visibility (public / link / circles / passcode), cancelled/ended, place name + address (map coordinates later), one tag, an optional ticket/external link.
- **Passcode** is cheap and fits "anyone can join without an account" for semi-private plans.
- **"Maybe"** stays off unless a plan type needs it.

**Words:** chirk is the app; "post up" can be the verb inside it. "+ Post up" is the create button, and "Hudson is posted up at Citi Field" is the casual plan's headline. Big invites like Thanksgiving keep their own title.

**Design territories** (bulletin board, Cash App/BRAT, Craigslist) all stay open. Today's plain black and white sits closest to Cash App minus the color. Because each event can carry its own look, a themed invite (paper, pegboard) could be a per-event option later without forcing it on the whole app.

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

## Migration notes (from the Postup chat, Nov 13)
- **No data to move.** Postup's Supabase only holds 4 demo plans and Hudson's own test sign-ups. Copy nothing; retire the project after the merge.
- **Vercel:** Postup is project `postup` on the `post-up100` account (plan unknown). chirk can live on the same account; delete the `postup` project once chirk replaces it.
- **Supabase extras:** none (no storage, functions or webhooks). Just `postups`, `profiles`, an `updated_at` trigger, and Auth.
- **Bring over:** the feed and profile *ideas* and the "couldn't load" pattern, not the Supabase code. `host_name` was free text, never tied to an account. In chirk, a plan's host is an account from day one.
- **Next 16:** Postup's `proxy.ts` is the Next 16 name for middleware. Upgrade chirk to 16 before borrowing it.
- **Sign-in redirects:** whatever sign-in we pick must work on Vercel's per-build preview URLs (the bug Postup hit). Check this first.
- **Small UX fix to carry over:** forms should keep what the person typed when a submit fails.
- **Before archiving Postup:** skim its 5 PR descriptions for reasoning worth keeping.
- **Design notes found:** "social, immediate, confident, contemporary; avoid hero sections, excessive cards, dashboard styling, overly rounded UI." (Not in Postup's `main` CLAUDE.md; possibly from the chat.) Worth weighing when chirk gets its real design; today's placeholder uses rounded pills.

## Decided (Nov 13)
- **Name:** everything is chirk (chirk.fyi). Postup's ideas fold in.
- **Visibility:** peer to peer first (circles), public/community later.
- **Hosting:** all on Vercel + Neon; no Supabase.
- **Sign-in:** phone or email link, either is fine. Pick when accounts are built; phone is a good default for a friends app (check per-text cost then).
- **Friends are two-way** (both agree). Only friends can be put in circles. A one-way "follow" may come much later, only for community posts (venues, organizers), never for circle posts.
- **Circles work both ways:** pick circles when posting; filter your feed by the same circles when browsing. Any circle can be set to **quiet** (its plans stay out of your feed unless you look), and nobody knows.
