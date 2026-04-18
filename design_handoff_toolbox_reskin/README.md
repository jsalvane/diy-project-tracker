# Handoff: Toolbox Reskin

## Overview

This is a **visual reskin** of the existing Toolbox app — a personal project / finance / home-maintenance tracker. No features, data models, or navigation changes. Every screen in the current app is staying; only the **look and feel** are being replaced.

The new direction is a **warm workshop / blueprint / receipt-tape** aesthetic. Think: kraft-paper ground, deep ink, a single rust accent, display serif for headline numerals and names, monospaced labels for categorical tags ("RECEIPTS"-style), and a faint blueprint grid as the connective tissue across every screen.

## About the Design Files

The file in this bundle — `Toolbox Redesign.html` — is a **design reference**, not production code to copy. It is a single-page React prototype with three worked-example screens (Home/Dashboard, Projects list, Project detail) laid out on a zoomable design canvas.

Your job is to **recreate the look and feel** in the target Toolbox codebase, using whatever framework and component library it already uses. Do not try to port the HTML verbatim — reimplement the system (tokens, typography, components, motion) in the existing stack.

**Crucially: only three screens are mocked.** The rest of the app — Finance, Gifts, HSA, Scratchpad, settings, modals, etc. — is *not* drawn. You are expected to **apply the design system consistently** to every remaining screen. This README gives you the full system and three anchor examples; your job is to extrapolate.

## Fidelity

**High-fidelity.** Exact hex values, font stacks, sizes, spacing, and motion are specified below. Match them pixel-for-pixel where possible. If a screen in the real app has a component not covered here, **derive its styling from the token system** (colors, type, spacing, borders) rather than inventing new tokens.

---

## Design Tokens

### Color

```
--paper         #f0eee9   /* kraft-paper ground, app background */
--paper-2       #e8e4db   /* subtle card / strip background */
--paper-3       #dcd6c7   /* divider, rule line */
--ink           #1a1612   /* primary text, near-black but warm */
--ink-2         #3d332a   /* secondary text */
--ink-3         #6b5d4f   /* tertiary / muted text */
--ink-4         #9a8d7c   /* meta / timestamps */
--rust          #b8451f   /* single accent — period, punctuation, 1 key CTA */
--rust-ink      #7a2d13   /* darker rust, hover/pressed state */
--moss          #556b2f   /* positive / done status (use sparingly) */
--ochre         #c8922e   /* warning / planned status (use sparingly) */
--ink-line      rgba(26, 22, 18, 0.12)   /* hairline borders on paper */
--ink-line-2    rgba(26, 22, 18, 0.22)   /* stronger borders */
--blueprint     rgba(26, 22, 18, 0.04)   /* grid backdrop */
```

**Usage rules**
- `--paper` is the only app background. Never pure white.
- `--rust` is used *sparingly* — the period in "Morning, Joe**.**", one primary CTA per screen, maybe an active tab indicator. Not for large fills.
- `--moss` and `--ochre` are for status chips and tiny indicators only. Never large surfaces.
- Avoid gradients. Avoid drop shadows. Depth comes from hairline borders and grid layering.

### Typography

**Families** (all free via Google Fonts)
- **Instrument Serif** — display. Used for hero numerals, first names, section titles. Italic variant carries a lot of personality; use it on the key word of a screen title (e.g. "Projects" with italic dot, "Morning, Joe").
- **Inter** — body. Everything conversational, list rows, paragraphs.
- **JetBrains Mono** — labels, metadata, money amounts in tables, receipt-strip content, category tags. Uppercase + wide letter-spacing for categorical labels.

**Scale** (mobile-first, px)
```
display-xl   64 / 60   Instrument Serif, weight 400
display-lg   48 / 48   Instrument Serif, weight 400
display-md   36 / 40   Instrument Serif, weight 400
title-lg     22 / 28   Inter, weight 600
title-md     18 / 24   Inter, weight 600
body-lg      17 / 24   Inter, weight 400
body         15 / 22   Inter, weight 400
body-sm      13 / 20   Inter, weight 400
label        11 / 14   JetBrains Mono, weight 500, letter-spacing 0.08em, UPPERCASE
label-sm     10 / 12   JetBrains Mono, weight 500, letter-spacing 0.1em, UPPERCASE
mono         14 / 20   JetBrains Mono, weight 400 (for amounts, receipts)
```

