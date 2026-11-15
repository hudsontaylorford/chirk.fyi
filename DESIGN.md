# chirk: design notes (as of Nov 15, 2026)

*What chirk is and how we talk about it: LANGUAGE.md. This file is how it looks.*

chirk is a tiny, phone-first invite and RSVP site, a DIY Partiful. A host makes an event, texts one link, and guests reply in under a minute with no app and no account. The current look is deliberately plain: a placeholder chosen so it can't get in the way until a real design direction is decided. Live example: https://chirk.fyi/thanksgiving-2026

## Who it's for
- **Guests:** open a link from a group text on their phone, read the invite, tap RSVP, say what they're bringing. Never sign up.
- **Hosts** (today Hudson and Molly, sharing one password): create events, see replies, send the invite by text or email from a password-protected host page.
- **Scale:** one-day events, about 30 guests (Thanksgiving, a tailgate, a toast night, a birthday).
- **Direction:** accounts with co-hosting, a feed of plans from friends' "circles", later community events. See ROADMAP.md.

## Design philosophy
1. **Simplicity beats features.** If the next real event doesn't need it, it doesn't get built.
2. **Fit new things into what's already there.** A new setting goes inside the row or box it affects, in the fewest plain words, before any new row, page or field. Examples and defaults stay neutral, never tied to one kind of event.
3. **Phone first.** Designed at 390px wide. Big tap targets (52px buttons and rows), short forms, nothing hover-only.
4. **Guests are done in under a minute.** One screen to reply. Couples reply once. A private link brings them back; no passwords.
5. **Every action shows it worked.** "Saving…" then "Saved ✓", or the page visibly changes.
6. **Information over decoration.** Lists, plain type, clear labels; closer to a good transit schedule than a social app. No image feeds, badges or likes.
7. **Plain words, one set of terms.** "Going" / "Can't make it", "Still needed" / "Covered", "Coming". No emoji in the interface; no jokes in errors or confirmations.
8. **The look isn't decided yet.** It lives in a handful of tokens so a new direction is a contained change.

## Brand (so far)
- **Name:** lowercase "chirk" (an old word for "to cheer up", and a small chirp).
- **The mark:** an asterisk called **the spark**. The wordmark is `chirk*`; the favicon and home-screen icon are a black `c*` on a white rounded square (white so it shows in dark tab bars).
- Considered and set aside for now: `c.`, `c))` (reads as Wi-Fi/tap-to-pay small), `c_`, a ping dot.

## Color (current)
Warm stone neutrals (Tailwind stone scale); one ink color doubles as the accent. Light mode only; dark mode for the app isn't designed yet.

| Token | Hex | Used for |
|---|---|---|
| ink / accent | #1c1917 | text, primary buttons, selected chips |
| soft | #78716c | hints, secondary text, times in the schedule, quiet actions |
| line | #e7e5e4 | borders, dividers, chip outlines, note bubbles |
| wash | #f5f5f4 | cards, quiet buttons, stat tiles, "Covered" and "+ Add your own" chips |
| page | #ffffff | background, fields, chips |

Status colors, used sparingly: "Going" and "Live" green-700/green-50; "Draft" amber; errors red-50 fill with red-800 text; red-700 only on the final "Sure?" of a delete. Saved/copied states use "✓" in the label, not color.

Tokens live in `src/app/globals.css` (Tailwind v4 `@theme`: `--color-ink`, `--color-soft`, `--color-line`, `--color-wash`, `--color-accent`).

## Type (current)
The phone's system font (San Francisco on iPhone): nothing to load, feels native. Weights 400, 600, 700. Any Google Font can replace it.

| Size | Weight | Used for |
|---|---|---|
| 34px | 700, tight tracking | event title on the invite |
| 28px | 700 | page titles (RSVP, You're in!, host pages); stat numbers |
| 20px | 700 | section headings (Still needed, Coming) |
| 19px | 500 | date and time line on the invite |
| 17px | 400 / 600 | body, schedule, form labels (600), buttons (600), inputs (17px stops iPhone zoom) |
| 16px | 400 / 600 | chips, form rows (600 label), note bubbles (italic) |
| 15px | 400 | hints under labels, secondary lines, "Please reply by" |
| 13–14px | 400 / 600 | small notes, stat labels, badges, quiet reply actions |

Times follow a per-event setting: "3 pm" (default) or "3:00 PM".

## Shape, size, spacing
- One column, max 512px, centered; ~20px side gutter on phones. Desktop shows the same column (a known open question).
- Buttons and chips are full pills (999px radius); buttons ≥52px tall. Variants: primary (ink fill, white text), quiet (wash fill), outlined (white with line border).
- Fields: 14px radius, 1.5px line border that turns ink on focus, white fill.
- Cards: 16px radius, wash fill. No shadows except the pinned RSVP button.
- Lists use hairline dividers between rows, not boxes.
- Forms: questions ~32px apart; each is a bold 17px label, optional soft 15px hint, then the control.

## Components
- **Chips (pills):** toggles; selected inverts to ink fill. On the invite, **Still needed** items are dashed-outline chips; a wash **"+ Add your own"** chip ends the row (a link into the reply) when guests may add things. On the host page, **Covered** items are wash-filled chips.
- **Schedule:** a quiet two-column timeline under the place: time (soft) left, part of the day right; the part at the event's start time is bold. Times as typed are read in any style and shown in the event's style.
- **Coming list (invite):** each reply once: names in bold (+ kids), what they're bringing on the next line, and their note as an italic message bubble (wash-gray, rounded with a small tail corner) when the host shows notes.
- **Form rows (host):** one line per optional part (label left, current setting right in soft, a › that turns when open). Tapping opens just that row; closed rows keep their values.
- **List editor:** the host's list as removable chips (who's bringing it shown in soft; removing a covered item asks first) plus an "Add things (commas for several)" box.
- **Stat tiles (host):** three wash tiles: coming, replies, still needed, with an optional tiny sub-line.
- **Formatting in the message:** `# Title`, `- bullet`, `**bold**`, auto-links; tools: Auto-format, Clear formatting, Preview.
- **Two-step delete:** a quiet gray "Delete" link, then a red "Sure?" (no pop-ups).
- **Restored draft notice:** amber "Restored what you were typing. Discard" when a half-typed event form comes back after a reload.

