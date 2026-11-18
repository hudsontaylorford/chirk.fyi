# Guest flow: design reviews (Stage 4)

*Nov 18, 2026. The v2 guest flow (invite → RSVP → confirmation) reviewed against two outside references, read from their sources:*
- *Anthropic's **frontend-design** skill (`anthropics/skills`, `skills/frontend-design/SKILL.md`)*
- *Vercel's **Web Interface Guidelines** (`vercel-labs/web-interface-guidelines`, `command.md`)*

*Rule from the brief: the chirk constitution outranks both. Each finding is **fixed**, **your call**, or **declined** (with the reason).*

## Fixed in this pass

| # | Source | Finding | Fix |
|---|---|---|---|
| 1 | Vercel · Typography | Straight apostrophes in chirk's own words ("You're going", "Can't make it") | Typographic ’ in every guest-visible string chirk writes. (Text hosts and guests type stays as typed.) |
| 2 | Vercel · Typography | Headings could leave a lone word on a line | `text-wrap: balance` on guest headings, `pretty` on paragraphs |
| 3 | Vercel · Images; constitution 5.8 | The cover had `alt=""`, hiding it from screen readers, but posters carry words and the photo is content | "Invitation photo for <title>"; `fetchpriority="high"` (it's the first thing on the page) |
| 4 | Vercel · Forms | Send RSVP was disabled until you picked Going/Can't, with no reason given | Always tappable; without an answer it says "Pick Going or Can't make it." and moves focus to Going (a missing name focuses the name box) |
| 5 | Vercel · Forms | Email boxes allowed spellcheck and auto-capitals | `spellCheck={false}`, `autoCapitalize="off"` |
| 6 | Vercel · Touch & hover | No press or hover feedback on links and choices (tap highlight is off) | Press dims (opacity); on a mouse, links thicken their underline and outlines darken. No color added. `touch-action: manipulation` |
| 7 | Anthropic · tells; Vercel · a11y | "Your RSVP ›": an appended arrow is a templated tell, and VoiceOver reads it out | Arrow removed |

Checks after: the walkthrough (now also: Send RSVP with nothing picked), unit tests, `scripts/a11y.mjs` (no issues), baselines re-captured.

## Your call

1. **The typeface (Anthropic: "Typography carries the personality of the page… choose typefaces deliberately, not the default families").** chirk uses the phone's system font on purpose (constitution 5.9: "system font unless a future type decision is made intentionally"). This is the single biggest lever left for "a well-typeset web document": e.g. a serif for the event title only, or one family throughout. Worth deciding alongside the brand color, not before.
2. **Middle dots (Anthropic lists "meta strings joined with middle dots" as a generated-page tell).** The guest flow uses them in: the date line ("Thursday, November 26 · 3 pm"), place · address, "Coming · 5", what someone's bringing ("Turkey · Stuffing"), "You're going · Your RSVP", the delivery line ("2 emails · 3 need a text"). They're also chirk's own long-standing separator. Options: keep; or write the date as "Thursday, November 26 at 3 pm", put the address on its own line, and use "5 coming". The date format is shared with emails and host pages, so it's a product-wide change.
3. **Centered "Please reply by …"** is the only centered text on a left-aligned page (Anthropic: alignment as a decision). Left-align it under the button, or keep it centered as part of the button.
4. **Cover size on desktop: no width/height on the image** (Vercel: prevents the page jumping as the photo loads). chirk doesn't store photo dimensions; storing them at upload would let the space be reserved. A small change, but it touches upload + the database.
5. **Type scale** (Anthropic: a clear scale per *The Elements of Typographic Style*). Today 34 / 28 / 20 / 17 / 15: it works, but isn't on a ratio. Revisit with the typeface.

## Declined (constitution wins, or doesn't apply)

| Guideline | Why not |
|---|---|
| Vercel: Title Case for headings and buttons | chirk is sentence case (LANGUAGE.md); Anthropic's skill agrees ("plain verbs, sentence case") |
| Vercel: skip link | One column, and the first Tab stop is already the address/RSVP; nothing to skip |
| Vercel: warn before leaving with unsaved changes | A one-minute form; a prompt would cost more than it saves. (Host forms already keep drafts.) |
| Vercel: placeholders end with "…" as an example | Only where the placeholder *is* an example ("Allergies, arriving late…" ✓); "Your name" duplicates its label and stays plain |
| Vercel: avoid `autoFocus` on mobile | Used once, on purpose: "+ Bring something else" lands in that box with the keyboard up |
| Anthropic: the five "AI clusters" (cream + serif, hairline broadsheet, SaaS cards, etc.) | chirk avoids the cards/gradients/shadows cluster. Hairlines are used but with 8px corners and no newspaper columns; the brief asks for them ("hairline rules… Craigslist is beautiful") and the brief's words win |
| Vercel: dark mode, i18n, virtualization, video | Not in scope for chirk today (light only, English, ~30 guests, no video) |

## What both reviews confirmed

- One obvious primary action per screen (RSVP / Send RSVP; none on the confirmation).
- No motion, so reduced motion is respected by default.
- Visible keyboard focus; 44px targets; labels on every control; inputs at 17px (no iPhone zoom).
- Copy: active voice, the same name through the flow (RSVP → Send RSVP → "You're in!"), errors say what to do.
- Visual structure is information: hairlines separate sections, the only boxes are alerts.
