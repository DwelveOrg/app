# Dwelve — Accessibility

Status: v1 · Last updated: 11 August 2026

The accessibility contract for the Dwelve frontend: what every change must hold, how the primitives
already implement it, and what a new component has to ship.

This is not a compliance appendix. Dwelve is used by students under exam conditions and by teachers
doing hours of data entry — a missing focus ring or an unannounced loading region is a person unable
to finish a test.

**Related:** [design-system.md](./design-system.md) §3.5 (contrast gate), §5 (reduced motion) ·
[component-library.md](./component-library.md) · [interaction-and-states.md](./interaction-and-states.md)

---

## 1. The bar

**WCAG 2.1 AA.** Concretely:

| Requirement | Threshold |
|---|---|
| Body text contrast | ≥ 4.5:1 |
| Large text (≥24px, or ≥18.66px bold) | ≥ 3:1 |
| UI boundaries, icons, focus indicators | ≥ 3:1 |
| Everything operable by keyboard | no exceptions |
| Reduced-motion equivalent | every animation |
| Colour never the only signal | every status |

A 14px semibold button label is **normal** text under WCAG, not large. This is why `--primary` is as
deep as it is, and why a lighter "nicer" violet fails.

---

## 2. Colour

### The gate

The palette is machine-checked. `npm run check:contrast` parses `globals.css`, resolves `var()`
aliases, and asserts a ratio for every foreground/background pair the system relies on, plus
hue-separation floors between action / success / info.

**Any change to the `:root` or `.dark` blocks must keep it green.** When you add a token pair the UI
depends on, add a row to `CHECKS` in `scripts/check-contrast.mjs`. A pair the gate doesn't know about
is a pair nothing is checking.

The hue guards are not cosmetic:

- **Success sits ~150° off the action violet.** In a product that grades answers, "correct" must
  never be misread as "clickable".
- **`--info` is cyan, not blue.** Violet-as-action and blue-as-informational sit ~24° apart in OKLCH
  — close enough to confuse a "Submit" with a notice. Cyan opens that to ~75°.

### Colour is never the only signal

Every status pairs colour with an icon or a word:

- `SaveState` and `SaveIndicator` give each state its own icon *and* wording, so "unsaved" survives
  a greyscale screenshot and a colour-blind reader.
- Correct/incorrect marks in the paper renderer carry a symbol, not just a fill — this also matters
  for printed report cards.
- `Badge` variants carry text; a bare coloured dot is not a status.

### Seeded colour

`Avatar tint="seeded"` and `classAccent()` use the chart ramp's `-tint` / `-ink` pairs, not the raw
ramp over a wash of itself. The raw ramp is tuned to be a legible **mark** (3:1); these render 11px
bold initials, which WCAG counts as normal text, and three of five slots landed at 4.0–4.2:1 in
light. The gate asserts all ten pairs at 4.5:1.

---

## 3. Keyboard

Everything interactive is reachable and operable from the keyboard, in a sensible order.

- **Never `tabIndex={-1}` on a control that does something.** The password reveal toggle carried it
  once, making "show password" mouse-only across login, signup, reset, and change-password — a WCAG
  2.1.1 failure on every password field in the product.
- **Never remove a focus indicator.** `outline-none` is only ever paired with an explicit
  `focus-visible:ring-*`. Sidebar rows additionally carry `ring-offset-sidebar` so the ring reads
  against the tinted surface.
- **Use the right element.** A `<div onClick>` is not a button. `Button asChild` wraps a `<Link>`
  when the thing navigates; a real `<button>` when it acts.
- **Radix owns the hard parts** — menus, dialogs, selects, tabs, accordions bring focus trapping,
  roving tabindex, arrow keys, and escape. That is why the wrappers exist; don't hand-roll them.
- **Drag has a keyboard path.** `SortableList` ships `KeyboardSensor` +
  `sortableKeyboardCoordinates`: space to lift, arrows to move, space to drop, escape to cancel. And
  **every sortable row keeps its up/down buttons** — the handle is the fast path, not the only one,
  because buttons carry discoverability and don't require a sustained drag.
- **Tab order follows visual order.** `flex-col-reverse` in dialog footers changes visual order at
  small widths but keeps DOM order, so cancel stays before submit in the tab sequence.

---

## 4. Focus management

- **Dialogs**: Radix returns focus to the trigger on close. Don't fight it.
- **Menus that open dialogs**: pass `keepOpen: true` on the `RowAction`. Closing the menu in the same
  tick moves focus while the dialog is mounting, and focus lands back on the trigger instead of in
  the dialog.
- **Destructive confirms**: `ConfirmDialog` suppresses Radix's auto-close on confirm, so focus stays
  put while the mutation runs rather than jumping mid-flight.
- **Route changes**: the shell's `layout-enter` animates the content column; it does not move focus.
  If you add an in-page view swap that replaces the main content, move focus to the new heading.

---

## 5. Semantics and ARIA

The rule is **use the element, then add ARIA only for what the element can't say.**

What the primitives already do — match this when you build:

| Component | Semantics |
|---|---|
| `PageHeader` | `<header>` + `<h1 class="type-title">` |
| `SectionHeader` | `<h2 class="type-heading">` |
| `EntityHeader` | `<section aria-labelledby>` + `<h1 class="type-section">` |
| `FactGrid` / `Fact` | `<dl>` / `<dt>` / `<dd>` — these are definitions, not a generic grid |
| `Field` | `<label for>`, `role="alert"` on the error, `aria-describedby` wired to hint or error |
| `Button` | `aria-busy` while loading; `disabled` set for you |
| `Badge` | decorative counts inside another control are `aria-hidden` |
| `Avatar` | `aria-hidden` when it renders initials (the name is already in the row); `alt` when it renders an image |
| `TabBar` | `<nav aria-label>`; `role="tab"` + `aria-selected` for state tabs, `aria-current="page"` for link tabs |
| `Segmented` | `role="radiogroup"` / `role="radio"` / `aria-checked` |
| `Sidebar` | `aria-current="page"`, `aria-disabled` on locked rows |
| `Skeleton` | `aria-hidden` blocks inside an `aria-busy` region |
| `Dialog` | Radix `Title` / `Description` wired to the content |
| `RowActionsMenu` | trigger label includes the subject — "Actions for Aziza", not "Actions" |
| `Input` password toggle | `aria-label` + `aria-pressed` |

Heading order: one `<h1>` per page (`PageHeader` or `EntityHeader`), `<h2>` for panels
(`SectionHeader`), and don't skip levels to get a size — the size comes from a `type-*` utility, not
from the tag.

**Icon-only controls need an accessible name.** `aria-label` on the control, `aria-hidden` on the
icon. Include the subject where there are many of the same control on one screen.

**Loading regions must be announced.** `aria-busy` goes on the region, not the blocks —
`SkeletonList` and `SkeletonPage` do it for you. A page of `aria-hidden` skeletons with no busy
region tells a screen reader absolutely nothing.

---

## 6. Motion

`prefers-reduced-motion` is not optional. The specific failure being guarded against: a student with
vestibular sensitivity should not have the exam paper slide sideways every time they answer a
question.

- `globals.css` neutralises `layout-enter`, both accordion animations, `mock-shimmer`, the landing
  marquee, and the `interactive` / `interactive-flat` press transforms. **A press transform is a
  transform like any other.** There is less to neutralise than there was — `--lift` is `0`, so hover
  no longer travels for anyone, and the ambient orbs that used to drift behind every authenticated
  page are gone rather than merely paused.
- For `motion` components use `useReducedMotion()` with `motionVariants()`, `motionTransition()`, or
  `stillVariants` from `@/lib/motion`. The still set reaches the same end state instantly, so content
  still arrives — it just arrives at once.
- Spinners carry `motion-reduce:animate-none`.
- Emulate `prefers-reduced-motion: reduce` before shipping any new affordance and confirm the still
  equivalent leaves the UI in its final state (opacity 1, `transform: none`), not hidden.

---

## 7. Language and text

Dwelve ships in Uzbek Latin, Russian, and English, and that is an accessibility constraint as much as
a content one.

- `<html lang>` is kept in sync with the active language by `providers.tsx`, so screen readers switch
  pronunciation.
- **Titles wrap, they don't truncate.** `PageHeader` and `EntityHeader` deliberately omit `truncate`:
  Russian and Uzbek run considerably longer than English and a clipped school name loses meaning.
  `Fact` values *do* truncate, because they are short values in fixed-width tiles.
- Text must survive 200% zoom and reflow without horizontal scrolling.
- The whole IBM Plex family in use here — Sans, Mono and Serif — carries latin, latin-ext, and
  cyrillic, so no face in the product has a coverage hazard. (The previous pairing did: DM Serif
  Display was Latin-only and had to be kept away from Russian and Uzbek.) Manrope is loaded only for
  the wordmark and renders exactly one Latin string.
- Use the turned comma U+02BB `ʻ` for Uzbek `oʻ` / `gʻ`, never a straight apostrophe.

Full rules: [content-and-i18n.md](./content-and-i18n.md).

---

## 8. Exam-specific

The exam room has accessibility requirements the rest of the product doesn't, because the cost of
getting it wrong is a lost attempt rather than a lost click.

- **A browser capability must never lock a student out.** Fullscreen is requested from the trusted
  Start/Resume gesture. A refreshed attempt pauses behind a keyboard-trapped retry dialog. If the
  API is unavailable the attempt proceeds; if a trusted retry is rejected, an explicit continue
  path appears. Losing a precaution is a better outcome than losing an exam.
- **The timer must be perceivable without colour**, and must not rely on an animation.
- **Question navigation is directional on purpose** (`paperTurnVariants`) — but the reduced-motion
  path must still make the change obvious, so the state and the navigator update regardless.
- **Never trap a student.** Integrity overlays must state what happened and what to do next.

---

## 9. Verifying

Before shipping any UI change:

- [ ] `npm run check:contrast` green (mandatory after any `:root` / `.dark` edit)
- [ ] Tab through the whole screen — every control reachable, ring always visible, order sensible
- [ ] Operate the new control with keyboard only
- [ ] Both themes
- [ ] `en` / `ru` / `uz` — no clipping, no overflow
- [ ] 375 / 834 / 1440 — no horizontal page scroll
- [ ] `prefers-reduced-motion: reduce` emulated — every affordance has a still equivalent
- [ ] Icon-only controls have accessible names
- [ ] Loading regions carry `aria-busy`
- [ ] No status communicated by colour alone

The contrast gate is the only automated check here. Everything else is a walk, and the walk is not
optional — lint, `tsc`, and `build` have all passed on trees with real accessibility defects in them.
