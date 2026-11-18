# chirk UI / UX v2
## Audit, Design Constitution, and Claude Implementation Brief

**Date:** November 18, 2026  
**Status:** AUDIT + DESIGN SYSTEM DEFINITION FIRST. Do not make broad implementation changes until the audit and first vertical slice are approved.  
**Product:** chirk — https://chirk.fyi  
**Primary environment:** Mobile web first, especially iPhone-width layouts around 390px  
**Current aesthetic direction:** “Craigslist is beautiful” meets streamlined modern software simplicity

---

# 1. Objective

Refine chirk into a cleaner, quieter, more deliberate product without losing the simplicity that already works.

The goal is not to “make it prettier.”

The goal is to establish an identifiable **chirk way** to:

- display information
- ask a question
- show a primary action
- handle secondary actions
- show state
- confirm that an action worked
- reveal optional complexity
- present a lightweight plan
- present a detailed invitation
- get out of the user’s way

This should create a UI system that works for:

- today’s detailed invitation and RSVP flows
- host tools
- lightweight future “posted up” plans
- saved people
- circles
- a chronological plans feed
- map-based plans
- recurring / standing plans

The current app should become simpler now while also moving toward that future.

---

# 2. Product context

chirk is a phone-first, URL-native invitation and plans product.

Today:

- a host makes an event
- sends one link
- guests open it in their browser
- guests RSVP without downloading an app or creating an account
- hosts can see replies, headcount, what people are bringing, and what is still needed

The product is intended to grow from detailed event invitations into a broader private plans layer.

The connective tissue is:

> letting your people know something is happening and giving them an easy way to join

That “something” can be extremely lightweight:

> I’m at Sey until 2 if anyone wants to come by.

Or highly detailed:

> Thanksgiving at 4:30. Here is the address, all-day schedule, guest list, menu, what everyone is bringing, reply deadline, and host note.

Those are not different products.

They are both **a chirk**.

Working product language:

> **A chirk is a plan you send to your people.**

A chirk can be as simple as where you are posted up for an hour or as detailed as the whole party.

---

# 3. Brand / UI direction

The preferred visual direction is currently:

> **Craigslist is beautiful + streamlined tech simplicity**

Not literal Craigslist imitation.

The design should feel:

- plain on purpose
- information-forward
- quiet
- confident
- phone-native
- web-native
- slightly low-fi
- editorial without being decorative
- modern without becoming generic SaaS
- useful before stylish

Potential brand color:

- a single restrained hyperlink-like blue
- everything else primarily black, white, and warm neutrals

Current visual system is a placeholder and can be refined.

However, the existing product principles are not placeholders.

---

# 4. Existing principles to preserve

These are core product rules unless the audit finds a real usability problem.

## Simplicity beats features

If the next real event does not need something, it should not dominate the product.

Advanced settings belong behind progressive disclosure.

## Phone first, always

Design around approximately 390px wide.

Keep:

- large touch targets
- short forms
- no hover-dependent functionality
- inputs that avoid iOS zoom
- clear thumb reach

## Guests should be done in under a minute

A guest should be able to:

- understand the invitation
- reply
- add names
- select what they are bringing
- optionally leave a note

without account creation.

## Every action shows it worked

Examples:

- Saving…
- Saved ✓
- Sending…
- Sent ✓
- Copied ✓

Avoid silent success.

## Information over decoration

Prefer:

- text
- hierarchy
- spacing
- hairline rules
- clear labels

over:

- decorative cards
- badges
- unnecessary icons
- gradients
- shadows
- ornamental containers

## Plain words

Use direct language.

Examples:

- Going
- Can’t make it
- Still needed
- Covered
- Coming
- No reply yet
- Remind
- Message your guests

Avoid product jargon.

---

# 5. The chirk design constitution

These rules should act as the local source of truth.

External design skills and libraries may help with critique and implementation quality, but they do not override these rules.

## 5.1 Every new visual element must earn its existence

Before adding:

- a card
- pill
- icon
- border
- badge
- color
- animation
- explanatory paragraph
- navigation layer

ask:

> What usability problem does this solve?

If the answer is mainly “it looks nicer,” it probably does not belong.

---

## 5.2 One obvious primary action

