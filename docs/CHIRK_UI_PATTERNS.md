# chirk UI patterns (v2)

*Established Nov 18, 2026 in the Stage 3 guest slice (invite → RSVP → confirmation). Proven there first; the host tools adopt them in Stage 6. The audit: `docs/UI_AUDIT_V2.md`. The brief and constitution: `docs/UI_UX_V2_BRIEF.md`.*

Pages opt in with `class="guest"` on `<main>` (today: the invite, RSVP and reply pages). Host pages keep the older look (`btn`, `pill`, `pill-check`) until Stage 6, when those are replaced and deleted.

## Constitution additions (approved Nov 18)

1. **A pill never does nothing.** Anything shaped like a control is one.
2. **Host page primary:** Share invite when live, Publish when draft.
3. **Green means Going** only. Live is the normal state and gets no badge.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--color-ink` | #1c1917 | text, the primary button |
| `--color-soft` | #78716c | secondary text (dates in lists, hints, signatures) |
| `--color-line` | #e7e5e4 | hairlines, outlines of fields and choices |
| `--color-accent` | #1c1917 (ink, **for now**) | links, focus rings, picked choices. The brand color goes here later; never a surface or fill. |

**Monochrome for now (Nov 18):** chirk blue (#2457F5) was tried and taken out of the guest UI: on a formal invite it read too literally "HTML". The guest flow is ink, warm gray and white; links are ink and underlined. Components use `--color-accent`, so a brand color is one value away. (Older host buttons also use `--color-accent` for their fill; when a color returns, those move to `--color-ink` first.) Status colors stay only where they mean something (green = Going, amber/red alerts).

## Actions

- **Primary: `button`.** Ink, white text, 8px corners, 52px tall, full width on phones. **One per screen**, and only where there's a real next step (the invite: RSVP; the RSVP form: Send RSVP / Save). A finished state (the confirmation) has none.
- **Secondary beside a field: `button-quiet`.** White, hairline outline, 8px, ≥44px. For Send / Add next to an input. Never louder than the primary.
- **Secondary elsewhere: `link`.** Accent (ink), underlined. Add to calendar, Change my reply, + Bring something else, Already replied?. Standalone links add **`tap`** (inline-flex, 44px tall) so the target is big without looking big. A link that *is* the next step (Add to calendar on the confirmation) is `link` + semibold.
- **Destructive:** unchanged for now (gray link, then a red "Sure?"); revisit with the host tools.

## Choices (Going / Can't make it, bring items, parts of the day, who's this)

- **`choice`**: white, hairline outline, 8px, ≥44px. **Picked** (`aria-pressed="true"`): accent (ink) outline (2px), ink semibold text, a ✓ before the label. No fill.
- Going / Can't make it: two equal choices side by side, 52px.
- Bring items use the same `choice` everywhere: on the invite each Still needed item is a `choice` **link** that opens the RSVP with it picked (`?pick=<item id>`; returning guests land on their reply with it picked); in the form they're `choice` buttons.

## Fields

- `field`, inside `.guest`: 8px corners, hairline outline, **ink outline on focus**. 17px text (no iPhone zoom).

## Focus

- One ring for keyboard users: **2px ink, 2px offset** on links, buttons, summaries and choices (`.guest :focus-visible`). Fields show focus with an ink outline instead.

## Type and rhythm

| Role | Size / weight |
|---|---|
| Invite title | 34px bold, tight |
| Page title (Your RSVP, You're going) | 28px bold |
| Section heading (Still needed, Coming) | 20px bold |
| Question / small heading (Are you coming?, Keep your link) | 17px semibold |
| Date line | 19px medium (invite), 17px (elsewhere) |
| Body | 17px |
| Hints, signatures, reply-by | 15px soft |

- Sections are separated by **space (32–40px) and hairlines**, not boxes. The confirmation's plan block sits between two hairlines.
- Lists: rows with hairline dividers (`divide-y`), no cards.

## Boxes

Only where containment means something: **alerts** (red/amber, 8px) and, on other pages, the gift match card. The guest slice removed: the "Already replied?" box, the "Keep your link" box, note bubbles, the gray "Your RSVP" button.

## Confirmation pattern

1. What happened, as the title: "You're in!" / "You're going" / "You can't make it", with the names under it.
2. **The plan back**: event name · date and time · place (address as a link) · **Add to calendar** (going only).
3. What you're bringing, or "Pick something to bring" (a link into the form) when the host asked.
4. Change my reply (link) → the form opens in place.
5. Keep your link (a quiet section: one line, email + Send, Copy the link instead).
No new primary button: the reply is done.

## Cover photo

- Full width of the column at the photo's **natural shape, never cropped**, on every screen (no height cap; decided Nov 18). A very tall photo can fill the first screen on a phone; that's the host's choice to make.

## When optional content is absent

- No photo: a small top margin, then the title.
- No message, schedule, bring list or reply-by: the section isn't there at all (no empty heading, no "nothing yet").
- **Coming** appears only once someone's going.
- A plain invite (title, when, where) is one screen: title → when → where → Add to calendar → RSVP.

## Copy rules seen in the slice

- The page title says what you're doing ("Your RSVP"); the event name stays visible above it.
- One hint where it explains a consequence ("Optional. Shows on the invite."); none that describes the obvious ("Tap one or two…").

## Checks

- `npm run check` walks the flow (including picking from Still needed and the confirmation's calendar link).
- `node scripts/a11y.mjs` checks tap targets, names, contrast, headings, keyboard focus, 320px reflow and reduced motion on the guest screens (`docs/A11Y_CHECKS.md`).
- `node scripts/visual.mjs` compares the 7 guest screens (390px + desktop) to `visual/baseline`; `--update` after an approved change.
