# chirk: design notes (as of Nov 14, 2026)

chirk is a tiny, phone-first invite and RSVP site, a DIY Partiful. A host makes an event, texts one link, and guests reply in under a minute with no app and no account. The current look is deliberately plain: a placeholder chosen so it can't get in the way until a real design direction is decided. Live example: https://chirk.fyi/thanksgiving-2026

## Who it's for
- **Guests:** open a link from a group text on their phone, read the invite, tap RSVP, say what they're bringing. Never sign up.
- **Hosts** (today Hudson and Molly): create events, see replies, send the invite by text or email from a password-protected host page.
- **Scale:** one-day events, about 30 guests (Thanksgiving, a tailgate, a toast night, a birthday).
- **Direction:** accounts, a feed of plans from friends' "circles", later community events. See ROADMAP.md.

## Design philosophy
1. **Simplicity beats features.** If the next real event doesn't need it, it doesn't get built. Advanced settings hide under "More options".
2. **Phone first.** Designed at 390px wide. Big tap targets (52px buttons), short forms, nothing hover-only.
3. **Guests are done in under a minute.** One screen to reply. Couples reply once. A private link brings them back; no passwords.
4. **Every action shows it worked.** "Saving…" then "Saved ✓", or the page visibly changes.
5. **Information over decoration.** Lists, plain type, clear labels; closer to a good transit schedule than a social app. No image feeds, badges or likes.
6. **Plain words.** "Going" / "Can't make it", "Still needed", "Who's bringing what". No emoji in the interface; no jokes in errors or confirmations.
7. **The look isn't decided yet.** It lives in a handful of tokens so a new direction is a contained change.

## Color (current)
Warm stone neutrals (Tailwind stone scale); one ink color doubles as the accent. Light mode only; dark mode for the app is not designed yet.

| Token | Hex | Used for |
|---|---|---|
| ink / accent | #1c1917 | text, primary buttons, selected chips |
| soft | #78716c | hints, secondary text, names |
| line | #e7e5e4 | borders, dividers, chip outlines |
| wash | #f5f5f4 | cards, quiet buttons, stat tiles |
| page | #ffffff | background, fields, chips |

Status colors, used sparingly: "Going" green-700 #15803d; errors red-50 fill with red-800 text; delete confirmations red-700; draft banner amber-50. Saved/copied states use "✓" in the label, not color.

Tokens live in `src/app/globals.css` (Tailwind v4 `@theme`: `--color-ink`, `--color-soft`, `--color-line`, `--color-wash`, `--color-accent`).

## Type (current)
The phone's system font (San Francisco on iPhone): nothing to load, feels native. Weights 400, 600, 700. Any Google Font can replace it.

| Size | Weight | Used for |
|---|---|---|
| 34px | 700, tight tracking | event title on the invite |
| 28px | 700 | page titles (RSVP, You're in!, host pages); stat numbers |
| 20px | 700 | section headings (Still needed, Who's bringing what, Coming) |
| 19px | 500 | date and time line on the invite |
| 17px | 400 / 600 | body, form labels (600), buttons (600), inputs (17px stops iPhone zoom) |
| 16px | 400 | chips, smaller links |
| 15px | 400 | hints under labels, secondary lines |
| 13–14px | 400 / 600 | small notes, stat labels, badges |

## Shape, size, spacing
- One column, max 512px, centered; ~20px side gutter on phones.
- Buttons and chips are full pills (999px radius); buttons ≥52px tall. Variants: primary (ink fill, white text), quiet (wash fill), outlined (white with line border).
- Fields: 14px radius, 1.5px line border that turns ink on focus, white fill.
- Cards: 16px radius, wash fill. No shadows except the pinned RSVP button.
- Lists use hairline dividers between rows, not boxes.
- Forms: questions ~32px apart; each is a bold 17px label, optional soft 15px hint, then the control.

## Components
- **Chips (pills):** toggles; selected inverts to ink fill. "Still needed" items are dashed outline chips (open slots).
- **Schedule (all-day events):** an optional quiet timeline under the place: time left, stage right, soft gray, with the stage at the start time bold. Optional "When are you coming?" chips on the RSVP; the host sees how many are there by each stage.
- **Bring list on the invite:** "Still needed" chips on top, then "Who's bringing what" as one list (item left, names right in soft), in the order things were claimed.
- **Stat tiles (host):** three wash tiles: coming, replies, still needed, with an optional tiny sub-line.
- **Formatting in event details:** `# Title`, `- bullet`, `**bold**`, auto-links; tools: Auto-format, Clear formatting, Preview.
- **Two-step delete:** tap "Delete", then "Sure?" (no pop-ups).

## Screens
**Guest side**
- Invite (`/event`): full-width cover photo (never cropped), title, date and time range, place (tap for Maps), Add to calendar, RSVP button, formatted details, Still needed, Who's bringing what, Coming.
- RSVP (`/event/rsvp`): Going / Can't make it, names (+ Add someone), kids if the host asks, what you're bringing (multi-pick chips + add your own), a note, optional email.
- Your reply (`/event/r/<token>`): "You're in!", what you're bringing, save-your-link card, Change my reply.
- Home (`chirk.fyi`): "chirk / By invitation only", plus "Your plans" for events this phone replied to.

**Host side**
- Your events (`/host`): list with dates and headcounts; archived tucked away; + New event.
- Event host page: stat tiles, Send the invite (Share by text, Copy invite for email), replies, needed list, Edit event, Copy to next year, Archive.
- Event form: basics on top (title, date, start/end, place, address, details, photo, bring question); everything else under "More options".

**Outside the site**
- iMessage link preview: the cover photo, or a generated 1200×630 white card ("You're invited", big title, date and time, place, small "chirk").
- Emails (invite pasted into Gmail/Mail, "Your RSVP" link emails, host reply notices): inline styles; text color left to the mail app so dark mode works; black pill button with a white outline.

## Decisions so far, and why
- No "Maybe": it produces piles of non-answers.
- One reply per household: couples and families answer together; anyone on the reply can change it.
- RSVP button sits under the date and only pins to the screen bottom after scrolling past it, so it never covers the invite on load.
- Cover photo full width, never cropped; photos shrink on the phone to ~1600px JPEG before upload.
- Explicit formatting marks with an Auto-format button, because guessed formatting confused people.
- "Still needed" first, then one combined list, because guests mostly ask "is someone already bringing this?"
- Kids question off by default; rarely needed settings live under More options.
- Plain white everywhere for now, so design can be decided once, deliberately.

## Open for design
- **Brand:** name is lowercase "chirk"; no wordmark, logo or favicon yet (favicon is the framework default).
- **Color and type:** a real palette and typeface pairing; dark mode for the app.
- **Three directions from the original Post Up brief, all still open:** Bulletin board (paper notes, pegboard, vintage Apple warmth); Cash App / BRAT (big confident type, one bold color, huge actions); "Craigslist is beautiful" (HTML-1.0 plainness, blue links, dense lists stacked for phones).
- **Wrappers (an idea):** optional per-event dressing for the invite only (background color, font pairing, texture) from a short curated set; the RSVP form and host tools stay plain.
- **Coming soon, needing design:** notes shown as gray message bubbles on the invite; named invitations ("invited vs replied"); later a feed of friends' plans.
- **Constraints to keep:** works at 390px wide; tap targets ≥44px; inputs ≥16px (iPhone zoom); emails use inline styles and JPEG images; link previews 1200×630.
