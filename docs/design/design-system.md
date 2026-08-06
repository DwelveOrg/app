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

**One hue, one system.** Violet is identity *and* action: the logo, the wordmark, the auth panel and
the landing bloom, and also every button, focus ring, selection and active nav row. Separation comes
from luminance and surface, not from a second accent.

> **Changed 4 August 2026 (v3).** This section previously described two accents — violet for identity,
> teal for action — enforced by the rule *"if a violet element is clickable, it is wrong."* That rule
> is **deleted**, not restated. It was policing a split the product's own assets never honoured: the
> logo is a raster with violet baked in and cannot be recoloured by CSS, `HeroScene` was entirely
> violet, and the auth panel is a violet gradient. The split existed in the token file and nowhere
> else. Violet is now both, and there is no rule left to break.
>
> Two consequences are load-bearing:
> - `--brand` and `--primary` are the same value. **Do not re-fork them.**
> - `--info` moved off blue to **cyan**. Violet-as-action and blue-as-informational sit ~24° apart in
>   OKLCH, close enough to confuse a "Submit" with a notice. The hue guard in
>   `scripts/check-contrast.mjs` enforces the gap and will fail the build if it closes again.
>
> Teal is not gone — it was demoted to `--chart-2`, where it survives as data without implying
> "clickable".

### 3.1 Light — cool near-white, near-black ink

Surfaces step **upward** toward the content: the canvas is a cool off-white and cards sit above it in
pure white carrying elevation.

v2 claimed this too, but its step was `#FCFCFA` → `#FFFFFF` = **1.027:1**, roughly a third of a
just-noticeable difference — so the light depth model was carried entirely by border and shadow while
the fill step did nothing. It is **1.071:1** here, close to dark's 1.093:1. The neutrals also moved off
v2's yellow axis (~100°) onto the same hue as the ink (~295°); a warm neutral beside a cool accent is
what made the old near-whites read faintly dingy next to the violet.

| Token | Hex | Role |
|---|---|---|
| `--background` | `#FAFAFB` | Canvas |
| `--card` / `--popover` | `#FFFFFF` | Surfaces above the canvas |
| `--sidebar` | `#F5F5F8` | Second neutral layer |
| `--muted` | `#F1F1F5` | Fills, hover, inputs |
| `--secondary` | `#EFEFF3` | Deeper fill |
| `--foreground` | `#15151B` | Primary text (17.4:1 on canvas) |
| `--muted-foreground` | `#61616A` | Secondary text (5.9:1 on canvas) |
| `--border` / `--input` | `#E2E2E7` | Hairlines |
| `--primary` / `--brand` | `#5F40D5` | Action **and** identity (6.6:1 with white) |
| `--primary-hover` | `#4F32BE` | |
| `--ring` | `#7B5FF0` | Focus only (4.3:1 on canvas) |
| `--accent` | `#EDEEFF` | Selected / active tint |
| `--accent-foreground` | `#4A34AD` | Text on accent |

### 3.2 Dark — violet-leaning near-black

| Token | Hex | Role |
|---|---|---|
| `--background` | `#0B0B0E` | Canvas |
| `--sidebar` | `#0F0F13` | Second neutral layer |
| `--card` | `#15151A` | Surfaces |
| `--popover` | `#1C1C23` | Floating elevation |
| `--muted` / `--secondary` | `#212129` | Fills, hover, inputs |
| `--border` / `--input` | `#2D2C35` | Hairlines |
| `--foreground` | `#EEEDF2` | Primary text (16.9:1) |
| `--muted-foreground` | `#9D9BA8` | Secondary text (7.2:1) |
| `--primary` / `--brand` | `#A191FF` | Action **and** identity (7.5:1 on canvas) |
| `--primary-foreground` | `#15102F` | Deep ink on a luminous fill (7.0:1) |
| `--accent` | `#2D2948` | Selected / active tint |
| `--accent-foreground` | `#C3B8FF` | |

The two themes are **different characters, not inversions**. Light is a cool near-white under
near-black ink; dark is a violet-leaning near-black under a luminous accent. Note the primary inverts
its treatment deliberately — light puts white on a mid violet, dark puts deep ink on a bright one.
Do not "fix" one to match the other.

### 3.3 Semantic

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--success` | `#25793A` | `#5FCB63` | Correct, passed, positive trend |
| `--warning` | `#B45309` | `#F0B23C` | Caution, due soon, needs review |
| `--destructive` | `#BE2E22` | `#FF7A70` | Incorrect, failed, destructive action |
| `--info` | `#00728F` | `#4FC4E0` | Neutral information, integrity notices |

Every light semantic is dark enough to work **both** as a fill under white text and as text on the
canvas (all ≥5:1).

`--success-text` / `--warning-text` / `--destructive-text` / `--info-text` **no longer exist.** They
were plain aliases of the fills kept "so existing call sites keep resolving", and a repo-wide grep
found zero such call sites — 12 lines of token plus 4 gate rows for something nothing referenced.
Use the plain semantic token; it is AA as text.

**Success sits ~150° off the action violet in hue.** That separation is deliberate: in a product that
grades answers, "correct" must never be misread as "clickable". The contrast gate enforces it, and
the violet primary widens the gap that the old teal made narrow (teal→green was ~39°).

Never signal correct/incorrect by colour alone. Pair success/danger with an icon or label — for
colour-blind users and for printed reports.

### 3.4 Charts

Five separable hues, none of them the success green, all ≥3:1 on the card surface. Slot 1 is the
brand violet; teal keeps a home at slot 2 as pure data, which is where it landed when it stopped
being the action colour.

| | Light | Dark |
|---|---|---|
| `--chart-1` | `#5F40D5` violet | `#A191FF` |
| `--chart-2` | `#0E7C86` teal | `#3DD1B8` |
| `--chart-3` | `#B45309` amber | `#F0B23C` |
| `--chart-4` | `#C2317A` rose | `#F2789F` |
| `--chart-5` | `#1D5FD1` blue | `#79A9FF` |

Never place chart-1 (violet) directly next to chart-5 (blue) in a legend or stacked series — under
the monobrand this is the pairing to watch, not chart-2/chart-5 as in v2.

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