Every screen, modal, or major state should have one obvious next action.

Secondary actions should remain discoverable, but should not visually compete with the primary task.

---

## 5.3 Information should not automatically become a card

Use a container only when containment has meaning.

Prefer:

- whitespace
- type hierarchy
- dividers
- grouped rows

before introducing a box.

---

## 5.4 Pills are not the default geometry

The current product uses many fully rounded pills.

That is a placeholder convention, not a permanent brand rule.

Actions may still be large and tactile, but:

- buttons do not automatically need 999px radius
- metadata should not become chips by default
- lists should not become pill collections unless selection genuinely benefits from it

---

## 5.5 Finite pages are good

Do not optimize for endless engagement.

A screen can simply end.

Examples:

- five plans today
- six replies
- twelve guests
- three things still needed

No infinite scroll is required merely because the product has a feed.

---

## 5.6 Optional information should disappear when absent

If an optional section has no useful content:

- do not show an empty card
- do not show an empty heading
- do not explain that nothing is there

Hide it.

---

## 5.7 The product should not over-explain itself

Copy should explain:

- a decision
- a consequence
- an unfamiliar interaction
- a potentially destructive action

Do not repeatedly explain implementation or obvious interface behavior.

---

## 5.8 User imagery is content, not decoration

chirk should not provide decorative stock imagery.

Images belong to the host / users.

The application chrome should remain restrained enough that uploaded imagery can carry personality.

---

## 5.9 The brand system should remain small

Preferred default direction:

- white page
- near-black ink
- warm gray secondary text
- hairline neutral dividers
- one restrained blue accent
- system font unless a future type decision is made intentionally

Avoid adding multiple brand colors without a clear semantic need.

---

## 5.10 The spark is functional, not ornamental

The mark is:

> chirk*

The asterisk is **the spark**.

The spark may eventually act like an old message-waiting light:

- subtly active when something changed
- quiet when nothing needs attention
- no bouncing
- no gamified unread treatment
- no decorative animation for its own sake

Animation should be sparse and respect reduced-motion preferences.

---

## 5.11 Guests should never feel like they joined a software product

A guest should feel like they opened an invitation or plan.

Avoid:

- onboarding
- product tours
- account prompts
- app-download interruptions
- “join the community”
- profile setup requirements

The plan comes first.

---

## 5.12 Lightweight and detailed chirks must use the same language

The system should support:

> Sey Coffee · now–2

and:

> Thanksgiving for 30 guests with a schedule and bring list

without requiring two separate products or completely separate design systems.

Complexity should be progressive.

---

# 6. External design / implementation guidance

Use external resources as guardrails, not as the source of taste.

## 6.1 Anthropic Frontend Design

Use as the primary visual-design critique skill.

Purpose:

- identify generic AI-design defaults
- improve hierarchy
- improve typography
- improve spacing
- make intentional component decisions
- refine visual restraint

Important instruction:

> Do not reinterpret the chirk identity. The local chirk design constitution outranks generic design recommendations.

Do not “improve” chirk by turning it into:

- generic SaaS
- dashboard software
- rounded-card UI
- gradient-heavy UI
- fashionable startup visual language

---

## 6.2 Vercel Web Design Guidelines

Use after the product direction is established.

Purpose:

- accessibility
- focus behavior
- form quality
- touch targets
- semantic interaction
- keyboard behavior
- reduced motion
- navigation/state quality
- responsive implementation

Use as a quality-control layer.

Do not let it choose chirk’s aesthetic identity.

---

## 6.3 Vercel React Best Practices

Use for implementation quality after UX decisions have been made.

Purpose:

- component structure
- performance
- maintainability
- rendering behavior

It is not a replacement for product or design decisions.

---

## 6.4 Figma

Use selectively.

Do not recreate the entire application before coding.

Potential canonical frames:

1. lightweight chirk
2. detailed invitation
3. RSVP
4. RSVP confirmation
5. host event page
6. create chirk
7. future plans feed

These can act as visual north stars.

If Figma MCP is available, it can be used to give Claude direct access to approved design context.

---

## 6.5 Playwright visual regression

Once chirk v2 patterns are approved, capture visual baselines.

Suggested initial screenshot states:

### 390px
- homepage
- lightweight invite
- detailed invite
- RSVP
- confirmation
- host event
- event creation

### Desktop
- invite
- host event

Purpose:

- detect accidental visual drift
- catch shared-component regressions
- make future visual changes intentional

Approved changes can update baselines.

The goal is not pixel stagnation.

---

# 7. Audit methodology

Do not start with implementation.

First perform a read-only audit of the actual application.

For every screen ask:

1. What am I looking at?
2. What does the user need to know now?
3. What is the next appropriate action?
4. What is visually competing with that action?
5. What could disappear?
6. What could be shortened?
7. What could move behind progressive disclosure?
8. Is the page using cards or pills unnecessarily?
9. Does the user need this explanation every time?
10. Does this pattern work at 390px?
11. Does it work with one thumb?
12. Does it still make sense for a lightweight future chirk?
13. Does it still make sense once friends / circles / feed exist?
14. Is any visual styling fighting the emerging chirk identity?
15. Is any current behavior unclear enough that it may be a product bug rather than a design issue?

---

# 8. Audit categories

## 8.1 Information architecture

Review:

- what belongs on each screen
- what is duplicated
- what appears too early
- what should disappear
- what belongs behind More options
- what belongs on a separate screen
- what should be condensed into one line

---

## 8.2 Action hierarchy

For each screen identify:

- primary
- secondary
- overflow
- destructive

There should normally be at most one strong primary action.

---

## 8.3 Typography hierarchy

Audit:

- title size
- section headings
- body
- metadata
- labels
- hints
- link styling
- emphasis

The page should not depend on containers to create hierarchy.

Typography should do more work.

---

## 8.4 Geometry

Audit:

- pill usage
- border radius
- cards
- inputs
- buttons
- chips
- list rows

Question:

> Does this need to be rounded / boxed / filled?

---

## 8.5 Color

Audit current usage.

Explore:

- near-black ink
- warm neutrals
- one hyperlink-like chirk blue
- status colors only when truly semantic

Blue should likely mean:

- interactive
- link
- focus
- selected or active in limited contexts

Avoid decorative blue surfaces unless intentionally approved.

---

## 8.6 Copy

Identify:

- over-explained sections
- repeated help text
- software-like phrasing
- inconsistent verbs
- labels that could become plain language

Keep voice:

- warm
- plain
- short
- quietly confident
- slightly dry
- no startup language
- no cute errors

---

## 8.7 Feedback / state

Audit:

- saving
- saved
- sending
- sent
- copying
- copied
- loading
- error
- empty
- draft
- archived

No silent actions.

---

## 8.8 Accessibility

Check:

- tap target sizing
- keyboard navigation
- visible focus
- semantic labels
- screen reader order
- input behavior
- contrast
- reduced motion
- forms and errors

---

# 9. Guest-side hierarchy

The guest side should be extremely simple.

A detailed invitation can contain a lot, but the guest’s mental hierarchy is:

## Decision layer

- what is this?
- when?
- where?
- am I going?

## Useful context

- host note
- schedule
- what is still needed
- ticket / external details if relevant

## Social context

- who is coming
- what people are bringing
- guest notes if shown

Do not allow a detailed invitation to make a lightweight chirk feel oversized.

The same system must scale down gracefully.

---

# 10. Host-side hierarchy

The host side should avoid becoming a dashboard.

Prefer:

> event → current state → next action

instead of:

> event → many management modules

Example direction:

**Thanksgiving 2026**  
12 coming · 7 replies · 3 still needed

Then show what actually needs attention.

Avoid giving equal visual weight to:

- stats
- send tools
- archive
- duplicate
- edit
- replies
- needed list
- history

Secondary actions should be reachable without competing with the work at hand.

---

# 11. Creation as the bridge to future chirk

Current detailed event creation should evolve toward a composer that can eventually create both lightweight and complex chirks.

Core principle:

> Start with the smallest possible chirk. Add complexity only when the plan needs it.

Long-term conceptual structure:

**What’s happening?**  
**Where?**  
**When?**

Then:

**Add details**

Optional layers might include:

- RSVP
- photos
- bring list
- schedule
- reply-by date
- guest rules
- named invitations
- co-hosts
- reminders

