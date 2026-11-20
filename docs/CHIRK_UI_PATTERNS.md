# chirk UI patterns · v1 (frozen)

**Frozen Nov 18, 2026 (Stage 5). v1.1 Nov 20: on every page, host tools included (Stage 6, `docs/UX_COHERENCE_NOV20.md`).** Proven on the guest flow (invite → RSVP → confirmation), live, reviewed (`docs/DESIGN_REVIEWS_V2.md`) and checked (`docs/A11Y_CHECKS.md`). This is the reference for the host tools in Stage 6.

**Changing a frozen pattern** needs: a reason (a usability problem, not taste alone), Hudson's OK, this doc updated, and the visual baselines re-captured (`node scripts/visual.mjs --update`). A unit test (`src/lib/patterns.test.mts`) fails if a guest screen uses an old class or an off-token color.

Background: the brief and constitution (`docs/UI_UX_V2_BRIEF.md`), the audit (`docs/UI_AUDIT_V2.md`).

---

## 0. The idea in one line

A very well-typeset web document that happens to be interactive: ink on white, warm gray for secondary things, hairlines for structure, underlined links, one black button when there's a real next step, and nothing that looks like a control unless it is one.

## 1. Rules (constitution additions, approved Nov 18)

1. **A pill never does nothing.** Anything shaped like a control is one.
2. **One primary action per screen**, only when there's a real next step. On host pages: **Share invite** when live, **Publish** when draft. A form's own submit (Save, Create event) is its primary.
3. **Green means Going**, only. Live is the normal state and gets no badge.
4. **Photos are never cropped**, on any screen.
5. **No color but the tokens.** The accent (slate blue) means "you can tap this" or "this is picked".

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--color-ink` | #1c1917 | text, the primary button |
| `--color-soft` | #78716c | secondary text: hints, signatures, dates in lists |
| `--color-line` | #e7e5e4 | hairlines; outlines of fields, choices, quiet buttons |
| `--color-accent` | #3d5a99 (slate blue, Nov 20) | links, focus rings, picked choices. **Never a fill or surface.** |
| page | white | background |
| status | green-700 (Going), amber, red-800 on red-50 (alerts) | only where they mean something |

Font: the phone's system font (provisional, §12).

## 3. Scope

Every page (since Nov 20): 8px fields with an accent focus outline, the focus ring, wrapping of long words, balanced headings, press/hover feedback. The old utilities (`btn`, `btn-quiet`, `pill`, `pill-check`, `--color-wash`) are gone.

## 4. Actions

| Pattern | Class | Looks | Use for | Don't |
|---|---|---|---|---|
| Primary | `button` | ink fill, white 17px semibold, **8px corners**, 52px tall, full width on phones | the one real next step: RSVP, Send RSVP / Save | two per screen; on a finished state (the confirmation has none) |
| Quiet | `button-quiet` | white, 1.5px hairline outline, 8px, ≥44px, 16px semibold | an action **next to a field** (Send, Add) | as a page's main action; filled gray |
| Link | `link` (+ `tap` when standalone) | accent text, 1px underline 3px below | every other action and all navigation: Add to calendar, Change my reply, + Bring something else, Already replied? | colored text; buttons styled as links for navigation |
| Strong link | `link` + semibold | same, bolder | a link that *is* the next step (Add to calendar after replying) | more than one per screen |
| Destructive | `Confirm` | soft gray underlined text, then a red **Sure?** | Remove, Delete this event | red before it's tapped; a big button |

`tap` makes a standalone link or text button 44px tall without looking bigger. Links inside a sentence don't need it.

## 5. Choices (anything you pick)

`choice`: white, hairline outline, 8px, ≥44px, 16px. **Picked** (`aria-pressed="true"`): accent outline (1.5px + 1px inset), accent semibold text, a ✓ before the label. No fill.

- **Going / Can't make it:** two equal `choice` buttons side by side, 52px, 17px semibold.
- **Bring items:** `choice` everywhere. On the invite each Still needed item is a `choice` **link** to the RSVP with it picked (`?pick=<item id>`); in the form they're `choice` buttons. Things you added yourself show picked with a ✕ to remove.
- **Parts of the day, who's this:** `choice`.
- **A choice holding a real checkbox or radio** (the form posts it: split between, buy-in / cash-out, who's in): `choice-check`, same look, checked = picked.
- Don't: a choice-shaped thing that isn't tappable (rule 1); filled selected states; color.

## 6. Fields

`field` inside the scope: full width, 8px, 1.5px hairline, 17px text (no iPhone zoom), **accent border on focus**. A field + its quiet button sit in a row that **wraps** (`flex flex-wrap`, field `min-w-0 flex-[1_1_10rem]`) so the button drops below on narrow screens. Email fields: `type=email`, `inputMode=email`, `autoComplete=email`, no spellcheck, no auto-capitals.

## 7. Focus and feedback

- **Keyboard focus:** 2px accent outline, 2px offset, on links, buttons, summaries and choices. Fields show focus with their border.
- **Press:** links, choices and quiet buttons dim to 70%; the primary to 85%.
- **Hover (mouse only):** links thicken their underline to 2px; outlines darken to soft gray; the primary dims to 90%.
- **Every action shows it worked:** "Sending…/Saving…" on the button while busy, then the page changes ("You're in!") or a status line ("Sent to 2 ✓"). Send buttons stay tappable; a missing answer is named ("Pick Going or Can't make it.") and focused.
- No motion. If any is ever added, it respects reduced motion.

## 8. Type and rhythm

| Role | Size / weight | Example |
|---|---|---|
| Invite title (h1) | 34px bold, tight tracking, 1.1 line height | Thanksgiving 2026 |
| Page title (h1) | 28px bold | Your RSVP · You're going |
| Section heading (h2) | 20px bold | Still needed · Coming |
| Question / small heading (h2) | 17px semibold | Are you coming? · This page is your reply |
| Date line | 19px medium (invite), 17px (elsewhere) | Thursday, November 26 · 3 pm |
| Body | 17px, relaxed line height for messages | the host's message |
| Secondary | 15px soft | hints, signatures, Please reply by |
| Small print | 14px soft | form footnotes |

- **Spacing:** 20px side gutter (`px-5`), max column 512px (`max-w-lg`). Between sections 32–40px (`mt-8`/`mt-10`); between questions in a form 32px (`space-y-8`); within a block 4–12px.
- **Hairlines** (`--color-line`) separate list rows (`divide-y`, top and bottom border) and set off a block that's a unit (the confirmation's plan). No boxes for grouping.
- Headings balance their lines; paragraphs avoid a lone last word; long words wrap (at Safari's 300% zoom too). chirk's own words use ’ and “ ”; what people type stays as typed. Sentence case everywhere.
- Lists are rows: name in semibold, details in body, notes as soft italic quotes ("Arriving around 5"). No cards, no bubbles.

## 9. Boxes

Only when containment means something: **alerts** (red/amber, 8px, `role=alert`) and **a secret** (the gift match card, Stage 6). Everything else is space + hairlines.

## 10. Screen patterns

**An invite / a plan:** photo (full width, never cropped) → title → date · time → place · address (address links to Maps) → schedule (stacks under 240px) → Add to calendar → **RSVP** → reply-by → the host's message, signed → Still needed → Coming. Optional parts vanish when empty (no heading, no "nothing yet"); Coming appears once someone's going. The lightest plan (title, when, where) is one screen.

**A form:** the thing it's about stays visible on top (event name + date), then the page title ("Your RSVP"), then questions as h2s, one decision each, then the primary. Help text only where it explains a consequence ("Optional. Shows on the invite."). Rarely-needed paths go under the primary as a quiet link ("Already replied? Email me my link").

**A confirmation:** what happened as the title ("You're in!"), names under it → the plan back between hairlines (name, when, where, **Add to calendar**) → what's next as links (Pick something to bring, Change my reply) → housekeeping last (This page is your reply). No new primary.

## 11. Stage 6: from the old look to v1 (host pages) · done Nov 20

| Old | New |
|---|---|
| `btn` (black pill) | `button` if it's the screen's one next step; otherwise `link` (or `button-quiet` beside a field) |
| `btn btn-quiet` (gray pill) | `link` (+ `tap`), or `button-quiet` beside a field |
| `pill` with `aria-pressed` | `choice` |
| `pill-check` (checkbox/radio in a pill) | `choice` (button with `aria-pressed`) or a plain checkbox row; keep a real `<input>` where the form posts it |
| `rounded-2xl bg-wash` boxes (Send the invite, Message your guests, stat tiles, cost cards…) | a section with a heading, spacing and hairlines; stats as one line ("7 coming · 4 of 5 replied · 5 still needed") |
| Live / Draft / Host badges | words: "Draft" in the title line; Live says nothing; "Host" as plain soft text |
| `rounded-full` round buttons (kids −/+) | `button-quiet` squares (done in the RSVP form) |

Done Nov 20 (it was about 100 uses across ~20 host files: `btn` 43, `btn-quiet` 11, `pill` 14, `pill-check` 4, `rounded-2xl` 20, `bg-wash` 14). The guard test now covers every screen. Stats stayed as a row of numbers between hairlines rather than one sentence. Host-screen baselines are still to add.

## 12. Provisional (Hudson's open calls, Nov 18)

These are deliberately **not** frozen:
1. **Typeface:** system font for now; the biggest remaining lever, decided with the brand color.
2. **Middle dots** as separators (date line, place · address, "Coming · 5", "2 emails · 3 need a text").
3. **"Please reply by"** centered under the button (the only centered text).
4. **Reserving the photo's space** (store dimensions at upload).
5. **Type scale** on a ratio.

## 13. Checks

- `npm test`: includes the pattern guard (`src/lib/patterns.test.mts`), over every screen.
- `npm run check`: walks the whole app, including the guest flow.
- `node scripts/a11y.mjs`: tap targets, names, contrast, headings, keyboard focus, 320px and 130px reflow, reduced motion.
- `node scripts/visual.mjs`: the 7 guest screens against `visual/baseline`.
