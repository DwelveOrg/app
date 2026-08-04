# Dwelve — Design System

Status: v2 · Last updated: 3 August 2026

This document is the design decision source of truth for Dwelve's frontend. Implementation values
must be kept in sync with `src/app/globals.css`, `src/app/layout.tsx`, and the Tailwind v4 theme
setup. `globals.css` is the canonical implementation; this file is the contract.

`AGENTS.md` and `CLAUDE.md` may summarize this file, but must not duplicate it.

> **Changelog — 3 August 2026 (v2).** Full visual redesign. The single-violet palette became a
> **two-accent system** (violet = identity, teal = action). The deliberately flat shell became a
> **soft-depth** one with a real elevation scale. Added the missing token categories — elevation,
> motion, and type — and consolidated ~30 duplicated components into a shared primitive layer (§8).
> Corrected pre-existing drift: six light-mode brand hexes that disagreed with the shipped CSS, a
> logo asset path that never existed, and a §7.3 top-bar contract for a component that had already
> been removed from the shell.
>
> **The consolidation in §8 is complete**, including a sixth primitive the original plan listed and
> the first pass missed (`PersonRequestRow`). Every primitive named there has consumers, and the
> duplicates it replaced are deleted. What is still open is *visual* verification of the last round
> of migrations, plus the dark-mode hero — see
> [redesign-remaining-work.md](./redesign-remaining-work.md), which also carries the grep checks
> that catch the kind of drift lint and `tsc` cannot.

---

## 1. Multilingual rule

Dwelve ships in **Uzbek Latin**, **Russian**, and **English**.

Russian requires Cyrillic glyphs. Uzbek Latin requires Latin Extended glyphs and the turned-comma
character U+02BB `ʻ`.

Any component that can display user-generated text — names, answers, uploaded content, class titles,
comments — must support all three. Test real strings before shipping:

- `Ольга`
- `Gʻulom`
- `Oʻqituvchi`
- `Student answer: Photosynthesis`

Never use straight apostrophes for Uzbek `oʻ` / `gʻ`; use U+02BB `ʻ`.

---

## 2. Typography

### Font roles

| Role | Font | Usage |
|---|---|---|
| UI / body / data | **Manrope** (400/500/600/700; latin, latin-ext, cyrillic) | Everything in the product: headings, body, labels, buttons, tables, inputs, student names, scores, dashboards, user-generated content |
| Marketing display | **DM Serif Display** (400) | Landing display headings and the auth panel headline only — controlled, Latin-only copy |

Rules:

- Manrope is the only font in the authenticated app. Product UI does not need display/body pairing;
  one well-tuned sans carries every role.
- DM Serif Display must never render Russian, Uzbek names, user-generated content, dashboard UI,
  table data, cards, badges, inputs, or report-card student names.
- Do not introduce Inter, Geist, Montserrat, or DM Sans as competing product fonts.
- The **wordmark** is Manrope 700, not the serif. The delivered logo artwork uses a bold geometric
  sans and the wordmark must match it. Driven by `BRAND_WORDMARK_CLASSES` in `src/constants/brand.ts`.

### Type scale

Eight named styles, implemented as Tailwind v4 `@utility` classes in `globals.css`. **Every heading
in the product is one of these.** Raw `text-[Npx]` in a component is a bug.

| Utility | Size / line-height / weight | Use |
|---|---|---|
| `type-display` | `clamp(2.25rem, 5.2vw, 3.5rem)` · 1.04 · 700 | Landing hero only |
| `type-title` | 1.75rem (28px) · 1.18 · 700 | Page titles |
| `type-section` | 1.25rem (20px) · 1.28 · 700 | Entity headers (a school, a class, a test) |
| `type-heading` | 1.0625rem (17px) · 1.35 · 600 | Panel and card headings |
| `type-body` | 0.875rem (14px) · 1.6 · 400 | Body copy |
| `type-label` | 0.8125rem (13px) · 1.4 · 500 | Form labels, list-row titles |
| `type-caption` | 0.75rem (12px) · 1.35 · 400 | Secondary meta |
| `type-micro` | 0.6875rem (11px) · 1 · 600 · uppercase · +0.06em | Badges, eyebrows, table headers |