Use `font-feature-settings: "ss01", "cv11"` on Inter if available for the straight-single-story `a`. Use Instrument Serif *italic* for punctuation marks (the period, the dot in "i") to get the signature feel.

### Spacing

4px base grid. Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

Card-internal padding is typically `20`. Screen gutters are `20` on mobile. Vertical rhythm between sections is `32` or `40`.

### Border & rule

- Hairlines: `1px solid var(--ink-line)`.
- Receipt-tape divider: a repeating dashed/dotted pattern in `--ink-3`:
  `background-image: repeating-linear-gradient(90deg, var(--ink-3) 0 6px, transparent 6px 12px); height: 1px;`
- Corners: `border-radius: 14px` for cards, `10px` for inputs/buttons, `999px` for pills/chips, `0` for receipt strips and blueprint panels.

### Elevation

**No drop shadows.** Depth is conveyed by:
1. Hairline borders (`--ink-line`)
2. Slight background shift (`--paper-2` on `--paper`)
3. Blueprint grid showing through a semi-transparent overlay card

The one exception: the iOS status bar / home indicator rendering for device frames — those follow iOS native, not our tokens.

### Blueprint grid (backdrop)

Faint grid used as the canvas for screens and for certain full-bleed sections:

```css
background-color: var(--paper);
background-image:
  linear-gradient(var(--blueprint) 1px, transparent 1px),
  linear-gradient(90deg, var(--blueprint) 1px, transparent 1px);
background-size: 24px 24px;
```

Add a second, 4x-denser grid at 10% opacity for extra texture if desired.

---

## Component Library

Below are the primitives every screen is built from. Implement them once, reuse everywhere.

### `<Screen>` — phone-frame container
Mobile-first; 390px design width (iPhone 14/15). Uses `--paper` background and the blueprint grid.

### `<StatusBar>` — iOS-style status bar
Uses the target app's real status bar; no custom work needed unless this is web where you simulate it.

### `<ReceiptStrip>` — dashed horizontal divider
`1px` tall, repeating-dash pattern in `--ink-3`. Used to separate sections within a screen. Spec above under "Border & rule."

### `<TapeLabel>` — monospaced uppercase label
Small categorical label. `label-sm` type token. Often paired with a tiny dot separator (`·`) between items.
Example: `FRIDAY · APRIL 17`

### `<Numeral>` — display numeral
Wraps a number in Instrument Serif at `display-lg` or `display-xl`. Used for project counts, dollar amounts, dates.

### `<Pill>` — status chip
Height 22px, padding 0 10px, `border-radius: 999px`, `1px solid --ink-line-2`, `label-sm` mono text, transparent background. Variants:
- Default: ink text on transparent
- Moss: `color: --moss, border-color: --moss` at 40% alpha
- Ochre: `color: --ochre, border-color: --ochre` at 40% alpha
- Rust: `color: --rust, border-color: --rust` at 40% alpha

### `<Card>` — hairline-bordered container
`background: --paper`, `border: 1px solid --ink-line`, `border-radius: 14px`, padding `20px`. No shadow.

### `<BlueprintCard>` — grid-backdrop card
Same as Card but with the blueprint grid background showing through. Used for project hero panels, sketch surfaces.

### `<ProjectCard>` (list item)
The main repeatable item on the Projects list. Structure:
```
┌──────────────────────────────┐
│  [thumb]  TAPE-LABEL CATEGORY │
│           Project Name        │ ← title-lg
│           Short one-liner     │ ← body-sm, --ink-3
│  ┌─────────┐                  │
│  │ progress│  Pill · Pill     │ ← receipt meta row
│  └─────────┘                  │
└──────────────────────────────┘
```
- Thumb: 56×56px, `border-radius: 10px`, gradient or photo placeholder.
- Tapping the card navigates to project detail.

### `<Button>`
- **Primary (rust):** `background: --ink`, `color: --paper`, `border-radius: 999px`, padding `10px 18px`, `body` weight 600. Used for the single hero CTA on a screen.
- **Secondary:** `background: transparent`, `color: --ink`, `1px solid --ink-line-2`, same radius & padding.
- **Ghost / icon:** transparent, no border, `--ink-3` color, hover `--ink`.

