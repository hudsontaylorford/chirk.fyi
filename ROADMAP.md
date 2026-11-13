# chirk + Postup: roadmap

*Written Nov 13, 2026. Thinking, not commitments. Revisit after Thanksgiving.*

## The one idea

**A plan with a link.** Someone has a plan, makes one page for it, and sends the link. People open it on their phone, say if they're in, and maybe grab something to bring. No app, no feed you have to check, no notifications you didn't ask for. Simple, easy, mindless, not distracting.

- **Postup** is that idea at its lightest: "wine on the dock tonight," open to whoever.
- **chirk** is the same idea for a planned event with a known group: "Thanksgiving at ours, here's what we still need."

They are **one product at two settings**, not two products. A Thanksgiving chirk is a Postup that is invite-only, has a reply-by date, and has a bring list turned on.

## The shape (one object, optional layers)

| Layer | Wine on the dock | Thanksgiving | Weekend trip |
|---|---|---|---|
| **Basics**: title, when, where, a few words, host | ✓ | ✓ | ✓ (multi-day) |
| **Who can see it**: public / link / invite / passcode | public | invite | invite |
| **Replies**: Going / Can't, names, kids | one tap "I'm in" | ✓ + couples | ✓ |
| **Lists**: things to claim | — | the menu | rooms, rides, gear |
| **Reply-by date** | — | ✓ | ✓ |

Every layer is **off unless the host turns it on**. A plan stays one screen for guests no matter which layers are on.

### People
- **Hosts have accounts** (Postup's sign-in), so they can see their plans in one place.
- **Guests never need an account.** They get a private link to their reply (chirk's model). That's what makes it work for grandma.
- Later, a guest who *does* sign up can attach past replies to their account. Optional, never required.

### Groups ("a Postup to a specific group of people")
Phase 1: the group is the group text. You paste the link. That already works.
Later: a saved guest list ("Thanksgiving crew"). Picking it pre-fills names, so the RSVP page can say "Are you Hudson or Molly?" without typing. Members who have accounts see the plan in their feed.

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

## Where it lives (database + hosting)

- **Now:** chirk on Vercel + Neon (free). Postup on Vercel + Supabase (free, paused).
- **Merged:** one app on Vercel, one Supabase project (Postup's), because Postup's sign-in is Supabase Auth.
  - **Cost:** free while you stay at ≤2 active Supabase projects. Unpausing Postup puts you at 3, so pause or delete one, or pay ($25/mo Pro). With real weekly use, the 7-day pause stops being an issue.
  - **One rule worth adopting:** the browser never talks to the database directly; only the server does. That fixes risk #3 by design and is how chirk already works.
- Moving chirk's data is trivial (3 small tables, plain Postgres). The code moves as a few routes.

## Roadmap

**0. Now → Nov 15: ship chirk for Thanksgiving.** Vercel + Neon + chirk.fyi. Nothing else.

**1. Nov 26: use it for real.** Watch what guests do and don't do.

**2. Early December: retro + Postup cleanup.**
- chirk: fix whatever Thanksgiving taught us.
- Postup: fix bugs 1, 2, 4, 6 (each small). Decide PR #5.

**3. Decide the merge (one short write-up, then go/no-go).**
- Name and domain (is the product "Postup", "chirk", or Postup at chirk.fyi?).
- Confirm Supabase project and cost.
- Confirm the server-only database rule.

**4. Build Create + Join in Postup using chirk's model.**
- `postups` gains: `host_id`, `reply_by`, a real time zone, `bring_prompt` (or lists).
- chirk's `households` (replies) and `items` tables come over as they are.
- Join = chirk's RSVP. Share = the phone's share sheet. "Going" count = real replies.
- Hosts sign in; guests use private links. Host password goes away.

**5. Move chirk in.** Copy the data; old chirk.fyi links keep working (redirect or same domain).

**6. Later, only when a real plan needs it.**
- Saved groups.
- Several lists / spots per item (see above).
- "Copy last year's plan."
- Multi-day plans.
- A map *link* (Apple/Google Maps), not a map provider.

**Never (on purpose).** Chat or comments, an algorithmic feed, likes or follower counts, ticketing or payments, push notifications, ads.

## Open questions for Hudson
1. One brand or two? (e.g. Postup is the app, chirk.fyi is the domain.)
2. Should a public Postup feed exist at all, or is everything link/invite-based?
3. OK to pay $25/mo for Supabase if/when the merged app is in real use, or should we keep it free by pausing old projects?