Plus four **size-only** steps in the Tailwind scale, for when a utility's weight and line-height
would be wrong but the size is still needed: `text-3xs` (10px), `text-2xs` (11px), `text-13` (13px),
`text-15` (15px). The last two fill the gaps Tailwind leaves between `text-xs` (12), `text-sm` (14)
and `text-base` (16) — 13px for meta and dense labels, 15px for comfortable reading. Reach for a
`type-*` utility first; these are the escape hatch, not the default.

**`type-display` is the only fluid style, and only because the landing hero is marketing.** Product
headings are a fixed rem scale: a clamped title that shrinks inside a narrow panel reads as broken,
not responsive, and users sit at a steady DPI.

**The two documented exceptions to "no raw sizes".** Both are outside the product type system by
intent, and there are no others:

- **Marketing display** — the auth panel headline (`AuthVisualParts`) and the closing CTA
  (`CallToAction`) set their own display size. These are one-off compositions, not a scale.
- **The wordmark** — 22px, set in `BRAND_WORDMARK_CLASSES` (`src/constants/brand.ts`), because it is
  a lockup measurement against the 36px mark rather than a typographic choice.

Cap body prose at 65–75ch. Tables and dense data may run wider.

### Font implementation

`src/app/layout.tsx` loads both families through `next/font/google` and exposes them as
`--font-dwelve-sans` / `--font-dwelve-serif`, mapped to `--font-sans` / `--font-serif` in the
`@theme inline` block.

---

## 3. Colour system

Two accents, one system.

- **Violet is identity.** The logo, the wordmark, the auth visual panel, the landing bloom. It marks
  *what this product is*. It never marks an action.
- **Teal is action.** Buttons, current selection, focus rings, active navigation, primary data
  series. If a thing can be clicked or is currently chosen, it is teal.

If a violet element is clickable, it is wrong. That single rule is what keeps the brand legible
while the interface stays obvious.

### 3.1 Light — warm paper, cool ink

Surfaces step **upward** toward the content: the canvas is warm off-white, and cards sit above it in
pure white carrying elevation. This is the inverse of the old flat shell and it is what makes soft
depth read.

| Token | Hex | Role |
|---|---|---|
| `--background` | `#FCFCFA` | Canvas |
| `--card` / `--popover` | `#FFFFFF` | Surfaces above the canvas |
| `--sidebar` | `#F7F6F2` | Second neutral layer |
| `--muted` | `#F4F3EF` | Fills, hover, inputs |
| `--secondary` | `#F1EFE9` | Deeper warm fill |
| `--foreground` | `#16151C` | Primary text (17.7:1 on canvas) |
| `--muted-foreground` | `#56545F` | Secondary text (7.2:1 on canvas) |
| `--border` / `--input` | `#E7E5DF` | Hairlines |
| `--primary` | `#0A7268` | Action teal (5.8:1 with white) |
| `--primary-hover` | `#075E56` | |
| `--ring` | `#0E8C7A` | Focus only |
| `--accent` | `#E6F2EF` | Selected / active tint |
| `--accent-foreground` | `#075243` | Text on accent (8.0:1) |
| `--brand` | `#6A4FF0` | Identity violet |

### 3.2 Dark — cool near-black, warmer accents

| Token | Hex | Role |
|---|---|---|
| `--background` | `#0A0A0C` | Canvas |
| `--sidebar` | `#0F0F13` | Second neutral layer |
| `--card` | `#141419` | Surfaces |
| `--popover` | `#1B1B22` | Floating elevation |
| `--muted` / `--secondary` | `#212129` | Fills, hover, inputs |
| `--border` / `--input` | `#2A2A33` | Hairlines |
| `--foreground` | `#EDECF0` | Primary text (16.8:1) |
| `--muted-foreground` | `#9C9AA6` | Secondary text (7.2:1) |
| `--primary` | `#3DD1B8` | Action teal |
| `--primary-foreground` | `#062622` | |
| `--accent` | `#16302C` | Selected / active tint |
| `--accent-foreground` | `#7FE7D3` | |
| `--brand` | `#A78BFF` | Identity violet |

The two themes are **different characters, not inversions**. Light is warm paper under cool ink;
dark is a cool near-black under warmer accents. Do not "fix" one to match the other.

### 3.3 Semantic

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--success` | `#25793A` | `#5FCB63` | Correct, passed, positive trend |
| `--warning` | `#B45309` | `#F0B23C` | Caution, due soon, needs review |
| `--destructive` | `#BE2E22` | `#FF7A70` | Incorrect, failed, destructive action |
| `--info` | `#1D5FD1` | `#79A9FF` | Neutral information, integrity notices |

