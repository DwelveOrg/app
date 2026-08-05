# Redesign v2 — remaining work

Branch: `redesign/design-system-v2` · Written: 4 August 2026 · **Last revised: 4 August 2026**

The v2 redesign (see [design-system.md](./design-system.md)) landed the token layer, the shell, the
dashboard, auth, landing, and the component consolidation. This file tracks what is genuinely left.

Gates, all re-run against the current tree: `npm run lint`, `npm run build`,
`npx tsc --noEmit`, and `npm run check:contrast` pass. All 34 route/theme combinations render with
no horizontal overflow.

> **Correction (4 August 2026).** An earlier revision of this file claimed every priority was
> implemented. A subsequent audit against the code found five items that were not — one primitive
> from the plan that was never built, one that was copied instead of promoted, one prop that was
> nearly unadopted, and two token migrations left half-done. All five are now closed and recorded
> below. The lesson is in the last section: passing lint, build, and the contrast gate says nothing
> about whether the consolidation actually happened, because duplication is not a compile error.

---

## Priority 1 — primitives that existed with zero consumers · done

### 1.1 `ListRow` — was 0 consumers

The three settings sections (`PreferencesSection`, `SecuritySection`, `SupportSection`) use
`ListRow`. `SettingsRow.tsx` and the unused `layout/Row/` are deleted. The `comingSoon` string moved
to the caller via `soonLabel`, so no catalog change.

### 1.2 `Avatar` — was 0 consumers

All six render sites migrated. Both local `Avatar` functions and both local `getInitials` copies are
gone; `getInitials` in `src/lib/utils.ts` is the only one.

Two defects surfaced and were fixed while wiring it up:

- `Avatar` used `next/image`, but `next.config.ts` deliberately allows **no** remote image hosts
  (`remotePatterns: []`). Any real backend avatar URL — or the `blob:` preview during upload —
  would have been rejected by the optimizer at runtime. It now uses a plain `<img>`, which is what
  all six hand-rolled call sites were already doing, with the reason recorded in the file.
- `tint="seeded"` mixed the raw chart ramp over its own wash. That is fine for a *mark* (the gate
  holds the ramp to 3:1) but these initials are 11px bold — normal text by WCAG — and three of the
  five slots landed at 4.0–4.2:1 in light. See the token note below.

Added a `2xl` size for the profile card, which needed 80px.

### 1.3 `CopyButton` — was 0 consumers

All four sites migrated (`JoinCodeChip`, `InviteTeacherDialog`, `AddStudentsDialog`, and the setup
checklist in `DashboardComposer`). `navigator.clipboard` appears exactly once in `src`.

Two props were added so nothing was silently dropped: `onError` (all four sites toast on clipboard
failure, which the primitive previously swallowed) and `icon` (the setup checklist shares a code and
uses `Share2`, not `Copy`).

### 1.4 `SkeletonList` / `SkeletonPage` — was 0 consumers

All four `loading.tsx` files use `SkeletonPage`; the four inline `animate-pulse` blocks are gone.
`SessionsPanel`'s bare spinner — the one panel in the product that loaded differently from every
other list — is now `SkeletonList` too. The only `animate-pulse` left in `src` is the live-status dot
in `AuthVisualParts.tsx`, which is not a skeleton.

`SkeletonPage` gained an `actions` count so the tests page does not grow a phantom second button, and
`SkeletonList` carries its own `aria-busy` — its blocks are `aria-hidden`, so without it a screen
reader was told nothing at all during load.

---

## Priority 2 — primitives that were never built · done

| Component | Home | Status |
|---|---|---|
| `RowActionsMenu` | `src/components/ui/` | Both roster tabs and `groups/_components/ClassCard.tsx` migrated. `destructive` is a flag, not a caller-supplied class, so the danger treatment can't be half-applied. |
| `ResourceStateView` | `src/app/(root)/_components/` | `ClassStateView.tsx` and `TestsStateView.tsx` deleted, six call sites migrated. Takes i18n **keys**, not rendered strings — every caller is a server component with no `t` in scope. |
| `EntityHeader` | `src/app/(root)/_components/` | `SchoolProfileHeader` and the header inside `ClassDetailView` both route through it. Status pills are now `Badge`. |
| `OnboardingActions` | `src/app/(root)/_components/` | `NoMembershipState` and `SelectedSchoolCard` migrated; `variant="full" \| "compact"` covers the density difference the two had drifted into. |
| `ClassEntityCard` | `groups/_components/` | `StudentClassCard` and `TeacherClassCard` keep their own *decisions* (the backend flags genuinely differ) but share the shell and the pending / locked / rejected action blocks. |
| **`PersonRequestRow`** | `src/app/(root)/_components/` | **Was missed entirely in the first pass.** See below. |

