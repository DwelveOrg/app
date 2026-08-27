# Dwelve — Layout and Composition

Status: v1 · Last updated: 11 August 2026

How a Dwelve screen is put together: which environment it belongs to, what its skeleton is, how wide
it runs, and how it behaves at every width.

`design-system.md` owns the tokens (§2 type, §3 colour, §4 elevation) and the shell contract (§7).
This file owns **page anatomy** — the level between "here is a token" and "here is a component".

**Related:** [component-library.md](./component-library.md) ·
[interaction-and-states.md](./interaction-and-states.md) · [design-system.md](./design-system.md)

---

## 1. The four environments

Dwelve is not one shell. It is four, and a route belongs to exactly one of them. Picking the wrong
one is the largest layout mistake available, because it is invisible until the feature is built.

| Environment        | Route group                | Chrome                        | Canvas                         | Purpose                                  |
| ------------------ | -------------------------- | ----------------------------- | ------------------------------ | ---------------------------------------- |
| **App shell**      | `src/app/(root)`           | Sidebar (264px) or bottom bar | `--background`                 | Everything you do between tasks          |
| **Studio**         | `src/app/studio`           | Top bar only                  | `--sidebar`                    | Authoring one test, full width           |
| **Exam**           | `src/app/exam`             | Top bar only                  | `--sidebar`                    | Sitting one test, nothing else clickable |
| **Authentication** | `src/app/(authentication)` | No application navigation     | Plain / split auth composition | Sign-in and account recovery             |

### App shell — `(root)/layout.tsx`

```
┌──────────┬────────────────────────────────────────┐
│          │  (scrolling column, content-scroll)     │
│ SideBar  │  ┌──────────────────────────────────┐   │
│  264px   │  │ max-w-[1180px]                   │   │
│ --sidebar│  │ px-4 py-6  ·  md:px-8 md:py-8    │   │
│ border-r │  │   <page owns its own header>     │   │
│          │  └──────────────────────────────────┘   │
└──────────┴────────────────────────────────────────┘
```

- **There is no top bar.** Each page owns its header (`PageHeader`). The sidebar is the only
  persistent chrome.
- Content is centred in `max-w-[1180px]` with `px-4 py-6 md:px-8 md:py-8`.
- The shell is `h-dvh` with `overflow-hidden`; the content column is the only scroller and carries
  `content-scroll` for the thin themed scrollbar.
- Below `md` the sidebar becomes a fixed bottom bar and the content column reserves `pb-24`.
- The column carries `layout-enter` — a 260ms fade-and-rise, once, on navigation. Deliberately
  short: the app loads into a task, and a long entrance is something the user sits through on every
  click.
- `export const dynamic = "force-dynamic"` — the layout reads the session.

**Narrow variant — retired.** There was a `(root)/(pages)/(small-container)` route group whose
layout capped the account area at `md:max-w-[600px]`. It is gone, and `profile` now sits directly
under `(root)/(pages)/`: a 600px cap inside a shell already capped at 1180 stranded ~290px of dead
canvas on either side of a desktop window and made the account area read as unfinished next to
Dashboard and Groups. The page now caps itself at `max-w-[1040px]` — one measure short of the
shell's — and splits each panel into two columns from `lg` up.

That is the general rule for a page that would otherwise look empty on a wide screen: **fill it by
splitting into columns, not by removing the gutter.** Still do not add percentage widths inside an
already-padded shell — an earlier version mixed `container`, `max-w-[80%]`, and two identical
breakpoint caps, and produced a double inset that read as a bug.

### Studio — `studio/layout.tsx`

No sidebar, no centred column, full-width canvas, one document. The chrome belongs to the test
rather than the app, and there is exactly one way out (the exit control in the top bar).

The canvas is `--sidebar`, not `--background`, so the surface changes the moment the route does.
That difference is small on purpose: enough to register as "somewhere else", not so much that it
reads as a different product.

### Exam — `exam/layout.tsx`

The same argument from the student's side, with a stricter requirement: **while an attempt is live
there is nothing else on screen to click.** No sidebar, no breadcrumb, no nav. A sidebar link during
a proctored exam is an invitation to leave the screen, and on a delivery with `detectLeaveScreen`
set to `SUBMIT` that invitation ends the attempt.