### `<Input>` / `<Textarea>`
Background `--paper-2`, `1px solid --ink-line`, `border-radius: 10px`, padding `12px 14px`, `body` type. Focus: `border-color: --ink` + inset `0 0 0 3px rgba(184, 69, 31, 0.15)` (rust halo).

### `<TaskRow>`
Check-circle (18px, `1px --ink-line-2`, filled `--ink` + checkmark when done), label (`body`), optional meta tag (`label-sm` mono). Completed rows: `text-decoration: line-through`, `color: --ink-4`.

### `<MoneyRow>` (ledger line)
Monospace label left, monospace amount right, with a dotted leader in between (dots filling the space). Used in dashboards, receipts, budget summaries.
```css
.leader {
  flex: 1;
  border-bottom: 1px dotted var(--ink-line-2);
  margin: 0 8px 4px;
}
```

### `<Sparkline>` / `<ReceiptGraph>`
Thin (1.5px) ink stroke, no fill. Baseline is a receipt-tape dashed line. Used for trends in the Finance dashboard.

### `<BottomTabBar>` (existing — just reskin)
Height 80px (incl. home-indicator area). Background `--paper`, top border `1px --ink-line`. Icons in `--ink-3`; active tab: icon in `--ink`, label in `--rust`, underline hairline in `--rust` (2px, 20px wide, centered).

---

## Screens (worked examples)

Three screens are mocked in `Toolbox Redesign.html`. They anchor the system; extrapolate the rest.

### 1. Home / Dashboard

**Purpose:** Glance at today — what's on the bench, what's due, quick links to the main areas.

**Layout (top to bottom):**
1. Status bar (iOS native)
2. Date tape label: `FRIDAY · APRIL 17` (JetBrains Mono, `label-sm`)
3. Hero greeting: `Morning,` line 1, `Joe.` line 2 with the period in `--rust` italic. Both lines Instrument Serif `display-xl`. Left-aligned.
4. Receipt-strip divider.
5. `ON THE BENCH TODAY` tape label, then a list of 2-3 active projects as compact `<ProjectCard>` variants.
6. Receipt-strip divider.
7. `QUICK LINKS` tape label, then a 2-column grid of destination cards (Finance, Gifts, HSA, Scratchpad) — each card shows a Numeral (the salient number: balance, unopened count, etc.) and a label.
8. Bottom tab bar.

**Spacing:** 20px gutters, 32px between major sections.

### 2. Projects list

**Purpose:** Browse every project across states (in progress, planned, done).

**Layout:**
1. Status bar.
2. Tape label: `THE WORKSHOP · APRIL`. Right side: `+ New Project` pill button (primary-inverse: `--ink` background, `--paper` text, pill radius).
3. Hero title: `Projects.` — Instrument Serif `display-lg`, period in `--rust` italic.
4. Receipt-strip divider.
5. Stat strip — 4 columns: `IN PROGRESS 1 · PLANNED 1 · DONE 1 · SPENT YTD $3.1k`. Mono labels above, Instrument Serif `display-md` numerals below. Rust is allowed on one of these (the dollar figure) to draw the eye.
6. Filter chips row — `All · Active · Planned · Done`. Active chip: `--ink` background, `--paper` text. Others: transparent, `--ink-line-2` border.
7. Project list — vertical stack of `<ProjectCard>`s, separated by receipt-strip dividers (not borders on the cards themselves).
8. Bottom tab bar.

**Empty state:** Instrument Serif message "Nothing on the bench yet." + secondary "Add your first project" button. Keep it quiet.

### 3. Project detail — Deck Repair

**Purpose:** Single project's workspace: description, photos, tasks, expenses, notes.