### `PersonRequestRow` — the one that was missed

`ClassJoinRequestRow.tsx` (students) and a local `RequestRow` inside `ClassTeacherRequestsList.tsx`
(teachers) were character-for-character identical apart from the field the person was read out of
(`request.student` vs `request.teacher`) and the i18n namespace the labels came from. Both had been
*restyled* onto `Surface` / `Avatar` / `Button`, which is why the duplication survived a visual
review — the two rows looked right, and looked right in the same way.

`PersonRequestRow` now owns the row. Each caller keeps a short adapter that unwraps its own domain
object and supplies its own labels, because that difference is real and belongs to the caller.

---

## Priority 3 — class-level migrations · done

### 3.1 `Surface` — 41 files → 11

The remaining 11 are deliberate: the four fixed-position modal contents (`Dialog`, `alert-dialog`,
`RedeemInviteDialog`, `JoinSchoolDialog`), two `<input>` elements, the decorative `Empty/Artwork`,
and `Surface.tsx` itself.

Landing sections that are `motion` elements use the exported `surfaceVariants()` rather than the
component, so the treatment is still single-sourced.

**`Surface` was not actually polymorphic.** It advertised an `as` prop but typed its props against
`"div"`, so `<Surface as="form">` could not accept `onSubmit`. It is now generic in `as`.

### 3.2 `PageHeader`

`DashboardHeader` and `NotificationsHeader` are now `<PageHeader title subtitle actions />`. The
notifications "mark all read" control became a real `Button variant="outline"` instead of a
hand-rolled one.

### 3.3 Badge

Nine inline pill sites migrated across settings, profile, school, groups, tests, and sessions.

### 3.4 `Field` — was copied, not promoted

The plan said to promote the test builder's local `Field`. What actually happened the first time was
a *copy*: `components/ui/Field.tsx` was created and `editors/fields.tsx` kept its own 231-line
version, so the codebase gained a second Field instead of losing one — the exact two-vocabulary
problem the exercise existed to end. Meanwhile 41 hand-written `<label>` elements were untouched.

Now:

- The local `Field` is deleted. `editors/fields.tsx` re-exports the shared one so the editors'
  `from "./fields"` imports keep working.
- `size` drives the message treatment as well as the label, so the builder keeps its density instead
  of inheriting standalone-form spacing.
- The label string `mb-1.5 block text-sm font-medium text-foreground` is **gone from `src`** — 22
  blocks converted by codemod, 9 more by hand where the label carried `htmlFor` or a custom row.
- Every `mt-1.5 text-xs text-destructive` error paragraph is gone; those messages are now the
  `error` prop, which also gives them `role="alert"` and `aria-describedby` that the hand-written
  versions never had. Where a form alternated error-or-hint with a ternary over two near-identical
  paragraphs, that is now `error` + `hint` on one component.
- `Field` went from 2 consumers to 20.

The 6 `<label>` elements left in `src` are correct: clickable radio/switch cards, `ImagePicker`'s own
label-plus-hint row, `Field`'s own label, and the login password row — which keeps a hand-built
header because its "forgot password?" link must not be nested inside a `<label>` that would steal the
click meant to focus the input.

### 3.5 `Button`'s `loading` prop — was built but unusable for most callers

`loading` was documented as swapping the leading content for a spinner. It did not — it *prepended*
one. So any button with a leading icon could not adopt it without still hand-writing
`{pending ? <Spinner/> : <Check/>}`, which is why 27 sites still did exactly that while `loading=`
had 8 users.

The primitive now hides non-spinner icons in CSS while loading, which is what the doc comment always
claimed. With that fixed the migration is mechanical: **27 inline spinner sites → 2**, and `loading=`
went from 8 uses to 32. Five of those sites were raw `<button>` elements re-implementing the primary
and outline button styles by hand; they are `Button` now.

The 2 remaining spinners are correct — the landing page's fake "generating" mock, and
`GoogleAuthButton`'s placeholder while Google's script loads. Neither is a button in a pending state.

### 3.6 Micro-type and the size scale

