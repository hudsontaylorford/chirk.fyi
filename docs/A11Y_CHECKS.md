# Guest flow: accessibility and iPhone checks

*Nov 18, 2026. Stage 3 follow-up for the v2 guest flow (invite → RSVP → confirmation).*

## Automated (`node scripts/a11y.mjs`)

Runs on fixed fixture events (`scripts/fixtures.mjs`, the same ones as the visual baselines) in Chrome at iPhone size, with reduced motion on. For each screen (detailed invite, light invite, RSVP, confirmation, confirmation while changing the reply) it checks:

- **Tap targets** ≥ 44px tall (links inside a sentence are listed, not failed: WCAG 2.5.8's inline exception).
- **Every control has a name** (label, aria-label or text).
- **Text contrast** ≥ 4.5:1 (3:1 for large text), against the real background.
- **One h1**, and the heading outline.
- **Keyboard**: Tab through the page; every stop shows a visible focus ring (outline, or a field's border change).
- **320px wide and 130px wide** (an iPhone at Safari's largest, 300%, zoom): no sideways scroll.
- **Reduced motion**: nothing animates.
- `<html lang>` and a page title.

### First run, and what was fixed

| Found | Fix |
|---|---|
| The event name link at the top of the RSVP page was 26px tall | 44px tap area (`tap`), same look |
| "Pick something to bring" on the confirmation was 20px tall | 44px tap area |
| The confirmation's event name looked like a heading but wasn't one | now an `h2` (screen readers can jump to it) |
| "No visible focus" on text fields | a false alarm in the script: fields show focus by changing their border; the check now compares focused vs. resting |

Now: **no issues on any of the five screens.** Contrast, names, headings, keyboard order, 320px reflow and reduced motion all passed on the first run.

## Real iPhone results (Hudson, Nov 18)

| Check | Result |
|---|---|
| Safari AutoFill on "Your name" | ✓ fine: a name suggestion, nothing in the way |
| No zoom when typing | ✓ |
| Still needed → RSVP with the item picked | ✓ |
| Add to calendar | ✓ "perfect" |
| Largest Safari zoom (300%) | ✗ **found a bug**: "Thanksgiving" and the schedule ran off the right edge and the page scrolled sideways. **Fixed**: long words wrap (`.guest { overflow-wrap: break-word }`, hyphenated titles), the schedule's text column can shrink and stacks (time above, text below) when the page is under 240px wide, and the email + Send rows wrap. The a11y script now checks 130px wide too, so this can't come back unnoticed. |
| VoiceOver | skipped for now |

## On a real iPhone (Hudson, ~10 minutes)

Things only Safari on a phone can show. Use a private tab so it's a fresh guest.

**Safari**
1. Open the Thanksgiving invite. The photo shows whole; the title, date, place and RSVP are clear without zooming.
2. Tap **RSVP**. Tap the **Your name** box: does Safari offer to fill in your name (fine) or pop up a big "AutoFill Contact" bar that gets in the way (tell me)?
3. Type in every box: the page should **not zoom in** when a box is tapped.
4. Tap an item under **Still needed** on the invite: the RSVP opens with Going and that item picked.
5. Send the RSVP: the confirmation shows the event, date, place and **Add to calendar**; tap it and check the calendar event looks right.
6. Settings → Accessibility → Display & Text Size → **Larger Text**: drag to a large size, reload the invite. Nothing should overlap or get cut off.

**VoiceOver** (Settings → Accessibility → VoiceOver, or triple-click the side button if set up)
7. On the invite, swipe right through the page: it reads the title, date, place, RSVP, the message, then Still needed and Coming, in that order.
8. Use the rotor (twist two fingers) → **Headings**: you can jump between the event title, Still needed and Coming.
9. On the RSVP page: Going and Can't make it say whether they're **selected**; picked bring items do too.
10. On the confirmation: the event name is reachable as a heading; **Add to calendar** reads as a link.

Note anything odd (what you did, what you heard or saw) and send it over; a screen recording works too.

## Not covered yet

- Real VoiceOver and Safari behavior (the list above).
- Host pages (they move to the v2 patterns in Stage 6; check them then).
- The Anthropic Frontend Design and Vercel Web Design Guidelines reviews (next).
