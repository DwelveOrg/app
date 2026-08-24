# Dwelve — Design System

Status: v4 · Last verified: 24 August 2026

This document is the design decision source of truth for Dwelve's frontend. Implementation values
must be kept in sync with `src/app/globals.css`, `src/app/layout.tsx`, and the Tailwind v4 theme
setup. `globals.css` is the canonical implementation; this file is the contract.

`AGENTS.md` and `CLAUDE.md` may summarize this file, but must not duplicate it.

> **Historical changelog — 3 August 2026 (v2).** The single-violet palette became a
> **two-accent system** (violet = identity, teal = action). The deliberately flat shell became a
> **soft-depth** one with a real elevation scale. Added the missing token categories — elevation,
> motion, and type — and consolidated ~30 duplicated components into a shared primitive layer (§8).
> Corrected pre-existing drift: six light-mode brand hexes that disagreed with the shipped CSS, a
> logo asset path that never existed, and a §7.3 top-bar contract for a component that had already
> been removed from the shell.
>
> **The consolidation in §8 is complete**, including `PersonRequestRow`. Every primitive named
> there has consumers, and the duplicates it replaced are deleted. The persistent lesson and cheap
> drift checks are recorded in
> [UI consolidation gotchas](../../.agent-memory/discoveries/ui-consolidation-gotchas.md).

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

| Role              | Font                                                            | Usage                                                                                                                                            |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI / body         | **IBM Plex Sans** (400/500/600/700; latin, latin-ext, cyrillic) | Every interface surface: headings, body, labels, buttons, tables, inputs, student names, user-generated content                                  |
| Figures / meta    | **IBM Plex Mono** (400/500/600; latin, latin-ext, cyrillic)     | Scores, marks, durations, counts, percentages, test codes, timestamps, and the `type-micro` label — via the `numeric` and `type-micro` utilities |
| Marketing display | **IBM Plex Serif** (400/500)                                    | Landing display headings and the auth panel headline only                                                                                        |
| Wordmark          | **Manrope** (700; latin)                                        | The `DwelveLogo` lockup and nothing else                                                                                                         |

Rules:

- **One family, three voices.** Sans, Mono and Serif are one design, so the UI, the figures and the
  display face agree with each other instead of being three unrelated picks. Plex was drawn for
  technical and institutional contexts, which is what this product is.
- **All three carry `cyrillic`**, which is not optional — the UI ships in en / ru / uz. Unlike the
  previous pairing, the display face is no longer Latin-only, so there is no longer a font that must
  be kept away from Russian or Uzbek text.
- **Figures that must line up use `numeric`**, not a bare `tabular-nums`. A column of marks in the UI
  face reads as prose; in mono with tabular figures it reads as data. In a grading product that is
  correctness, not decoration.
- **The wordmark does not follow the UI face.** It is Manrope 700 via `font-wordmark`, because the
  delivered logo artwork is a raster whose lettering CSS cannot restyle — if the wordmark tracked
  `font-sans`, retyping the product would silently redraw the logo. Driven by
  `BRAND_WORDMARK_CLASSES` in `src/constants/brand.ts`.
- Do not introduce Inter, Geist, Montserrat, or DM Sans as competing product fonts.

> **Changed (v4).** This section previously specified **Manrope** for everything plus **DM Serif
> Display** for a single headline, with a standing warning that the serif was Latin-only and must
> never render Cyrillic. Manrope is a soft geometric grotesque — pleasant, ubiquitous, and the
> default warmth that makes an interface read as template rather than as product. The Plex family
> replaces both, adds a mono tier the product never had, and retires the Latin-only hazard.

### Type scale

Eight named styles, implemented as Tailwind v4 `@utility` classes in `globals.css`. **Every heading
in the product is one of these.** Raw `text-[Npx]` in a component is a bug.