Every `text-[11px]` (42) and `text-[10px]` (14) is `text-2xs` / `text-3xs`. Those tokens are
0.6875rem and 0.625rem, so the swap is size-identical.

The first pass stopped there, which left 19 `text-[13px]` / `text-[15px]` / display literals against
design-system §2's own rule that a raw `text-[Npx]` is a bug. 13px and 15px are the gaps Tailwind
leaves between `text-xs` (12), `text-sm` (14) and `text-base` (16), and this product uses both — so
they are now real scale steps, `text-13` and `text-15`, added beside the existing `text-2xs` /
`text-3xs` escape hatches. Verified present in the built CSS, not just the source.

Three raw sizes remain **by design and are now documented as the only exceptions** in §2: the two
marketing display headlines (`AuthVisualParts`, `CallToAction`) and the 22px wordmark — which moved
into `BRAND_WORDMARK_CLASSES`, where a lockup measurement belongs, rather than sitting loose in
`DwelveLogo`. That component's comment still described the wordmark as DM Serif Display, which had
not been true since the wordmark moved to Manrope; fixed.

### 3.7 Scrims and the last `color-mix` darkening

`RedeemInviteDialog` and `JoinSchoolDialog` still drew `bg-black/20 dark:bg-black/50` instead of
`bg-overlay`. Every dialog scrim in `src` now uses the token.

`DashboardComposer` still darkened `--success` with `color-mix(…, #000)` in two places and patched
the result with a `dark:` override. The light semantics are all ≥5:1 as text on the canvas, which is
precisely what retired that idiom — both are plain `text-success` now. No `color-mix(…, #000)`
remains.

### 3.8 `SwitchRow`

Found while auditing the last raw `<label>` elements: `TestSettingsDialog` and `TextAnswerEditor`
each wrote out the same switch-in-a-bordered-row, disagreeing only on label size. Extracted, with
`size` keeping that difference deliberate.

---

## Priority 4 — landing shape · done

`Analytics` is no longer a fourth `lg:grid-cols-2` copy-beside-a-mock section. The heading and its
bullets share one band across the top, and the data gets the full column width as a single wide
instrument panel: a fact row (average, submitted), a legible score-distribution chart with real
numeric bands, and the most-missed finding docked along the bottom edge.

That is also the more honest presentation — the section's claim is that the distribution matters more
than the average, and a chart you can read makes the argument that a shrunken mock only gestures at.

---

## Token change: ramp-as-label

`--chart-N-tint` and `--chart-N-ink` were added to both themes, and `check:contrast` asserts all ten
pairs at 4.5:1.

The ramp is tuned to be a legible *mark* on a card (the gate held it to 3:1). Seeded avatars and
class accent tiles put ramp-coloured **text** on a wash of its own hue, where 3:1 is not the right
bar. `-ink` is the same hue deepened only as far as AA needs.

`classAccents` uses these tokens — and is written out one string per line, deliberately:

> It was previously generated with ``[1,2,3,4,5].map(slot => `bg-[…var(--chart-${slot})…]`)``.
> Tailwind matches class names as literal text in the source, and a template hole is not a class
> name, so **those utilities were never generated**. Every class accent tile in the product had been
> rendering with a transparent background and inherited text colour. This was caught by the visual
> pass, not by lint, build, or the contrast gate.

These are the only 10 `[var(--token)]` classes left in `src`, and they are intentional. A repo-wide
grep confirms no other Tailwind class is built from a template literal.

---

## Verification — performed

The Chrome extension was not connectable, so this was done by driving headless Chrome over the
DevTools Protocol directly (Node 24 has a global `WebSocket`, so no new dependency was needed). A
locally minted dev session cookie made the authenticated routes reachable.

1. **Both-theme walk** — all 17 routes × light/dark = 34 combinations captured. No horizontal
   overflow on any of them.
2. **Trilingual** — `en` / `ru` / `uz` on the text-densest screens plus the landing page. Russian and
   Uzbek wrap without clipping; `PageHeader` and `EntityHeader` titles wrap rather than truncate, as
   intended.
3. **Reduced motion** — emulated `prefers-reduced-motion: reduce`. Reveals resolve to their final
   state instantly (opacity 1, `transform: none`); the new chart bars render at full height with no
   entrance.