Every light semantic is dark enough to work **both** as a fill under white text and as text on the
canvas (all ≥5:1). `--success-text` / `--warning-text` / `--destructive-text` / `--info-text` are
therefore plain aliases of the fills, kept only so existing call sites keep resolving. New code
should use the plain token.

**Success sits ~39° off the action teal in hue** (light) and ~48° (dark). That separation is
deliberate: in a product that grades answers, "correct" must never be misread as "clickable". The
contrast gate enforces it.

Never signal correct/incorrect by colour alone. Pair success/danger with an icon or label — for
colour-blind users and for printed reports.

### 3.4 Charts

Five separable hues, none of them the success green, all ≥3:1 on the card surface.

| | Light | Dark |
|---|---|---|
| `--chart-1` | `#0A7268` teal | `#3DD1B8` |
| `--chart-2` | `#6A4FF0` violet | `#A78BFF` |
| `--chart-3` | `#B45309` amber | `#F0B23C` |
| `--chart-4` | `#C2317A` rose | `#F2789F` |
| `--chart-5` | `#1D5FD1` blue | `#79A9FF` |

Never place chart-2 (violet) directly next to chart-5 (blue) in a legend or stacked series.

### 3.5 Accessibility gate

Body text ≥4.5:1. Large (≥24px, or ≥18.66px bold) and UI boundaries ≥3:1. Note that a 14px semibold
button label is **normal** text under WCAG, not large — this is why `--primary` is as deep as it is.

The palette is machine-checked. Any change to the `:root` / `.dark` blocks must keep the contrast
gate green (see §9).

---

## 4. Elevation

Structure comes from two things: a **hairline** defines an edge, **elevation** separates a layer.

| Token | Utility | Use |
|---|---|---|
| `--elev-1` | `shadow-elev-1` | Resting cards, panels, list surfaces — most of a page |
| `--elev-2` | `shadow-elev-2` | Hover on an interactive card; sticky chrome |
| `--elev-3` | `shadow-elev-3` | Dropdowns, popovers, sticky action bars |
| `--elev-4` | `shadow-elev-4` | Dialogs, toasts |
| `--elev-primary` / `--elev-brand` | `shadow-elev-primary` / `-brand` | The coloured glow under a primary or brand button |

Rules:

- **Light shadows are tinted with the warm ink (`28 24 20`), not a neutral slate.** A shadow that
  disagrees with its surface temperature reads as grime.
- **Dark elevation is a shadow *plus* a top inner hairline.** Cast shadows barely register on a
  near-black canvas; the `inset 0 1px 0 rgb(255 255 255 / …)` highlight edge is what actually makes
  a dark panel look raised.
- **Levels are earned.** Most of a page lives at elevation 1. Two adjacent panels at different
  levels means one of them is wrong.
- **Never nest cards.** A bordered box inside a bordered box is a hierarchy failure. Use elevation
  for the outer container and dividers or insets inside it.
- Raw `shadow-[…]` in a component is a bug.