## Screens
**Guest side**
- **Invite (`/event`):** cover photo full width (tall photos capped at ~70% of the screen height, trimmed from the bottom), title, date and time, place (tap for Maps), "Hosted by" when there's no message, schedule, Add to calendar, the host's message signed "— Hosts", RSVP button with "Please reply by …" under it, Still needed, Coming.
- **RSVP (`/event/rsvp`):** Going / Can't make it, names (+ Add someone, limited by the host), kids if asked, "When are you coming?" if the event asks, what you're bringing (multi-pick chips + add your own), a note (with a hint saying whether it shows on the invite).
- **Your reply (`/event/r/<token>`):** "You're in!", what you're bringing, when you're coming, keep-your-link card, Change my reply.
- **Home (`chirk.fyi`):** "chirk / By invitation only", plus "Your plans" for events this phone replied to.

**Host side**
- **Your events (`/host`):** a black "+ New event" button, then Upcoming (soonest first, Live/Draft labels, "Hosted by …"), with Past and Archived folded away underneath.
- **New event (`/host/new`):** the essentials open (Title, Date, Starts/Ends, Place, Address, Hosted by), then rows: Message, Photo, What to bring, Schedule, Reply by, Guest options, Web address.
- **Event host page:** stat tiles, "There by" counts when guests say when they're arriving, Send the invite (Share by text, Copy invite for email), Replies (each with what they bring, their note as a bubble, and quiet Copy their link / Edit / Delete), What to bring (Still needed + Covered chips, "Edit list"), Event (the same rows as New event, with Basics as the first row), Copy to next year, Archive, Delete this event.

**Outside the site**
- **iMessage link preview:** bold line "You're invited: <title>", then date, time and place; the cover photo, or a generated 1200×630 white card.
- **Emails** (invite pasted into Gmail/Mail, "Your RSVP" link emails, host reply notices): inline styles; text color left to the mail app so dark mode works; black pill button with a white outline. The emailed invite carries the schedule and the hosts' signature too.

## Decisions so far, and why
- No "Maybe": it produces piles of non-answers.
- One reply per household: couples and families answer together; anyone on the reply can change it.
- The host's message sits before the RSVP button, and the reply-by line sits right under the button.
- Each household appears once on the invite (Coming), with what they bring and their note, instead of three separate lists.
- Still needed is the one thing guests act on, so it comes before Coming.
- RSVP button sits in the page and only pins to the screen bottom after scrolling past it, so it never covers the invite on load.
- Event form: essentials first, everything else as same-looking rows; New event and Edit event are one shared form, so they can't drift apart.
- Settings live inside the row they affect (e.g. "Write times as 3:00 PM" is in Schedule).
- Explicit formatting marks with an Auto-format button, because guessed formatting confused people.
- Kids question off by default; built-in item suggestions removed (examples stay neutral).
- Plain white everywhere for now, so design can be decided once, deliberately.

## Open for design
- **Color and type:** a real palette and typeface pairing; dark mode for the app.
- **Desktop:** today it's the phone column centered; a wider layout (e.g. photo beside the details) is open.
- **Three directions from the original Post Up brief, all still open:** Bulletin board (paper notes, pegboard, vintage Apple warmth); Cash App / BRAT (big confident type, one bold color, huge actions); "Craigslist is beautiful" (HTML-1.0 plainness, blue links, dense lists stacked for phones).
- **Wrappers (an idea):** optional per-event dressing for the invite only (background color, font pairing, texture) from a short curated set; the RSVP form and host tools stay plain.
- **Coming soon, needing design:** named invitations ("invited vs replied", an invite list on the host page); picking several parts of the day; accounts with co-hosts (owner + co-hosts); a short privacy page with a one-line footer; later a feed of friends' plans.
- **Constraints to keep:** works at 390px wide; tap targets ≥44px; inputs ≥16px (iPhone zoom); emails use inline styles and JPEG images; link previews 1200×630.