**Layout:**
1. Status bar + back arrow (top-left, ghost button).
2. Small tape label: `PROJECT · DECK REPAIR`.
3. Hero title: project name in Instrument Serif `display-lg`, italic period.
4. Blueprint card (full-width, ~220px tall) — the project's "cover." Can show a sketch, a photo, or the blueprint grid with a centered mono label if no image.
5. Meta row: `STARTED MAR 12 · 34% COMPLETE · $847 SPENT` as dotted-leader MoneyRow variants or as one tape-label line.
6. Receipt-strip divider.
7. `TASKS` section — `<TapeLabel>` + list of `<TaskRow>`s. Completed ones at the bottom, struck through, muted.
8. Receipt-strip divider.
9. `EXPENSES` section — `<TapeLabel>` + list of `<MoneyRow>`s with dotted leaders, totals at the bottom underlined with a `2px` ink line.
10. Receipt-strip divider.
11. `NOTES` section — freeform textarea styled as ruled notebook paper (horizontal `--ink-line` rules every 28px).
12. Bottom tab bar.

---

## Applying the System to the Rest of the App

For screens **not** drawn here, follow these rules:

1. **Every screen opens with a tape label + display-serif title**, period rendered in rust italic. This is the signature.
2. **Sections are separated by receipt-strip dividers,** not by boxed cards or bg-color changes.
3. **Categorical data goes in mono labels.** Money goes in mono. Names and emotional content go in serif.
4. **One rust accent per screen, max.** Pick the most important glanceable value.
5. **Lists use receipt-strip separators,** not card-per-item unless the item has rich content.
6. **Forms & inputs** use `--paper-2` fills with hairline borders; no filled backgrounds or heavy card wells.
7. **Modals** slide up from the bottom, full-width, `--paper` background, receipt-strip at the top + drag handle.

Screen-by-screen checklist to hit:
- Finance dashboard → stat strip pattern (from Projects list) + sparkline ledger rows
- Budget → MoneyRow list w/ dotted leaders, totals underlined
- Credit cards, Loans, Subscriptions → list of cards w/ left-edge tape label and mono amount right-aligned
- HSA → same ledger pattern
- Gifts → ProjectCard variant w/ recipient name as the title
- Scratchpad → ruled-notebook textarea full-screen, tape label header
- Command palette → `--paper` sheet over dim `--ink` overlay at 40%, mono input, receipt-strip dividers between result groups
- Settings / Pin lock / Toasts / Confirm dialog → derive from tokens; no new primitives

---

## Interactions & Behavior

### Navigation
No changes. The existing routing graph stays. Only **transitions** change (see Motion below).

### Hover / active states (where applicable)
- Primary button: pressed → `--ink` stays, opacity drops to 0.85, scale 0.98.
- Secondary button: hover → border color `--ink-line-2` → `--ink`; pressed → `--paper-2` fill.
- ProjectCard: hover → subtle `--paper-2` fill fade-in over 150ms. Tap: scale 0.98 for 80ms then navigate.
- Pill: no hover effect unless it's interactive (filter chip). Filter chip active: see above.

### Form validation
Unchanged from current app. Visual: invalid input border becomes `--rust`; helper text below in `--rust`, `body-sm`.

### Loading states
Replace spinners with a **tape-label pulse**: `LOADING...` in JetBrains Mono, letters fading in sequence right-to-left over 1.2s, infinite. For skeleton content, use `--paper-2` fills with a slow `--paper-3` shimmer (2s cycle).

### Empty states
Instrument Serif headline + one-line secondary + one ghost/secondary button. Never illustrations.

### Error states
Toast: `--ink` background, `--paper` text, pill-radius, slides up from bottom-right-ish (see Motion). Icon is a small rust `!` glyph.

---

## Motion

All easing: `cubic-bezier(0.22, 1, 0.36, 1)` (a calm out-expo). All durations are **mobile-typical**, not long.