---

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-1` | 120ms | Colour and state |
| `--dur-2` | 180ms | Hover, press |
| `--dur-3` | 260ms | Enter, exit, accordion, page entrance |
| `--dur-4` | 360ms | Genuine layout moves |
| `--ease-out-quint` | `cubic-bezier(.22, 1, .36, 1)` | Default (`ease-out-quint`) |
| `--ease-out-expo` | `cubic-bezier(.16, 1, .3, 1)` | Longer reveals (`ease-out-expo`) |

- Motion conveys **state**, not personality. State change, feedback, loading, reveal — nothing else.
- No page-load choreography. The app loads into a task.
- Ease out. No bounce, no elastic.
- `prefers-reduced-motion` is not optional. Every animation needs a still equivalent — including the
  tactile lift, which is a transform like any other. `globals.css` neutralises `interactive`,
  `interactive-flat`, and all keyframe animations under the query.

### Interaction recipe

Two utilities carry every tactile affordance, so the whole product presses the same way and the feel
is a one-line change:

- **`interactive`** — lifts `--lift` (-2px) on hover, settles to 0 on press. For cards and buttons.
- **`interactive-flat`** — same timing, no travel; scales to 0.99 on press. For list rows, nav items,
  and anything where a 2px lift would read as a layout shift.

Every interactive component ships **default, hover, focus-visible, active, disabled, and loading**.
Shipping half of these is shipping an unfinished component.

---

## 6. Logo

The logo ships as PNG masters with SVG wrappers in `public/logo/`. The canonical asset inventory
lives in [brand-assets.md](./brand-assets.md).

- `public/logo/logos/dwelve-logo-horizontal.svg` — default light-surface website logo.
- `public/logo/logos/dwelve-logo-horizontal-dark.svg` — dark surfaces.
- `public/logo/logos/dwelve-logo-icon.svg` — app icons, favicons, compact navigation.

**The mark is a raster image with the violet baked in; CSS cannot recolour it.** This is the reason
violet remains the identity accent. Do not place the light-mode mark on a surface darker than
`--muted`, and do not recolour the wordmark independently of the icon.

Minimum clear space around the mark = the height of the cap.

---

## 7. Application shell

Two columns, no top bar. `src/app/(root)/layout.tsx` is a flex row of `<SideBar>` plus a scrolling
content column; each page owns its own header.

| Region | Surface | Separator |
|---|---|---|
| Canvas | `--background` | — |
| Sidebar (flush-left, full height, 264px) | `--sidebar` | `border-r` hairline |
| Content | transparent over the canvas; panels are `--card` at `shadow-elev-1` | — |

- Content is centred in `max-w-[1180px]` with `px-4 py-6 md:px-8 md:py-8`.
- Below `md` the sidebar collapses to a fixed bottom navigation bar; the content column reserves
  `pb-24`.
- **Nav row state:** active is a soft teal tint (`--accent`) with `--accent-foreground` text at
  `font-semibold`; idle is `--muted-foreground` at `font-normal`; hover shifts colour only. **Weight
  is the state signal, never size** — a size change would reflow the sidebar on every navigation.
- Rows use `interactive-flat`, not `interactive`. A lifting nav row is a layout shift.

---

## 8. Component vocabulary

One component per job. Before building UI, check `src/components/ui`, `src/components/Custom`, and
the route-local `_components` — and prefer extending a primitive over restyling from scratch.

| Primitive | Owns |
|---|---|
| `Surface` | Every card, panel, and bordered container. Padding, variant, elevation, interactive, divided. |
| `Button` | Every button and button-shaped link. Includes `loading`. |
| `Field` | Every form label + hint + error triplet. |
| `Input` / `Textarea` | Every text entry, including the password reveal toggle. |
| `Badge` | Every status pill, count chip, and category tag. |
| `Avatar` | Every initial/photo avatar. |
| `TabBar` | Every tab row, underline or pill. |
| `Segmented` | Small mutually-exclusive choices (theme, language). |
| `ConfirmDialog` | Every destructive confirmation. |
| `MessagePromptDialog` | Every "give a reason" prompt. |
| `PageHeader` | Every page title + subtitle + actions row. |
| `SectionHeader` | Every icon-chip + title + description block inside a panel. |
| `ListRow` | Every icon + title + description + trailing-control row. |
| `PersonRequestRow` | Every pending request from a person, with approve and reject. |
| `RowActionsMenu` | Every trailing overflow menu on a row or card. |
| `EntityHeader` | Every school / class / test header. |
| `CopyButton` | Every copy-to-clipboard control. |
| `Skeleton` / `SkeletonList` / `SkeletonPage` | Every loading state. Never a bare spinner. |
| `EmptyState` / `ResourceStateView` | Every empty, error, and not-found state. |

If the same visual element appears in more than one place, it belongs in one of these. Two call
sites that hard-code different values for "the same" thing is the bug this rule prevents.

**Restyling a duplicate is not consolidating it.** Both request rows were migrated onto `Surface`,
`Avatar`, and `Button` in the v2 pass and still stayed two identical components for a week, because
they looked right — and looked right in the same way. When you touch a component, check whether its
sibling exists before you improve it.

---

## 9. Verifying a change

- `npm run lint` and `npm run build` must pass.
- **`npm run check:contrast` must stay green** after any change to the `:root` / `.dark` blocks.
  It parses `globals.css`, resolves `var()` aliases, and asserts a ratio for every
  foreground/background pair the system relies on, plus hue-separation floors between
  action / success / info. Source: `scripts/check-contrast.mjs`. Add a row to `CHECKS` there when
  you add a token pair the UI depends on.
- Walk the affected routes in **both themes**, at `<768px`, `768–1024px`, and `>1280px`.
- Check Russian and Uzbek Latin for clipping and reflow.
- Emulate `prefers-reduced-motion: reduce` and confirm every new affordance has a still equivalent.