`force-dynamic` here is a correctness requirement, not a performance choice — a cached exam page is
a cached deadline.

### Authentication

Authentication uses a plain full-height wrapper; the split panel lives in `AuthSplitLayout`.
Brand treatment is allowed here because account entry is an identity moment, but it must not leak
into routine dashboard actions. Legacy landing utilities remain in `globals.css` after the host
split; they are not an invitation to create marketing UI in this repository.

---

## 2. Page anatomy

### The standard dashboard page

```tsx
export default async function Page({ params }: PageProps) {
  const { classId } = await params;
  const result = await getClass(classId);
  if (!result.ok) return <ResourceStateView reason={result.reason} … />;

  return <ClassDetailView … />;   // client component owns interaction
}
```

and the view it renders, top to bottom:

```
BackLink            ← only on a detail page one level down
PageHeader          ← eyebrow? / title / subtitle? / actions?
[EntityHeader]      ← only if the page is *about* an entity
[FactGrid]          ← the entity's facts
TabBar              ← if the page has sections
Surface…            ← the panels
```

Vertical rhythm between those blocks is `gap-6` (`flex flex-col gap-6 py-6`). Inside a panel it is
`space-y-4` / `gap-4`; between fields in a form, `space-y-5`.

`PageHeader` vs `EntityHeader`:

- **`PageHeader`** — this page is a _place_ ("Classes", "Notifications"). `<h1 class="type-title">`.
- **`EntityHeader`** — this page is _about a thing_ (a school, a class, a test).
  `<h1 class="type-section">` inside a `Surface`, with a tile, status, facts, and actions.

A page has one or the other, not both. A detail page under a list page gets `BackLink` +
`EntityHeader`.

### The panel

```tsx
<Surface padding="lg" className="space-y-4">
  <SectionHeader icon={Users} title={t("…")} description={t("…")} aside={<Button …/>} />
  …
</Surface>
```

Or, for a list of rows:

```tsx
<Surface divided padding="none">
  {items.map((item) => <ListRow key={item.id} variant="flush" … />)}
</Surface>
```

`divided` forces `padding="none"` — the rows own their own padding.

### Nesting: the three-level rule

**Never put a card inside a card.** A bordered box inside a bordered box is a hierarchy failure.
The test builder is the deepest tree in the product (section → group → question) and renders three
levels with **one** box:

- The **section** is the only card: one `Surface` at elevation 1.
- A **group** is a full-bleed band inside it — cancels the surface padding (`-mx-5 sm:-mx-6`) and
  separates with a `border-t` hairline, so the rule reads as a division of the section rather than
  the top of another box.
- A **question** is a flat row in a `divide-y` list. No border, no ring, no `interactive` lift — a
  row of form inputs is not clickable and must not look it.
- **Only the invalid state draws an edge.** A question a publish check flagged gets a ring, which is
  what makes it findable. If everything is boxed, nothing is.

Three weights of one idea — card edge, band rule, row rule — so hierarchy comes from rhythm rather
than from three competing borders at three competing radii.

For a recessed tile inside a panel, use `bg-background` (what `Fact` does), not a second `Surface`.

---

## 3. Widths and containers

| Context                  | Width                                                              |
| ------------------------ | ------------------------------------------------------------------ |
| App shell content column | `max-w-[1180px]`                                                   |
| Account area             | `md:max-w-[600px]`                                                 |
| A standalone form page   | `max-w-xl` centred                                                 |
| Dialog content           | `max-w-md`, `w-[calc(100vw-2rem)]`                                 |
| `Empty`                  | `max-w-lg`                                                         |
| Body prose               | 65–75ch (`max-w-[68ch]` in headers, `max-w-prose` in descriptions) |
| Tables and dense data    | may run wider than prose                                           |
| Studio / exam            | full width                                                         |

Prose caps are not decoration. A subtitle that runs the full 1180px is unreadable, which is why
`PageHeader`, `SectionHeader`, and `error.tsx` all cap at `68ch`.

---

## 4. Responsive

Three breakpoints carry the product. `xl` appears three times in `src`; `2xl` never. Do not add
tiers without a reason you can name.