| Utility        | Size / line-height / weight                      | Use                                        |
| -------------- | ------------------------------------------------ | ------------------------------------------ |
| `type-display` | `clamp(2.25rem, 5.2vw, 3.5rem)` · 1.04 · 700     | Landing hero only                          |
| `type-title`   | 1.75rem (28px) · 1.18 · 700                      | Page titles                                |
| `type-section` | 1.25rem (20px) · 1.28 · 700                      | Entity headers (a school, a class, a test) |
| `type-heading` | 1.0625rem (17px) · 1.35 · 600                    | Panel and card headings                    |
| `type-body`    | 0.875rem (14px) · 1.6 · 400                      | Body copy                                  |
| `type-label`   | 0.8125rem (13px) · 1.4 · 500                     | Form labels, list-row titles               |
| `type-caption` | 0.75rem (12px) · 1.35 · 400                      | Secondary meta                             |
| `type-micro`   | 0.6875rem (11px) · 1 · 600 · uppercase · +0.06em | Badges, eyebrows, table headers            |

Plus four **size-only** steps in the Tailwind scale, for when a utility's weight and line-height
would be wrong but the size is still needed: `text-3xs` (10px), `text-2xs` (11px), `text-13` (13px),
`text-15` (15px). The last two fill the gaps Tailwind leaves between `text-xs` (12), `text-sm` (14)
and `text-base` (16) — 13px for meta and dense labels, 15px for comfortable reading. Reach for a
`type-*` utility first; these are the escape hatch, not the default.

**`type-display` is the only fluid style.** It is reserved for onboarding/auth identity moments;
routine product headings use the fixed rem scale. A clamped title that shrinks inside a narrow panel
reads as broken, not responsive, and users sit at a steady DPI.

**The two documented exceptions to "no raw sizes".** Both are outside the product type system by
intent, and there are no others:

- **Identity display** — the auth composition sets its own display size. It is a one-off
  composition, not a product type scale.
- **The wordmark** — 22px, set in `BRAND_WORDMARK_CLASSES` (`src/constants/brand.ts`), because it is
  a lockup measurement against the 36px mark rather than a typographic choice.

Cap body prose at 65–75ch. Tables and dense data may run wider.

### Font implementation

`src/app/layout.tsx` loads both families through `next/font/google` and exposes them as
`--font-dwelve-sans` / `--font-dwelve-serif`, mapped to `--font-sans` / `--font-serif` in the
`@theme inline` block.

---

## 3. Colour system

**Two jobs, split.** `--primary` is **ink** — what you press: buttons, selected rows, checked boxes,
active tabs. `--brand` is **violet** — who this is: the mark, the auth panel, the closing band, the
focus ring. Colour beyond that means _state_ (success / warning / destructive) or _data_ (the chart
ramp), and nothing else.

> **Changed (v4).** v3 made violet identity _and_ action — "one hue does everything". What that
> produced was a product where every affordance on every screen was the brand colour, and a screen
> where everything is emphasised is a screen where nothing is. It also put the loudest hue in the
> palette on the most repeated element in the interface.
>
> v3 was right about what it was reacting to: v2's violet/teal split ("if a violet element is
> clickable, it is wrong") policed a rule the assets never honoured, and deleting it was correct.
> The mistake was concluding that one hue should do both jobs, rather than that the **action colour
> should stop being a hue at all**.
>
> Consequences that are load-bearing:
>
> - `--brand` and `--primary` are **now different and must stay different.** v3's note here said the
>   opposite; code that assumes they are equal predates v4.
> - A near-black primary is a position, not a retreat to greyscale. It makes the button read as the
>   object you act on, and it frees the violet to mean something when it does appear.
> - `--info` stays **cyan**. v3 moved it off blue because a violet _action_ sat too close to a blue
>   notice. The action is neutral now, but `--brand` is still violet and still appears beside
>   notices, so the gap is still wanted — the hue guards in `scripts/check-contrast.mjs` now measure
>   it from `--brand` rather than `--primary`. (Measuring from `--primary` would have silently
>   passed forever, because a neutral has no hue to guard.)
>
> Teal is not gone — it lives at `--chart-2`, where it survives as data without implying
> "clickable".

### 3.1 Light — cool near-white, near-black ink

Surfaces step **upward** toward the content: the canvas is a cool off-white and cards sit above it in
pure white carrying elevation.

