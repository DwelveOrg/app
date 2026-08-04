# Redesign v2 — remaining work

Branch: `redesign/design-system-v2` · Written: 4 August 2026 · **Updated: 4 August 2026 (all
priorities implemented)**

The v2 redesign (see [design-system.md](./design-system.md)) landed the token layer, the shell, the
dashboard, auth, landing, and about two-thirds of the component consolidation. This file was the
honest remainder; it is now the record of closing it.

Gates: `npm run lint`, `npm run build`, and `npm run check:contrast` all pass. All 34 route/theme
combinations render with no horizontal overflow.

---

## Priority 1 — primitives that existed with zero consumers · **done**

### 1.1 `ListRow` — was 0 consumers · **done**

The three settings sections (`PreferencesSection`, `SecuritySection`, `SupportSection`) now use
`ListRow`. `SettingsRow.tsx` and the unused `layout/Row/` are deleted. The `comingSoon` string moved
to the caller via `soonLabel`, so no catalog change.

### 1.2 `Avatar` — was 0 consumers · **done**

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

### 1.3 `CopyButton` — was 0 consumers · **done**

All four sites migrated (`JoinCodeChip`, `InviteTeacherDialog`, `AddStudentsDialog`, and the setup
checklist in `DashboardComposer`). `navigator.clipboard` now appears exactly once in `src`.

Two props were added so nothing was silently dropped: `onError` (all four sites toast on clipboard
failure, which the primitive previously swallowed) and `icon` (the setup checklist shares a code and
uses `Share2`, not `Copy`).

### 1.4 `SkeletonList` / `SkeletonPage` — was 0 consumers · **done**

All four `loading.tsx` files use `SkeletonPage`; the four inline `animate-pulse` blocks are gone. The
only `animate-pulse` left in `src` is the live-status dot in `AuthVisualParts.tsx`, which is not a
skeleton.

`SkeletonPage` gained an `actions` count so the tests page does not grow a phantom second button, and
`SkeletonList` now carries its own `aria-busy` — its blocks are `aria-hidden`, so without it a screen
reader was told nothing at all during load.

---

## Priority 2 — primitives that were never built · **done**

| Component | Home | Status |
|---|---|---|
| `RowActionsMenu` | `src/components/ui/` | Built. Both roster tabs and `groups/_components/ClassCard.tsx` migrated. `destructive` is a flag, not a caller-supplied class, so the danger treatment can't be half-applied. |
| `ResourceStateView` | `src/app/(root)/_components/` | Built. `ClassStateView.tsx` and `TestsStateView.tsx` deleted, six call sites migrated. Takes i18n **keys**, not rendered strings — every caller is a server component with no `t` in scope. |
| `EntityHeader` | `src/app/(root)/_components/` | Built. `SchoolProfileHeader` and the header inside `ClassDetailView` both route through it. Status pills are now `Badge`. |
| `OnboardingActions` | `src/app/(root)/_components/` | Built. `NoMembershipState` and `SelectedSchoolCard` migrated; `variant="full" \| "compact"` covers the density difference the two had drifted into. |
| `ClassEntityCard` | `groups/_components/` | Built last, as planned. `StudentClassCard` and `TeacherClassCard` keep their own *decisions* (the backend flags genuinely differ) but share the shell and the pending / locked / rejected action blocks. |

---

## Priority 3 — class-level migrations · **done**

### 3.1 `Surface` — 41 files → 11

The remaining 11 are deliberate: the four fixed-position modal contents (`Dialog`, `alert-dialog`,
`RedeemInviteDialog`, `JoinSchoolDialog`), two `<input>` elements, the decorative `Empty/Artwork`,
and `Surface.tsx` itself.

Landing sections that are `motion` elements use the exported `surfaceVariants()` rather than the
component, so the treatment is still single-sourced.

**`Surface` was not actually polymorphic.** It advertised an `as` prop but typed its props against
`"div"`, so `<Surface as="form">` could not accept `onSubmit`. It is now generic in `as`.

### 3.2 `PageHeader` — done

`DashboardHeader` and `NotificationsHeader` are now `<PageHeader title subtitle actions />`. The
notifications "mark all read" control became a real `Button variant="outline"` instead of a
hand-rolled one.

### 3.3 Badge — done

Nine inline pill sites migrated across settings, profile, school, groups, tests, and sessions.

### 3.4 Micro-type — done

Every `text-[11px]` (42) and `text-[10px]` (14) in `src` is now `text-2xs` / `text-3xs`. Those tokens
are 0.6875rem and 0.625rem, so the swap is size-identical — no visual drift, and the arbitrary-size
ban is satisfied. `TestSettingsDialog` now uses `Input`'s `size` / `Textarea`'s `fieldSize` instead
of per-call-site padding overrides.

---

## Priority 4 — landing shape · **done**

`Analytics` is no longer a fourth `lg:grid-cols-2` copy-beside-a-mock section. The heading and its
bullets now share one band across the top, and the data gets the full column width as a single wide
instrument panel: a fact row (average, submitted), a legible score-distribution chart with real
numeric bands, and the most-missed finding docked along the bottom edge.

That is also the more honest presentation — the section's claim is that the distribution matters more
than the average, and a chart you can read makes the argument that a shrunken mock only gestures at.

---

## Token change: ramp-as-label

`--chart-N-tint` and `--chart-N-ink` were added to both themes, and `check:contrast` now asserts all
ten pairs at 4.5:1.

The ramp is tuned to be a legible *mark* on a card (the gate held it to 3:1). Seeded avatars and
class accent tiles put ramp-coloured **text** on a wash of its own hue, where 3:1 is not the right
bar. `-ink` is the same hue deepened only as far as AA needs.

`classAccents` now uses these tokens — and is written out one string per line, deliberately:

> It was previously generated with ``[1,2,3,4,5].map(slot => `bg-[…var(--chart-${slot})…]`)``.
> Tailwind matches class names as literal text in the source, and a template hole is not a class
> name, so **those utilities were never generated**. Every class accent tile in the product had been
> rendering with a transparent background and inherited text colour. This was caught by the visual
> pass, not by lint, build, or the contrast gate — it is exactly the class of bug that "no screen has
> been visually confirmed" was hiding.

A repo-wide grep confirms no other Tailwind class is built from a template literal.

---

## Verification — performed

The Chrome extension was still not connectable, so this was done by driving headless Chrome over the
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
- **Backend-dependent screens rendered empty states**, because the local NestJS backend was not
  running (port 5000 answers 403 — that is macOS AirPlay, not the API). `EntityHeader`,
  `ClassEntityCard`, `RowActionsMenu`, and the roster tables were therefore verified against a
  temporary fixture page in both themes rather than through live data; that page has been deleted.
  A pass with the real backend up is still worth doing.

### Finding not fixed (out of scope, flagged deliberately)

Every landing section gates its content on a `whileInView` reveal starting at `opacity: 0`. In a real
browser this is fine. But if the IntersectionObserver never fires — a headless renderer, a crawler
that does not scroll, a print stylesheet — the page ships with a visible hero and **eight blank
sections**. `FeatureBullets` already documents the right pattern ("staggered reveal over an
already-visible default"); the section wrappers do not follow it. Fixing this means touching the
motion setup in every landing section, which is a larger change than this pass was scoped for.