| Prefix   | Min width | What changes                                                                            |
| -------- | --------- | --------------------------------------------------------------------------------------- |
| _(base)_ | 0         | Single column. Bottom nav. Stacked headers. `px-4 py-6`                                 |
| `sm:`    | 640px     | Two-column field grids; header actions move beside the title; footer rows go horizontal |
| `md:`    | 768px     | **Sidebar appears**, bottom bar disappears, `px-8 py-8`, narrow-container cap applies   |
| `lg:`    | 1024px    | Four-column fact grids and wide two-column product compositions                         |

Rules:

- **Mobile-first.** Write the base case, then add `sm:`/`md:`/`lg:`. A `max-*` query in this codebase
  is a smell.
- **`md` is the shell boundary.** Anything that assumes a sidebar must be `md:`-gated.
- **Grid children need `min-w-0`.** CSS Grid defaults children to `min-width: auto`, so a long
  unbreakable string blows the track out. Any `flex-1` or grid child holding user text gets
  `min-w-0`.
- **Test at 375 / 834 / 1440**, in both themes, in all three languages. Russian and Uzbek run
  longer than English; a row that fits at 375px in English may not.
- **The page body must never scroll horizontally.** Wide content (tables, charts, tab rows) scrolls
  inside its own container — `overflow-x-auto`, plus `no-scrollbar` where the scrollbar itself would
  be chrome (`TabBar` does this).

Dialog footers use `flex-col-reverse gap-2 sm:flex-row sm:justify-end` — on mobile the primary
action sits on top and under the thumb; on desktop it sits right.

---

## 5. Spacing and radius

Spacing comes from the Tailwind scale. The recurring values, so a new panel matches an old one:

| Distance                | Value                                    |
| ----------------------- | ---------------------------------------- |
| Page blocks             | `gap-6`                                  |
| Panel internals         | `gap-4` / `space-y-4`                    |
| Form fields             | `space-y-5`                              |
| Header title → subtitle | `mt-1.5`                                 |
| Row icon → text         | `gap-3.5`                                |
| Button groups           | `gap-2` (tight) / `gap-3` (page actions) |
| Badge / pill rows       | `gap-2`                                  |

Radius is **seven explicit steps** declared in `globals.css` as `--r-1` … `--r-7` and mapped onto
the Tailwind names in `@theme inline`: `rounded-sm`(6) · `rounded-md`(8) · `rounded-lg`(12) ·
`rounded-xl`(14) · `rounded-2xl`(20) · `rounded-3xl`(24) · `rounded-4xl`(28). Practically:

- `rounded-2xl` — cards and panels (`Surface radius="lg"`)
- `rounded-xl` — inputs, icon chips, inner tiles, nav rows
- `rounded-lg` — buttons, menu items, small controls
- `rounded-[var(--radius-pill)]` — badges, chips, tags, and any small labelled token
- `rounded-full` — **genuine circles only**: avatars, status dots, spinners, radio buttons, switch
  thumbs, progress-bar caps, stepper nodes, and the A/B/C/D answer bubbles

Never mix radii inside one component. A `rounded-xl` input inside a `rounded-2xl` card is correct;
a `rounded-lg` input beside a `rounded-xl` one is not.

> **Changed (v4).** The ladder was six offsets hung off a single `--radius: 0.75rem` base, so a
> retune could only _shift_ the curve and never change its shape — and it broke outright below a 5px
> base, where `calc(--radius - 4px)` went negative. The steps are literals now and the ramp is the
> knob.
>
> **Changed (v5).** The ramp roughly doubled (soft-modern retune, maintainer-approved from rendered
> candidates, then nudged one notch further on request): buttons went 4px → 12px, cards 6px → 20px,
> dialogs and feature panels 16px → 24–28px,
> and `--radius-pill` is a true pill, so chips, badges and the `Segmented` control read as pills.
> Resting surfaces cast a gentle diffuse shadow again and `interactive` rises 1px on hover. Colour
> tokens did not move. The `frontend` repository carries the identical retune.
>
> `--radius-pill` is separate on purpose: "are chips pills" stays a one-line decision. Chips route
> through the token; things that are actually round keep `rounded-full`. **`rounded-full` on
> something containing a number or a word is still a bug** — see `Badge`, or the question-number
> chips in `QuestionView` / `QuestionNavigator`.