v2 claimed this too, but its step was `#FCFCFA` → `#FFFFFF` = **1.027:1**, roughly a third of a
just-noticeable difference — so the light depth model was carried entirely by border and shadow while
the fill step did nothing. It is **1.071:1** here, close to dark's 1.093:1. The neutrals also moved off
v2's yellow axis (~100°) onto the same hue as the ink (~295°); a warm neutral beside a cool accent is
what made the old near-whites read faintly dingy next to the violet.

| Token                  | Hex       | Role                                 |
| ---------------------- | --------- | ------------------------------------ |
| `--background`         | `#FAFAFB` | Canvas                               |
| `--card` / `--popover` | `#FFFFFF` | Surfaces above the canvas            |
| `--sidebar`            | `#F5F5F8` | Second neutral layer                 |
| `--muted`              | `#F1F1F5` | Fills, hover, inputs                 |
| `--secondary`          | `#EFEFF3` | Deeper fill                          |
| `--foreground`         | `#15151B` | Primary text (17.4:1 on canvas)      |
| `--muted-foreground`   | `#61616A` | Secondary text (5.9:1 on canvas)     |
| `--border` / `--input` | `#E2E2E7` | Hairlines                            |
| `--primary`            | `#16161A` | Action ink (white foreground, ~17:1) |
| `--primary-hover`      | `#33333D` | Action hover                         |
| `--primary-foreground` | `#FFFFFF` | Text on action                       |
| `--brand` / `--ring`   | `#5F40D5` | Identity and focus                   |
| `--accent`             | `#EDEBFB` | Selected / active tint               |
| `--accent-foreground`  | `#4A34AD` | Text on accent                       |

### 3.2 Dark — violet-leaning near-black

| Token                     | Hex       | Role                           |
| ------------------------- | --------- | ------------------------------ |
| `--background`            | `#0B0B0E` | Canvas                         |
| `--sidebar`               | `#0F0F13` | Second neutral layer           |
| `--card`                  | `#15151A` | Surfaces                       |
| `--popover`               | `#1C1C23` | Floating elevation             |
| `--muted` / `--secondary` | `#212129` | Fills, hover, inputs           |
| `--border` / `--input`    | `#2D2C35` | Hairlines                      |
| `--foreground`            | `#EEEDF2` | Primary text (16.9:1)          |
| `--muted-foreground`      | `#9D9BA8` | Secondary text (7.2:1)         |
| `--primary`               | `#EDECF2` | Action bone on the dark canvas |
| `--primary-hover`         | `#FFFFFF` | Action hover                   |
| `--primary-foreground`    | `#121217` | Deep ink on the action fill    |
| `--brand` / `--ring`      | `#A191FF` | Identity and focus             |
| `--accent`                | `#262238` | Selected / active tint         |
| `--accent-foreground`     | `#C3B8FF` | Text on accent                 |

The two themes are **different characters, not mechanical inversions**. Light uses near-black action
ink with white text; dark uses a bone action fill with deep text. Brand/focus stays violet in both.
Do not collapse `--primary` and `--brand` back into one token.

### 3.3 Semantic

| Token           | Light     | Dark      | Meaning                                |
| --------------- | --------- | --------- | -------------------------------------- |
| `--success`     | `#25793A` | `#5FCB63` | Correct, passed, positive trend        |
| `--warning`     | `#B45309` | `#F0B23C` | Caution, due soon, needs review        |
| `--destructive` | `#BE2E22` | `#FF7A70` | Incorrect, failed, destructive action  |
| `--info`        | `#00728F` | `#4FC4E0` | Neutral information, integrity notices |

Every light semantic is dark enough to work **both** as a fill under white text and as text on the
canvas (all ≥5:1).

`--success-text` / `--warning-text` / `--destructive-text` / `--info-text` **no longer exist.** They
were plain aliases of the fills kept "so existing call sites keep resolving", and a repo-wide grep
found zero such call sites — 12 lines of token plus 4 gate rows for something nothing referenced.
Use the plain semantic token; it is AA as text.