Do not create separate “Post Up” and “Event” products unless real usage eventually proves that necessary.

---

# 12. First implementation slice

After the audit is approved, do not refactor the whole application.

Start with:

> **Guest invitation → RSVP → confirmation**

Why:

- it is the core chirk experience
- it touches most shared UI primitives
- it tests hierarchy
- it tests buttons
- it tests links
- it tests forms
- it tests optional information
- it tests confirmation states
- it tests user imagery
- it tests mobile interaction
- it is the highest-value experience to guests

This vertical slice should establish the first approved v2 patterns.

---

# 13. What the first slice should establish

Use the guest flow to define:

- page width / gutters
- title hierarchy
- metadata style
- place / address presentation
- link behavior
- chirk blue usage
- primary button shape
- secondary action style
- section spacing
- dividers
- selection controls
- input styling
- image behavior
- RSVP choice behavior
- save / send feedback
- success / confirmation language
- optional section behavior
- destructive / edit actions if needed
- mobile sticky behavior
- focus states
- reduced motion

Do not create one-off styles for the guest flow that cannot be reused elsewhere.

---

# 14. Stage plan

## Stage 1 — Read-only audit

No code changes.

Deliver:

- page-by-page findings
- current → proposed hierarchy
- primary / secondary / overflow action map
- repeated copy inventory
- card / pill inventory
- visual identity conflicts
- accessibility issues
- potential behavioral bugs
- change register prioritized by impact
- notes on future compatibility

---

## Stage 2 — Design constitution confirmation

Compare audit recommendations against this document.

Propose edits to the constitution only when necessary.

Do not silently reinterpret it.

---

## Stage 3 — One vertical slice

Implement:

> invitation → RSVP → confirmation

Keep all underlying functionality intact.

Test:

- 390px mobile
- real iPhone Safari if available
- desktop
- keyboard
- screen-reader semantics
- reduced motion
- error states
- long content
- missing optional content
- very lightweight invite
- very detailed invite

---

## Stage 4 — Audit the implementation

Run:

- Anthropic Frontend Design critique
- Vercel Web Design Guidelines audit

Resolve issues without undoing approved chirk-specific design choices.

---

## Stage 5 — Freeze successful shared patterns

Document:

- typography
- spacing
- actions
- links
- inputs
- selected states
- dividers
- lists
- optional sections
- confirmation states
- feedback states

Use them as the basis for host-side refactoring.

---

## Stage 6 — Host screens

Refactor:

- Your events
- event host page
- event form
- send/share flows
- replies
- needed items
- co-host tools

Avoid creating a conventional dashboard.

---

## Stage 7 — Future-facing prototypes

Only after the core system is coherent, prototype:

- lightweight chirk
- future composer
- plans feed
- circles
- map

These prototypes should use the same visual language.

---

# 15. Hard guardrails

Do not:

- redesign the entire product in one pass
- install a large UI library without a clear need
- add dependencies merely for visual polish
- create a new navigation system without justification
- alter RSVP semantics
- add “Maybe”
- force guest account creation
- introduce app-download prompts
- introduce infinite scroll by default
- turn all information into cards
- turn all filters/options into pills
- add decorative icons beside every label
- add gradients
- add ornamental shadows
- add generic startup illustrations
- add decorative stock imagery
- introduce multiple brand colors casually
- add animation without functional purpose
- add marketing copy inside invitation flows
- hide important actions merely to achieve minimalism
- change underlying product behavior while performing visual cleanup unless explicitly authorized

---

# 16. Existing product decisions to preserve

Unless separately reviewed:

- Going / Can’t make it only
- one reply per household
- couples and families can answer together
- guest can return through a private link
- RSVP button is prominent but should not cover initial invite content
- user-uploaded cover photo is shown without arbitrary crop
- optional settings belong under progressive disclosure
- Still needed appears before covered bring-list items
- kids question remains optional
- plain language remains preferred
- host notes / schedule / bring-list content appear only when relevant
- no guest signup requirement

---

# 17. Future compatibility checklist

Before approving a shared pattern, ask if it also works for:

## Lightweight chirk

> Hudson  
> Sey Coffee  
> now → 2

## Medium plan

> Drinks at Cervo’s  
> Friday · 8 PM  
> 6 going