---

## 6. Elevation and stacking

Depth model (design-system §4): **a hairline defines an edge, elevation separates a layer.**

| Level | Utility             | Use                                                                 |
| ----- | ------------------- | ------------------------------------------------------------------- |
| 1     | `shadow-elev-1`     | Resting cards, panels, list surfaces — most of a page. Nearly flat. |
| 2     | `shadow-elev-2`     | Resting, slightly forward: sticky chrome, raised tiles              |
| 3     | `shadow-elev-3`     | **Floating:** dropdowns, popovers, sticky action bars               |
| 4     | `shadow-elev-4`     | **Floating:** dialogs, toasts, sheets                               |
| —     | `shadow-elev-brand` | Alias of `--elev-2`; no longer a coloured glow                      |

**Levels are earned.** Most of a page lives at 1. Two adjacent panels at different levels means one
of them is wrong. A raw `shadow-[…]` is a bug.

**1–2 rest, 3–4 float**, and the gap between them is a cliff rather than a step — that is the line
between "on the page" and "over the page". Hover never changes a card's elevation; see
design-system §4.

Z-index has exactly four rungs in use — do not invent a fifth:

| Layer                                                     | Value           |
| --------------------------------------------------------- | --------------- |
| In-page stacking (sticky headers, overlapping decoration) | `z-10` – `z-30` |
| Fixed shell chrome (mobile bottom bar)                    | `z-40`          |
| Overlays: dialog scrim, dialog content, dropdowns         | `z-50`          |

Every scrim is `bg-overlay` (`--overlay`), never `bg-black/20 dark:bg-black/50`.

---

## 7. Route file conventions

```
src/app/(root)/(pages)/groups/[classId]/
  page.tsx            server component: params → fetch → state check → view
  loading.tsx         SkeletonPage matching the real page's rhythm
  _components/        route-local components (PascalCase)
  _constants/         literals, label-key maps
  _types/             types; _types/_schemas/ for zod form schemas
  _utils/             server-side get* helpers
  _lib/               endpoint fns, server actions, response schemas
  _hooks/             client hooks (use* mutations, queries)
```

- Underscored folders are excluded from routing — that is why they are underscored.
- `error.tsx` exists at `(root)` level and catches the whole shell. Add a nested one only when a
  sub-tree needs a different recovery.
- `loading.tsx` should mirror the real page's block rhythm (`SkeletonPage backLink header="none"`
  then a matching arrangement) so the swap doesn't jump.
- Client components take the `-client.tsx` / `.client.tsx` suffix where the route already uses it
  (`page-client.tsx`, `profile.client.tsx`), or a plain PascalCase view name (`ClassDetailView.tsx`).

---

## 8. The server/client seam

The split is a layout concern as much as a data one, because it decides where a page can call `t()`.

- **`page.tsx` is a server component.** It awaits `params`, fetches, and picks between a state view
  and the real view. It has no `t` in scope — which is why `ResourceStateView` takes i18n _keys_.
- **The view is a client component.** It owns tabs, dialogs, mutations, and every `useTranslation`.
- Push the `"use client"` boundary **down**, not up. A page that marks itself client to use one hook
  drags its whole subtree into the bundle.

Full rules: [`../architecture/RENDERING_AND_STATE.md`](../architecture/RENDERING_AND_STATE.md).

---

## 9. Checklist for a new page

- [ ] Correct environment — app shell, studio, exam, or public?
- [ ] `page.tsx` server, view client; `"use client"` as low as possible
- [ ] `loading.tsx` mirroring the real rhythm
- [ ] Failure states routed through `ResourceStateView`
- [ ] Exactly one `PageHeader` **or** one `EntityHeader`
- [ ] Panels are `Surface`; no `Surface` inside a `Surface`
- [ ] `gap-6` between page blocks
- [ ] `min-w-0` on every grid/flex child holding user text
- [ ] Walked at 375 / 834 / 1440, both themes, `en` / `ru` / `uz`
- [ ] No horizontal page scroll at any width
- [ ] Route added to `protectedRoutes` / `publicRoutes` if it needs a guard, and to
      `ROUTE_LABEL_KEYS` if a segment label is shown