Action is deliberately neutral, so "correct" cannot be mistaken for "clickable" by sharing a hue.
The contrast gate also preserves separation between brand violet, semantic success, and cyan info.

Never signal correct/incorrect by colour alone. Pair success/danger with an icon or label — for
colour-blind users and for printed reports.

### 3.4 Charts

Five separable hues, none of them the success green, all ≥3:1 on the card surface. Slot 1 is the
brand violet; teal keeps a home at slot 2 as pure data, which is where it landed when it stopped
being the action colour. The set passes a six-check palette gate (OKLCH lightness band, chroma
floor, CVD ΔE, normal-vision ΔE, contrast vs card) per theme — retune the five together, never one
in isolation.

|             | Light (mark & ink) | Dark mark | Dark ink  |
| ----------- | ------------------ | --------- | --------- |
| `--chart-1` | `#5F40D5` violet   | `#8E7EEA` | `#A191FF` |
| `--chart-2` | `#007E9D` teal     | `#00A892` | `#3DD1B8` |
| `--chart-3` | `#B45309` amber    | `#BC850B` | `#F0B23C` |
| `--chart-4` | `#C2317A` rose     | `#DA638A` | `#F2789F` |
| `--chart-5` | `#1D5FD1` blue     | `#618FE3` | `#79A9FF` |

Teal sits at `#007E9D` because sRGB cannot reach the gate's chroma floor at the old hue angle —
the hue leans ~20° toward cyan, the nearest in-gamut point where it stops greying out. In dark,
marks and ink split into separate literals the way light always had them: fills sit inside the
dark lightness band so five bars do not bloom on a near-black canvas, while `--chart-N-ink` keeps
the brighter step that an 11px label on a dark tint needs.

Never place chart-1 (violet) directly next to chart-5 (blue) in a legend or stacked series — this is
the pairing to watch, not chart-2/chart-5 as in v2.

**Charts read from this ramp, never from `--primary`.** Action color does not encode a data series;
a chart is not an affordance.

### 3.5 Accessibility gate

Body text ≥4.5:1. Large (≥24px, or ≥18.66px bold) and UI boundaries ≥3:1. Note that a 14px semibold
button label is **normal** text under WCAG, not large — this is why `--primary` is as deep as it is.

The palette is machine-checked. Any change to the `:root` / `.dark` blocks must keep the contrast
gate green (see §9).

---

## 4. Elevation

Structure comes from two things: a **hairline** defines an edge, **elevation** separates a layer.

The ramp is split by **kind**, not by degree:

| Token          | Utility             | Use                                                                 |
| -------------- | ------------------- | ------------------------------------------------------------------- |
| `--elev-1`     | `shadow-elev-1`     | Resting cards, panels, list surfaces — most of a page. Nearly flat. |
| `--elev-2`     | `shadow-elev-2`     | Resting, slightly forward: sticky chrome, raised tiles              |
| `--elev-3`     | `shadow-elev-3`     | **Floating:** dropdowns, popovers, sticky action bars               |
| `--elev-4`     | `shadow-elev-4`     | **Floating:** dialogs, toasts, sheets                               |
| `--elev-brand` | `shadow-elev-brand` | Alias of `--elev-2`. Kept so existing call sites resolve.           |

Rules:

- **The gap between 2 and 3 is a cliff, not a step.** It is the line between "on the page" and "over
  the page" and should be legible at a glance. Levels 1–2 are nearly flat; the hairline draws the
  panel and a single contact pixel keeps it off the canvas. Only 3–4 genuinely cast.
- **Hover does not change elevation.** A resting card that gains a shadow on hover is the old model;
  hover is carried by the border and the fill now. See §5.
- **`--elev-brand` is no longer a coloured glow.** A violet halo under a violet button is light with
  no source — it is what made the old CTA read as a sticker. It resolves to `--elev-2`.
- **Light shadows are tinted with the violet-leaning ink (`20 18 30`), not a neutral slate.** A
  shadow that disagrees with its surface temperature reads as grime.