4. **Responsive** — 375 / 834 / 1440. The sidebar collapses to a bottom bar below 768.
   **One real bug found and fixed:** the landing page overflowed horizontally by 17px at 375px.
   `TeacherControl`'s grid children could not shrink below their min-content width (the CSS Grid
   `min-width: auto` default); `min-w-0` on the grid children fixes it. Re-measured clean across all
   three languages at both breakpoints.

### Still outstanding

- **Dark-mode hero (`HeroScene`)** could not be verified. Headless Chrome has no GPU, so three.js
  cannot create a WebGL context there — the console shows `THREE.WebGLRenderer: A WebGL context
  could not be created`. The per-theme palette rebuild needs a GPU-backed browser to confirm. This
  also means the hero has **no visible fallback when WebGL is unavailable**, which is worth handling
  regardless of the redesign.
- **The screens re-touched after that walk** — the migrated request rows, the `Field` conversions,
  the `loading` buttons, and `SwitchRow` — have not been re-walked in a browser. They are
  type-checked, linted, and built, and the changes are JSX swaps onto existing primitives, but that
  is not the same as having been seen.
- **Backend-dependent screens rendered empty states**, because the local NestJS backend was not
  running (port 5000 answers 403 — that is macOS AirPlay, not the API). `EntityHeader`,
  `ClassEntityCard`, `RowActionsMenu`, and the roster tables were verified against a temporary
  fixture page in both themes rather than through live data; that page has been deleted. A pass with
  the real backend up is still worth doing.

### Finding not fixed (out of scope, flagged deliberately)

Every landing section gates its content on a `whileInView` reveal starting at `opacity: 0`. In a real
browser this is fine. But if the IntersectionObserver never fires — a headless renderer, a crawler
that does not scroll, a print stylesheet — the page ships with a visible hero and **eight blank
sections**. `FeatureBullets` already documents the right pattern ("staggered reveal over an
already-visible default"); the section wrappers do not follow it. Fixing this means touching the
motion setup in every landing section, which is a larger change than this pass was scoped for.

---

## What the gates do not catch

Recorded because this file previously got it wrong. Lint, build, `tsc`, and `check:contrast` all
passed on a tree that still had a never-built primitive, two `Field` implementations, 27 hand-rolled
spinners, and two untokenised scrims. **Duplication is not a compile error.** The checks that would
have caught these are greps, and they are cheap:

> **These greps were themselves broken, and were rewritten on 4 August 2026.**
> Three of the five filtered `--include='*.tsx'` while the things they watch live in `.ts`
> files, so they could not fail. The `classAccents` check is the clearest case: `classAccents`
> is defined in `groups/_constants/index.ts`, so the grep that exists solely to watch it
> returned `0` every time it was run and would have returned `0` no matter how bad the drift
> got. Running the corrected versions found **5** arbitrary-token classes and **2** surviving
> `text-[13px]` in `settings/_constants/index.ts` — both categories §3.6 recorded as fully
> migrated. Every grep below now scans `*.ts` as well as `*.tsx`.

```sh
# no arbitrary token classes, no raw palette, no arbitrary sizes, no one-off shadows
# NOTE: --include='*.ts' is load-bearing. classAccents lives in a .ts constants file.
grep -rEn '\b(bg|text|border|ring)-\[var\(--[a-z0-9-]+\)\]' --include='*.tsx' --include='*.ts' src   # expect: only classAccents (5)
grep -rEn 'text-\[[0-9.]*(px|rem)\]' --include='*.tsx' --include='*.ts' src                          # expect: the 2 display sites + BRAND_WORDMARK
grep -rn '<label' --include='*.tsx' src                                                              # expect: only clickable cards + Field itself

# spinners: the icon-name grep alone is blind to hand-rolled CSS spinners, which is how
# ConfirmDialog's border-spinner survived the "27 sites -> 2" migration in §3.5.
grep -rn '<Loader2\|<LoaderCircle' --include='*.tsx' src                                             # expect: 2 non-button placeholders
grep -rn 'animate-spin' --include='*.tsx' src                                                        # expect: only Button's own spinner

# every primitive should have consumers; a 0 here means it was built and abandoned.
# Enumerate the directory rather than hard-coding a list — the previous 8-name list
# omitted both primitives that actually had 0 consumers (InputOTP, label).
for f in src/components/ui/*.tsx; do
  p=$(basename "$f" .tsx)
  echo "$p: $(grep -rl "ui/$p\"" --include='*.tsx' --include='*.ts' src | wc -l)"
done
```
