# chirk: design notes (as of Nov 18, 2026)

> **v2 in progress:** the guest flow (invite → RSVP → confirmation) now follows `docs/CHIRK_UI_PATTERNS.md` (chirk blue #2457F5 for links, focus and picked choices; 8px buttons; no guest-side boxes or pills that do nothing). Host pages below still describe the older look until Stage 6. Audit: `docs/UI_AUDIT_V2.md`.

*What chirk is and how we talk about it: LANGUAGE.md. This file is how it looks.*

chirk is a tiny, phone-first invite and RSVP site, a DIY Partiful. A host makes an event, texts one link, and guests reply in under a minute with no app and no account. The current look is deliberately plain: a placeholder chosen so it can't get in the way until a real design direction is decided. Live example: https://chirk.fyi/thanksgiving-2026

## Who it's for
- **Guests:** open a link from a group text on their phone, read the invite, tap RSVP, say what they're bringing. Never sign up.
- **Hosts** (today Hudson and Molly) sign in with their email and a 6-digit code; anyone on a chirk guest list can. Each event has an owner and any number of co-hosts.
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
- **Form rows (host):** one line per optional part (label left, current setting right in soft, a › that turns when open). Tapping opens just that row; closed rows keep their values. Rows most chirks don't need (Schedule, Guest options, Shared costs, Gift exchange, Web address) sit inside a **More options** row that lists them; one that's switched on always shows on its own.
- **List editor:** the host's list as removable chips (who's bringing it shown in soft; removing a covered item asks first) plus an "Add things (commas for several)" box.
- **Stat tiles (host):** wash tiles that follow what the event uses: coming, replies, still needed (bring list), still owed (costs or poker), in the pot (poker), giving gifts (gift exchange), each with an optional tiny sub-line. Three to a row; four make two rows of two.
- **Formatting in the message:** `# Title`, `- bullet`, `**bold**`, auto-links; tools: Auto-format, Clear formatting, Preview.
- **Two-step delete:** a quiet gray "Delete" link, then a red "Sure?" (no pop-ups). When more goes with it (a guest with costs or poker), an amber box says what, before "Sure?".
- **Toggle pills (`pill-check`):** a checkbox or radio inside a pill; ticked inverts to ink. Used for Split between, Buy-in / Cash-out, Who's in. Choices stay as picked after each Add.
- **Selects (`field`):** same shape as fields, with a chevron.
- **Money:** a plain table for poker (Player · In · Out · Net), worked-out amounts in soft gray with a line saying why; settle-up as wash cards ("Lee owes Hudson $35", Pay with Venmo, Mark paid); an amber alert when the chips don't add up.
- **Gift match card:** wash card, "You're giving a gift to" then the name large, their ideas, "Keep it a secret!". Above it, a soft line of who's in and the host's rules as plain text.
- **Host label:** a small wash pill next to a host's name in the guest list.
- **Place suggestions:** typing 3+ letters in Place or Address shows up to 5 places under the box (name bold, address soft) with "Powered by Google"; a tap fills the Address and says "Address filled in ✓".
- **Restored draft notice:** amber "Restored what you were typing. Discard" when a half-typed event form comes back after a reload.

## Screens
**Guest side**
- **Invite (`/event`):** cover photo full width (tall photos capped at ~70% of the screen height, trimmed from the bottom), title, date and time, place (tap for Maps), "Hosted by" when there's no message, schedule, Add to calendar, the host's message signed "— Hosts", RSVP button with "Please reply by …" under it, Still needed, Coming.
- **RSVP (`/event/rsvp`):** Going / Can't make it, names (+ Add someone, limited by the host), kids if asked, "When are you coming?" if the event asks, what you're bringing (multi-pick chips + add your own), a note (with a hint saying whether it shows on the invite).
- **Your reply (`/event/r/<token>`):** "You're in!", what you're bringing, when you're coming, keep-your-link card, Change my reply.
- **Home (`chirk.fyi`):** "chirk / By invitation only", plus "Your plans" for events this phone replied to.
- **Costs / Poker night / Gift exchange:** sections under the invite when the host turns them on; each person sees their own share or match.

**Host side**
- **Sign in (`/host`):** "Been invited to an event? You're invited to chirk.", two lines on what chirk is, email, then the 6-digit code.
- **Your events (`/host`):** a black "+ New event" button, Select for bulk archive/delete,, then Upcoming (soonest first, Live/Draft labels, "Hosted by …"), with Past and Archived folded away underneath.
- **New event (`/host/new`):** a quiet underlined "Paste a text or screenshot" line (opens a small two-line composer with a paperclip for a file and a small "Fill in" button; the form then says "Filled in from what you pasted. Check everything…"), then a quiet underlined "Start from a template" line under the title (opens your saved templates as a list with Remove, then the built-in chips; once picked, "Started from Poker night · Start blank"), then the essentials open (Title, Date, Starts/Ends, Place, Address, Hosted by), then rows: Message, Photo, What to bring, Schedule, Reply by, Guest options, Shared costs (with Poker), Gift exchange (budget, rules, draw date, reminders; every match tucked under "Trouble with the draw?"), Web address.
- **Event host page:** Hosts line (+ Add a co-host), stat tiles, "There by" counts when guests say when they're arriving, Send the invite (Share by text, Copy invite for email), Replies (each with what they bring, their note as a bubble, and quiet Copy their link / Edit / Delete), What to bring (Still needed + Covered chips, "Edit list"), Event (the same rows as New event, with Basics as the first row), Costs/Poker and Gift exchange tools, Message your guests, Copy to next year, Save as a template (opens to a name field), Archive (not on drafts), Delete this event.

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
- **Coming soon, needing design:** event tiles that fit each event (roadmap 37); advanced options and templates (29, 35); later a feed of friends' plans.
- **Constraints to keep:** works at 390px wide; tap targets ≥44px; inputs ≥16px (iPhone zoom); emails use inline styles and JPEG images; link previews 1200×630.