- **Dark elevation is a shadow _plus_ a top inner hairline.** Cast shadows barely register on a
  near-black canvas; the `inset 0 1px 0 rgb(255 255 255 / …)` highlight edge is what actually makes
  a dark panel look raised.
- **Levels are earned.** Most of a page lives at elevation 1. Two adjacent panels at different
  levels means one of them is wrong.
- **Never nest cards.** A bordered box inside a bordered box is a hierarchy failure. Use elevation
  for the outer container and dividers or insets inside it.
- Raw `shadow-[…]` in a component is a bug.

### Worked example: a three-level tree

The test builder is the deepest hierarchy in the product — section → question group → question — and
it is the reference for how to render one **without** three nested boxes:

- The **section** is the only card: one `Surface` at elevation 1.
- A **group** is a full-bleed band inside that card. It cancels the surface padding
  (`-mx-5 sm:-mx-6`) and separates itself with a `border-t` hairline, so the rule reads as a
  division of the section rather than the top of another box.
- A **question** is a flat row in a `divide-y` list. It carries no border, no ring, and no
  `interactive` treatment — a row of form inputs is not clickable and must not look it.
- **Only the invalid state draws an edge.** A question a publish check flagged gets the ring, which
  is what makes it findable; if everything is boxed, nothing is.

The three levels are three weights of the same idea — card edge, band rule, row rule — so hierarchy
comes from rhythm instead of from three competing borders at three competing radii.

---

## 5. Motion

| Token              | Value                          | Use                                   |
| ------------------ | ------------------------------ | ------------------------------------- |
| `--dur-1`          | 120ms                          | Colour and state                      |
| `--dur-2`          | 180ms                          | Hover, press                          |
| `--dur-3`          | 260ms                          | Enter, exit, accordion, page entrance |
| `--dur-4`          | 360ms                          | Genuine layout moves                  |
| `--ease-out-quint` | `cubic-bezier(.22, 1, .36, 1)` | Default (`ease-out-quint`)            |
| `--ease-out-expo`  | `cubic-bezier(.16, 1, .3, 1)`  | Longer reveals (`ease-out-expo`)      |

- Motion conveys **state**, not personality. State change, feedback, loading, reveal — nothing else.
- No page-load choreography. The app loads into a task.
- Ease out. No bounce, no elastic.
- `prefers-reduced-motion` is not optional. Every animation needs a still equivalent. `globals.css`
  neutralises `interactive`, `interactive-flat`, and all keyframe animations under the query. (There
  is less to neutralise than there was: hover no longer travels, so the reduced-motion screen and the
  default screen are now the same screen for most surfaces.)

### Interaction recipe

Two utilities carry every tactile affordance, so the whole product presses the same way and the feel
is a one-line change:

- **`interactive`** — hover shifts colour and border; `:active` translates by `--lift`. For cards
  and buttons.
- **`interactive-flat`** — same timing; `:active` scales to 0.99 instead. For list rows, nav items,
  tabs.

**`--lift` is `0`.** It used to be `-2px` on hover, so moving a pointer across a dashboard made the
page twitch card by card — and 2px is below the threshold where travel reads as intent rather than
as instability. Hover is now carried by the hairline going to an ink edge and the fill stepping one
notch, which is a change you can see on a still screen. The token is kept rather than the rule
deleted, so re-enabling travel stays a one-line change. With `--lift: 0` the two utilities differ
only in their press response.

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

| Region                                   | Surface                                                             | Separator           |
| ---------------------------------------- | ------------------------------------------------------------------- | ------------------- |
| Canvas                                   | `--background`                                                      | —                   |
| Sidebar (flush-left, full height, 264px) | `--sidebar`                                                         | `border-r` hairline |
| Content                                  | transparent over the canvas; panels are `--card` at `shadow-elev-1` | —                   |

- Content is centred in `max-w-[1180px]` with `px-4 py-6 md:px-8 md:py-8`.
- Below `md` the sidebar collapses to a fixed bottom navigation bar; the content column reserves
  `pb-24`.