## Detailed invitation

> Thanksgiving 2026  
> 30 guests  
> schedule  
> bring list  
> host note  
> reply-by date

## Future plans feed

A finite chronological list of plans from friends / circles.

## Future map

Pins represent declared plans, not continuous live tracking.

## Future circles

Visibility and filtering by small saved groups.

---

# 18. Suggested repository docs

Create or maintain:

```text
/docs
  CHIRK_PRODUCT.md
  CHIRK_DESIGN.md
  CHIRK_LANGUAGE.md
  CHIRK_UI_PATTERNS.md
```

Suggested role:

### CHIRK_PRODUCT.md

- product thesis
- a chirk as the core object
- current / future scope
- product principles
- roadmap

### CHIRK_DESIGN.md

- this design constitution
- visual rules
- color
- type
- geometry
- responsive rules
- imagery
- animation
- accessibility

### CHIRK_LANGUAGE.md

- voice
- terminology
- labels
- empty states
- system messages
- words to use / avoid

### CHIRK_UI_PATTERNS.md

Only after patterns are proven in implementation.

Document:

- buttons
- links
- inputs
- selection controls
- lists
- sections
- feedback
- confirmations
- destructive actions
- sticky actions
- responsive behavior

Do not invent a large component system in advance.

---

# 19. Suggested Claude kickoff prompt

Use this after Claude has access to the repository and this brief.

> I want a read-only UI/UX audit of chirk before any code changes.
>
> chirk is a phone-first, URL-native invitation and plans product. Today the core guest flow is invite → RSVP → confirmation, and the host side manages events, replies, guests, what people are bringing, and sharing. Long term, the same product needs to support lightweight plans (“I’m at Sey until 2”), saved friends, circles, a chronological plans feed, and a map of declared plans.
>
> The goal is not a rebrand for its own sake. The goal is to make chirk cleaner, quieter, more deliberate, and more future-proof.
>
> Read the local chirk product, language, and design documents first. Treat them as the source of truth. Do not reinterpret the product into generic SaaS.
>
> The emerging visual direction is “Craigslist is beautiful” meets streamlined modern software simplicity: information-forward, plain on purpose, strong typography, sparse use of a single hyperlink-like blue, black/white/warm neutrals, fewer cards, fewer pills, minimal decoration, and user imagery as content rather than app decoration.
>
> Audit the real screens and shared components. For each screen identify:
>
> 1. what the user is looking at
> 2. what needs attention
> 3. the next appropriate action
> 4. competing actions
> 5. unnecessary explanation
> 6. unnecessary cards/pills/containers
> 7. information that can disappear or move behind progressive disclosure
> 8. accessibility / touch / focus issues
> 9. visual patterns that feel generic or fight the chirk identity
> 10. whether the pattern can also support lightweight future chirks and a plans feed
>
> Produce:
>
> - page-by-page audit
> - current → proposed hierarchy
> - primary / secondary / overflow action map
> - copy reductions
> - geometry / card / pill recommendations
> - accessibility findings
> - potential behavior bugs that should not be treated as cosmetic issues
> - prioritized change register
> - recommended first vertical slice
>
> Do not change code.
>
> Do not install packages.
>
> Do not change live behavior.
>
> Do not create a new component library yet.
>
> After the audit, the intended first implementation slice is guest invitation → RSVP → confirmation.
>
> Use Anthropic Frontend Design as a critique framework where helpful, but the local chirk design constitution outranks generic aesthetic advice. Use Vercel Web Design Guidelines as an accessibility and interaction-quality checklist, not as the source of chirk’s brand identity.

---

# 20. Definition of success

The v2 work succeeds if:

- a new guest understands the invitation immediately
- RSVP still takes under a minute
- the interface feels calmer
- important actions are easier to find
- pages use fewer unnecessary containers
- typography and spacing carry more hierarchy
- blue links / actions feel intentional
- host screens feel like tools, not dashboards
- the product remains recognizable across lightweight and detailed plans
- future feed / circles / map work can reuse the same system
- visual changes remain intentional and testable
- chirk feels more like itself and less like a generic app

The end state should be:

> **There is an identifiable chirk way to show a plan, ask for a reply, communicate state, and get out of the user’s way.**