| Event | Property | Duration | Notes |
|---|---|---|---|
| Screen enter (push) | transform: translateX 24px → 0; opacity 0 → 1 | 280ms | Outgoing screen slides left 24px, fades to 0.6 |
| Screen exit (pop) | reverse of above | 240ms | |
| Bottom tab switch | fade + translateY 8px → 0 | 200ms | No horizontal slide |
| Modal present | translateY 24px → 0; opacity 0 → 1 | 320ms | Backdrop fades in parallel |
| Modal dismiss | reverse | 240ms | |
| List item entrance (first paint only) | opacity 0 → 1; translateY 6px → 0 | 240ms | Staggered 30ms per item, cap at 8 items |
| Button press | scale 1 → 0.98 | 80ms in / 120ms out | |
| ProjectCard hover | background fade | 150ms | |
| ReceiptStrip reveal (on section mount) | scaleX 0 → 1 from left | 360ms | Optional flourish; use on screen enter only |
| Toast in | translateY 12px + opacity 0 → 1 | 220ms | |
| Toast out | opacity 1 → 0 | 180ms | |
| Tab indicator slide | transform: translateX | 240ms | |
| Checkbox check | path draw stroke-dashoffset | 180ms | Linear ease for the draw itself |
| Input focus halo | box-shadow fade | 140ms | |
| Skeleton shimmer | background-position | 2000ms | Infinite, linear |
| Loading label pulse | opacity per-letter, staggered | 1200ms | Infinite |

**Reduce-motion:** respect `prefers-reduced-motion: reduce`. When set, disable slides, stagger, and shimmer; keep opacity fades at ≤100ms.

### Micro-details worth preserving
- The **italic rust period** in titles has a subtle hover-wiggle on home screen only: ±2° rotation, 400ms, ease-in-out, once on entrance.
- **ProjectCard tap**: the receipt-strip below the card animates a left-to-right "peel" (scaleX 0 → 1, origin-left, 300ms) right before navigation. Makes the transition feel mechanical.

---

## State Management

No changes to state shape, data fetching, or persistence. This is a visual-only reskin. Every current Redux/Zustand/Context slice stays; every API call stays; every localStorage key stays.

---

## Assets

- **Fonts:** Instrument Serif, Inter, JetBrains Mono — all free from Google Fonts. Host self-hostedly per the target project's conventions.
- **Icons:** keep whatever icon library the current Toolbox uses. Recolor to `--ink-3` default, `--ink` active. Do **not** introduce a new icon set.
- **Imagery:** the mock uses gradient placeholder swatches for project thumbnails. The real app's current photos/uploads work fine; just render them at `border-radius: 10px` inside the `<ProjectCard>` thumb slot.
- **Illustrations:** none. Do not add stock illustrations, 3D renders, or AI-art. The aesthetic is deliberately material and restrained.

---

## Files

- `Toolbox Redesign.html` — the design reference. Open in a browser; pan/zoom on the canvas. Three screens are laid out with post-it annotations explaining the system. Read those in addition to this README.

---

## Implementation order (suggested)

1. **Tokens first.** Drop the color, type, spacing tokens into the target codebase's theme/config. Run the app — it'll look broken but warm. Good.
2. **Global type styles.** Set base body to Inter, swap every `h1/h2/.display` class to Instrument Serif. Convert `.label` / `.meta` classes to JetBrains Mono uppercase.
3. **Primitives.** Build `<ReceiptStrip>`, `<TapeLabel>`, `<Pill>`, `<Card>`, `<BlueprintCard>`, `<Button>`, `<Input>`, `<MoneyRow>` with the token system. Write a Storybook (or equivalent) page for them.
4. **Reskin the bottom tab bar.** It's everywhere; getting it right builds momentum.
5. **Home screen** (use mock #1 as the pixel reference).
6. **Projects list** (mock #2).
7. **Project detail** (mock #3).
8. **Extrapolate** to Finance, Gifts, HSA, Scratchpad, modals, dialogs per the rules in "Applying the System."
9. **Motion pass.** Add the transitions table across the app. Respect reduce-motion.
10. **Empty / loading / error states** reskin.

---

## Open questions to flag back to design

Expect these to come up. If you hit any of them and design isn't available, use the fallback listed:

- **App icon / launch screen** — not covered here. Fallback: paper ground + Instrument Serif italic "T." centered in rust.
- **Onboarding / auth flows** — not covered. Fallback: follow Home screen composition (tape label + hero serif + a single primary button).
- **Dark mode** — explicitly out of scope this round. Don't ship a dark variant.
- **Animations on Android vs iOS** — timings above are tuned for iOS. On Android, shave 20ms off each duration and drop ReceiptStrip reveal flourish.
- **Charts (if any in Finance)** — follow Sparkline spec: 1.5px ink stroke, no fill, dashed receipt-tape baseline.

If in doubt, pick the option that feels **quieter, more material, and more like a notebook** than the other.