- **Nav row state:** active is an 8% wash of `--foreground` with `--foreground` text at
  `font-semibold` and an ink left rail; idle is `--muted-foreground` at `font-normal`; hover shifts
  colour only. **Weight is the state signal, never size** — a size change would reflow the sidebar on
  every navigation. (This read "a soft teal tint" through v2 and a `--primary` wash under
  `--accent-foreground` through v3; the latter rendered violet type on a grey fill once action moved
  to ink. Selection reads by value, and nothing on the row disagrees with anything else on it.)
- Rows use `interactive-flat`, not `interactive`.

---

## 8. Component vocabulary

One component per job. Before building UI, check `src/components/ui`, `src/components/Custom`, and
the route-local `_components` — and prefer extending a primitive over restyling from scratch.

> **Props, variants, and per-component rules live in [component-library.md](./component-library.md).**
> The table below is the vocabulary at a glance; that file is the reference, and its §2 decision
> table answers "which component do I use for this". Page-level composition —
> environments, page anatomy, widths, responsive — is in
> [layout-and-composition.md](./layout-and-composition.md).

| Primitive                                    | Owns                                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `Surface`                                    | Every card, panel, and bordered container. Padding, variant, elevation, interactive, divided. |
| `Button`                                     | Every button and button-shaped link. Includes `loading`.                                      |
| `Field`                                      | Every form label + hint + error triplet.                                                      |
| `Input` / `Textarea`                         | Every text entry, including the password reveal toggle.                                       |
| `Badge`                                      | Every status pill, count chip, and category tag.                                              |
| `Avatar`                                     | Every initial/photo avatar.                                                                   |
| `TabBar`                                     | Every tab row, underline or pill.                                                             |
| `Segmented`                                  | Small mutually-exclusive choices (theme, language).                                           |
| `ConfirmDialog`                              | Every destructive confirmation.                                                               |
| `MessagePromptDialog`                        | Every "give a reason" prompt.                                                                 |
| `PageHeader`                                 | Every page title + subtitle + actions row.                                                    |
| `BackLink`                                   | Every "up one level" link above a detail page's header.                                       |
| `SectionHeader`                              | Every icon-chip + title + description block inside a panel.                                   |
| `FactGrid` / `Fact`                          | Every labelled facts row under an entity header.                                              |
| `ListRow`                                    | Every icon + title + description + trailing-control row.                                      |
| `PersonRequestRow`                           | Every pending request from a person, with approve and reject.                                 |
| `RowActionsMenu`                             | Every trailing overflow menu on a row or card.                                                |
| `EntityHeader`                               | Every school / class / test header.                                                           |
| `CopyButton`                                 | Every copy-to-clipboard control.                                                              |
| `Skeleton` / `SkeletonList` / `SkeletonPage` | Every loading state. Never a bare spinner.                                                    |
| `EmptyState` / `ResourceStateView`           | Every empty, error, and not-found state.                                                      |

If the same visual element appears in more than one place, it belongs in one of these. Two call
sites that hard-code different values for "the same" thing is the bug this rule prevents.

**Restyling a duplicate is not consolidating it.** Both request rows were migrated onto `Surface`,
`Avatar`, and `Button` in the v2 pass and still stayed two identical components for a week, because
they looked right — and looked right in the same way. When you touch a component, check whether its
sibling exists before you improve it.

---

## 9. Verifying a change

The full checklist, including the drift greps, is in
[../guides/building-a-feature.md](../guides/building-a-feature.md) §6. The design-specific gates:

- `npm run lint` and `npm run build` must pass.
- **`npm run check:contrast` must stay green** after any change to the `:root` / `.dark` blocks.
  It parses `globals.css`, resolves `var()` aliases, and asserts a ratio for every
  foreground/background pair the system relies on, plus hue-separation floors between
  action / success / info. Source: `scripts/check-contrast.mjs`. Add a row to `CHECKS` there when
  you add a token pair the UI depends on.
- Walk the affected routes in **both themes**, at `<768px`, `768–1024px`, and `>1280px`.
- Check Russian and Uzbek Latin for clipping and reflow.
- Emulate `prefers-reduced-motion: reduce` and confirm every new affordance has a still equivalent.
