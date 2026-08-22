# Dwelve — Component Library

Status: v1 · Last updated: 11 August 2026

The API reference for every shared UI component in the product. `design-system.md` §8 names the
primitives and says *why* one component per job; this file says **what each one takes, when to reach
for it, and when not to**.

Read this before writing any JSX. If the element you are about to build appears below, use it — do
not restyle it, do not copy it, do not fork it for one extra prop. Adding a prop to a primitive is
almost always cheaper than a second component, and it is the only change that fixes every call site.

**Related:** [design-system.md](./design-system.md) (tokens, type, colour, elevation, motion) ·
[layout-and-composition.md](./layout-and-composition.md) (page anatomy) ·
[interaction-and-states.md](./interaction-and-states.md) (loading, empty, error, feedback) ·
[accessibility.md](./accessibility.md)

---

## 1. Where components live

| Location | Scope | Promote when |
|---|---|---|
| `src/components/ui/` | Product-wide primitives (shadcn/Radix + Dwelve-owned) | — it is already the top |
| `src/components/Custom/` | Product-wide composites that aren't primitives (logo, image picker, relative time) | used in ≥2 route groups |
| `src/components/tests/` | Shared across studio + exam + results — the paper renderer, score marks, charts | used by more than one test environment |
| `src/app/(root)/_components/` | Shared inside the authenticated shell only | used by ≥2 pages under `(root)` |
| `src/app/<route>/_components/` | One route | starts with everything |

**The promotion ladder is one-directional:** route-local `_components` → route-group `_components`
→ `src/components/Custom` or `src/components/ui`. A component moves up the moment a second
consumer appears in a different branch of the tree. Copying it instead is the single most common
regression in this codebase — see `redesign-remaining-work.md` for the four times it happened.

**`src/app/(root)/_components/` is not a lesser tier.** `PageHeader`, `ListRow`, `EntityHeader`,
`ConfirmDialog`, and `Dialog` live there because they are meaningless outside the authenticated
shell, not because they are provisional. Import them by alias:
`@/app/(root)/_components/PageHeader`.

---

## 2. Choosing a component

| You are building | Use | Not |
|---|---|---|
| Any bordered box | `Surface` | a hand-written `rounded-2xl border bg-card` |
| Any button, or a link that looks like one | `Button` (`asChild` for links) | a raw `<button>`, a styled `<Link>` |
| A form label + hint + error | `Field` | a hand-written `<label>` + `<p>` |
| Any text entry | `Input` / `Textarea` | a raw `<input>` |
| A status pill / count chip / tag | `Badge` | an inline `rounded-full` span |
| A number chip (question index, order index) | `rounded-[var(--radius-pill)]` + `numeric` | `rounded-full` around a figure |
| A person / class / school circle | `Avatar` | a hand-rolled initials div |
| A tab row | `TabBar` | `tabs.tsx` (that's the Radix primitive; `TabBar` is the product control) |
| A theme/language/view switch | `Segmented` | a `Select` |
| A page title block | `PageHeader` | an `<h1>` + `<p>` |
| A panel heading inside a card | `SectionHeader` | an `<h2>` + `<p>` |
| An "up one level" link | `BackLink` | a hand-written `<Link>` with an arrow |
| A labelled facts row | `FactGrid` + `Fact` | a hand-built grid of tiles |
| An icon + title + description row | `ListRow` | a flex row written from scratch |
| A school / class / test header | `EntityHeader` | `PageHeader` (that's for pages, not entities) |
| A trailing "…" menu | `RowActionsMenu` | raw `DropdownMenu` parts |
| A destructive confirmation | `ConfirmDialog` | `Dialog` |
| A form in a modal | `Dialog` + `DialogFooterActions` | a hand-rolled Radix overlay |
| A "give a reason" prompt | `MessagePromptDialog` | `Dialog` with a textarea |
| A pending request from a person | `PersonRequestRow` | a bespoke row |
| Copy-to-clipboard | `CopyButton` | `navigator.clipboard` in a component |
| Any loading state | `Skeleton` / `SkeletonList` / `SkeletonPage` | a bare spinner |
| Any empty / first-run state | `Empty` | a centred `<p>` |
| A forbidden / not-found / retryable resource state | `ResourceStateView` | `Empty` alone |
| A reorderable list | `SortableList` + `SortableRow` | `@dnd-kit` imported directly |

---

## 3. Surfaces and containers

### `Surface` — `@/components/ui/Surface`

The **only** bordered container in the product. Polymorphic in `as`, so `<Surface as="form">`
accepts `onSubmit`.

```tsx
<Surface as="form" padding="lg" onSubmit={handleSubmit(onSubmit)} noValidate>…</Surface>
```

| Prop | Values | Default | Notes |
|---|---|---|---|
| `as` | any element type | `"div"` | Props are typed against it |
| `variant` | `card` · `muted` · `plain` · `dashed` · `danger` · `glass` | `card` | See below |
| `padding` | `none` · `sm` (16) · `md` (20) · `lg` (20→24 at `sm`) | `md` | Forced to `none` when `divided` |
| `radius` | `md` (`rounded-xl`) · `lg` (`rounded-2xl`) | `lg` | |
| `elevation` | `0` · `1` · `2` · `3` | `1` | Dialogs use `shadow-elev-4` directly |
| `interactive` | boolean | `false` | Hover darkens the hairline and steps the fill; nothing moves (`--lift: 0`) |
| `divided` | boolean | `false` | Children become `divide-y` rows |

Variant meanings:

- **`card`** — sits above the canvas. The default and ~90% of use.
- **`muted`** — recedes *into* the canvas. Wells, insets, secondary groupings.
- **`plain`** — border only, canvas shows through. Grouping without a box.
- **`dashed`** — a slot waiting to be filled ("add a question", "no classes yet").
- **`danger`** — a destructive zone. Delete account, remove member.
- **`glass`** — genuinely floating chrome only: sticky bars, scrolled nav. **Never an ordinary panel.**

Rules:

- `interactive` must be paired with a real link or button child. A div that lifts and does nothing
  is a lie.
- **Never nest a `Surface` inside a `Surface`.** Use `divided`, a `border-t` band, or a `Fact` tile
  (`bg-background` inside `bg-card` — a well recessed into the panel, not a second card on top).
- Landing sections that are `motion` elements import `surfaceVariants()` and pass the string, so
  the treatment stays single-sourced without the component.

### `SectionCard` — `@/app/(root)/(pages)/_components/layout/SectionCard`

`Surface` + `SectionHeader` in one, for a panel that always has an icon-chip heading. Takes
`icon`, `title`, `description`, `children`. Reach for `Surface` + `SectionHeader` when you need
anything the wrapper doesn't expose.

---

## 4. Actions

### `Button` — `@/components/ui/Button`

The only button and the only button-shaped link.

| Prop | Values | Default |
|---|---|---|
| `variant` | `default` · `outline` · `secondary` · `ghost` · `destructive` · `destructive-solid` · `link` · `brand` | `default` |
| `size` | `xs` · `sm` · `default` · `lg` · `xl` · `icon` · `icon-xs` · `icon-sm` · `icon-lg` | `default` |
| `asChild` | boolean | `false` |
| `loading` | boolean | `false` |

Variant meanings:

- **`default`** — the primary action. One per view, ideally.
- **`outline`** — the secondary action beside a primary one; also the resting state of a dropdown
  trigger (it carries `aria-expanded` styling).
- **`secondary`** / **`ghost`** — tertiary. `ghost` for icon buttons in rows and toolbars.
- **`destructive`** — a tinted red button. The *entry point* to a destructive flow.
- **`destructive-solid`** — solid red. Reserved for the **confirm** step inside `ConfirmDialog`,
  so "solid red" always means "this is the irreversible click".
- **`link`** — inline text action.
- **`brand`** — the violet gradient. Landing and auth surfaces where the button *is* the brand
  moment. Not for ordinary primary actions inside the app.

`loading` rules:

- It **replaces** the button's icons with a spinner in CSS and keeps the label mounted, so the row
  never reflows mid-submit. Leave your leading icon in place; do not write
  `{pending ? <Spinner/> : <Icon/>}`.
- It sets `disabled` and `aria-busy` for you.
- It is unavailable under `asChild` — a Slot takes one child. If a link needs a pending state, it
  isn't a link.

Links:

```tsx
<Button asChild variant="outline"><Link href="/dashboard">Back</Link></Button>
```

> **Accent rule (v4).** `default` is the **ink** button and is the answer for every ordinary
> primary action. `brand` is the violet one and is reserved for the landing and auth surfaces where
> the button *is* the brand moment — using it for a routine "Save" is what made every screen read as
> a brand page. `Button.tsx`'s header states the same rule; it and the classes now agree.

### `CopyButton` — `@/components/ui/CopyButton`

Copy-to-clipboard with a 2s confirmation. `navigator.clipboard` appears **once** in `src`; keep it
that way.

Props: everything `Button` takes except `onClick`/`children`, plus `value`, `label`,
`copiedLabel`, `showLabel?`, `icon?`, `onCopied?`, `onError?`.

`onError` is not optional in practice — clipboard access is denied on insecure origins and by
permission policy, and every call site toasts. The button stays at rest on failure so the user can
select the text manually.

### `RowActionsMenu` — `@/components/ui/RowActionsMenu`

The trailing overflow menu on a row or card.

```tsx
<RowActionsMenu
  label={t("…", { name: student.fullName })}   // include the subject: "Actions for Aziza"
  variant="flat"                                // "floating" when overlaying a card
  actions={[
    { label: t("edit"), icon: Pencil, onSelect: openEdit, keepOpen: true },
    { label: t("remove"), icon: Trash2, onSelect: openRemove, destructive: true, keepOpen: true },
  ]}
/>
```

- `destructive` is a **flag**, never a caller-supplied class, so the danger treatment can't be
  half-applied.
- `keepOpen: true` whenever the action opens a dialog. Closing the menu in the same tick moves
  focus while the dialog mounts, and focus snaps back to the trigger.
- Renders `null` for an empty `actions` array — no empty menu button.

---

## 5. Forms

Full end-to-end recipe: [`../architecture/FORMS.md`](../architecture/FORMS.md). This section is the
component surface only.

### `Field` — `@/components/ui/Field`

Label + control + hint + error, with the ARIA wiring. **Every** labelled control goes through it.

| Prop | Type | Notes |
|---|---|---|
| `label` | ReactNode | |
| `required` | boolean | Renders the affordance. Does not validate — that is zod's job |
| `hint` | ReactNode | Shown only when there is no `error` |
| `error` | ReactNode | Gets `role="alert"` and wires `aria-describedby` |
| `htmlFor` | string | Omit to let `Field` generate an id |
| `size` | `sm` · `md` | `sm` for dense contexts (the test builder); `md` for standalone forms |
| `children` | node **or** render fn | The fn receives `{ id, aria-invalid?, aria-describedby? }` |

Two shapes:

```tsx
// Simple — you set aria-invalid yourself
<Field label={t("…")} required error={errors.name?.message}>
  <Input {...register("name")} aria-invalid={Boolean(errors.name)} />
</Field>

// Render-prop — Field hands you the wiring
<Field label={t("…")} error={errors.name?.message}>
  {(props) => <Input {...register("name")} {...props} />}
</Field>
```

The only correct raw `<label>` elements left in `src` are clickable radio/switch cards,
`ImagePicker`'s own label row, `Field` itself, and the login password row (whose "forgot password?"
link must not sit inside a `<label>` that would steal the click). If you are writing a fifth, you
are wrong.

### `Input` — `@/components/ui/Input`

Standard `<input>` props plus:

| Prop | Values | Default |
|---|---|---|
| `surface` | `default` (bg-card) · `muted` (bg-muted) | `default` |
| `size` | `sm` · `md` · `lg` | `lg` |
| `showPasswordToggle` | boolean | auto-on for `type="password"` |
| `revealLabel` / `hideLabel` | string | English fallbacks — **pass `t(...)`** |

Use `surface="muted"` for an input sitting on a `--card` panel, where a white field disappears into
it. The password reveal toggle is deliberately keyboard-focusable (WCAG 2.1.1) — do not add
`tabIndex={-1}`.

Shared geometry is exported as `fieldBaseClassName`, `fieldSizeClassName`, `fieldSurfaceClassName`
so `Textarea` consumes the identical strings. Any new text-entry control must import them too.

### `Textarea` — `@/components/ui/textarea`

Same `surface` / `size` vocabulary as `Input`, built on the same exported class strings.

### Radix form primitives

`checkbox` · `radio-group` · `switch` · `select` · `InputOTP` — regenerated shadcn components in
the `radix-nova` style, importing from the already-installed `radix-ui` meta package.

> **If you regenerate any of these:** the registry emits `data-checked:` / `data-active:` variants
> that target a newer Radix than the pinned `radix-ui@1.4.3`, which writes `data-state="checked"`.
> The selectors in these files were hand-changed to `data-[state=…]:`. Re-running the generator
> silently reverts that and checked/active states render with **no visual difference**.

Prefer `Segmented` over `select` for small mutually-exclusive choices. A `<select>` for two or three
options is a dropdown standing in for a switch.

### `Segmented` — `@/components/ui/Segmented`

```tsx
<Segmented
  value={theme} onChange={setTheme} options={themeOptions}
  ariaLabel={t("profile.theme.label")}
  layoutId="theme-segment"       // unique per mounted control
  pending={!mounted}             // pre-hydration placeholder, same geometry
/>
```

`role="radiogroup"` with `role="radio"` children. The sliding highlight is a shared `layoutId`, so
`layoutId` must be unique per mounted control or two switches will fight over one indicator.
`pending` renders the same-height shell before hydration so a client-only value (theme, locale)
doesn't shift the layout when it resolves.

### `ImagePicker` — `@/components/Custom/ImagePicker`

Avatar/logo upload with preview. All labels are props (`label`, `hint`, `chooseLabel`,
`replaceLabel`, `removeLabel`) because the primitive can't hard-code English. Drive it with RHF's
`<Controller>`; it emits `File | null`.

### `SortableList` / `SortableRow` — `@/components/ui/SortableList`

The **only** permitted entry point to `@dnd-kit`. Do not import the dnd-kit packages anywhere else.

| Prop | Notes |
|---|---|
| `ids` | Stable keys — a row's own `uid`, or RHF's `field.id`. **Never the array index.** |
| `onReorder` | Index-based, for a list that is one array |
| `onDropOn` | Id-based, for a list rendered flat but stored as several groups |
| `disabled` | |

Rules:

- **Every sortable row keeps its up/down/remove buttons.** The handle is the fast path, not the only
  one — buttons carry discoverability, touch, and motor accessibility. Removing them to "clean up"
  the row is a regression.
- Keyboard operation is built in via `KeyboardSensor` + `sortableKeyboardCoordinates`: space to
  lift, arrows to move, space to drop, escape to cancel.
- Order is array position throughout. Nothing is sent to the backend for it.

---

## 6. Data display

### `Badge` — `@/components/ui/badge`

| Prop | Values | Default |
|---|---|---|
| `variant` | `primary` · `brand` · `neutral` · `outline` · `success` · `warning` · `destructive` · `info` · `solid` | `neutral` |
| `size` | `xs` · `sm` · `md` | `sm` |
| `shape` | `pill` · `count` | `pill` |
| `uppercase` | boolean | `false` |
| `asChild` | boolean | `false` |

- **`neutral`** is the default and the right answer most of the time — counts, "soon", type labels.
- **`primary`** for "current", "selected", "your role".
- **`solid`** is the loudest badge in the product and is reserved for the sidebar unread count.
  One per screen, at most.
- **`brand`** is identity, not state.
- Tints are `color-mix` against live tokens, so a badge stays legible on `--card`, `--muted`, and
  `--sidebar` in both themes without a `dark:` variant. Never add one.
- Never signal correct/incorrect by colour alone — pair `success`/`destructive` with an icon or
  label (design-system §3.3).

### `Avatar` — `@/components/ui/Avatar`

| Prop | Values | Default |
|---|---|---|
| `name` | string \| null | required — drives initials and alt text |
| `src` | string \| null | falls back to initials |
| `size` | `xs`(28) · `sm`(36) · `md`(44) · `lg`(56) · `xl`(64) · `2xl`(80) | `md` |
| `shape` | `circle` · `rounded` | `circle` |
| `tint` | `brand` · `neutral` · `seeded` | `brand` |

`tint="seeded"` hashes the name into the chart ramp's `-tint`/`-ink` pair so two students in one
list are distinguishable. Use `brand` for the current user / current org, `seeded` inside lists.

Uses a plain `<img>`, not `next/image`, and this is deliberate: `next.config.ts` allows **no**
remote image hosts, so the optimizer would reject exactly the backend and `blob:` URLs this
component receives. Do not "fix" it.

### `FactGrid` / `Fact` — `@/app/(root)/_components/FactGrid`

The labelled facts row under an entity header. `FactGrid` is a `<dl>` at
`sm:grid-cols-2 lg:grid-cols-4`; `Fact` takes `icon?`, `label`, `value`, `hint?`.

Tiles are `bg-background` inside a `bg-card` surface — a well recessed *into* the panel, which keeps
the depth ladder at one level. `Fact` values truncate on purpose (a wrapping teacher name would make
four tiles four different heights); entity and page **titles** never truncate.

### `ListRow` — `@/app/(root)/_components/ListRow`

Icon + title + description + trailing control. The workhorse row.

| Prop | Notes |
|---|---|
| `variant` | `flush` (inside `<Surface divided>`, surface draws the edges) · `boxed` (standalone) |
| `href` | Makes the whole row a link and shows a chevron |
| `action` | Trailing control for rows that perform an action |
| `control` | Full-width control **below** the label (a segmented switch, a slider) |
| `soon` / `soonLabel` | Dimmed, non-interactive, with a note pill |
| `danger` | Destructive tone for the icon chip and title |

`href`, `action`, and `soon` are mutually exclusive in the trailing slot — the component picks in
that order.

### `EntityHeader` — `@/app/(root)/_components/EntityHeader`

The identity block at the top of a school, class, or test: tile, title, status, description, facts,
actions.

Key props: `name`, `imageUrl?`, `tile?` (replaces the initials tile — the test builder passes a
format icon, because "IELTS Practice 1" → "IP" is meaningless), `tileSize` (`lg` school / `xl`
class), `status?: {label, active}`, `badges?` (extra `<Badge>`s for multi-state entities),
`description?`, `meta?`, `actions?`, `headingId?`.

The title is deliberately **not** truncated: Russian and Uzbek Latin run considerably longer than
English and a clipped school name is worse than a wrapped one.

### `PersonRequestRow` — `@/app/(root)/_components/PersonRequestRow`

A pending request from a person, with approve and reject. Takes `person: {fullName, email?}`,
`message?`, `requestedAt?`, both labels, both handlers, and independent `isApproving` /
`isRejecting` flags so the two buttons show pending state separately.

Each caller keeps a thin adapter that unwraps its own domain object (`request.student` vs
`request.teacher`) and supplies its own i18n labels. That difference is real and belongs to the
caller; the row is not.

### Test-specific display

`@/components/tests/` — `TestStatusBadge`, `ScoreMeter`, `FormatMark`, `charts/ScoreHistogram`,
`charts/QuestionDifficultyRow`, and `paper/QuestionView` (the **one** question renderer, in
`answer` / `review` / `preview` modes, so what a student saw and what a teacher marks cannot
drift). See `docs/features/test-studio.md` and `docs/features/test-taking.md`.

### `RelativeTime` — `@/components/Custom/RelativeTime`

Live localized "2 hours ago", refreshing once a minute, following the active i18n language. Carries
`suppressHydrationWarning` because SSR and the first client tick legitimately differ. Never
hand-write per-language relative strings.

---

## 7. Navigation

### `TabBar` — `@/components/ui/TabBar`

Every tab row. Two variants: `underline` (page-level sections) and `pill` (filters inside a panel).

```tsx
<TabBar
  items={[
    { value: "students", label: t("…"), count: roster.length, showZeroCount: true,
      refresh: { queryKeys: [queryKeys.classes.detail(classId)] } },
    { value: "requests", label: t("…"), count: pending,
      refresh: { queryKeys: [queryKeys.enrollment.classRequestsAll(classId)] } },
  ]}
  value={tab} onSelect={setTab}
  ariaLabel={t("…")} layoutId="class-tabs"
/>
```

| `TabItem` field | Notes |
|---|---|
| `value` | Stable key and the value reported by `onSelect` |
| `label` | |
| `href` | Present for navigation tabs; omit for local-state tabs |
| `count` | Hidden when 0 unless `showZeroCount` |
| `showZeroCount` | A roster of 0 is a fact ("Students 0"); a pending count of 0 is noise |
| `disabled` | Renders a non-interactive `<span aria-disabled>` |
| `note` | Trailing pill for locked features ("Soon") |
| `refresh` | **What to re-read when this tab opens** — see below |

**`refresh` is load-bearing, not an optimisation.** These tabs switch on local state: query keys
don't change and nothing remounts, so without it a tab switch fires no request at all and the panel
shows whatever was fetched on first page load. A join request that arrived since then stays
invisible until a full reload. The failure is silent — a panel that never refetches looks exactly
like a panel with nothing new in it.

Declare `refresh` on any tab showing server state. `queryKeys` are matched as **prefixes**, so pass
the `*All` key to cover every search/page variant. `router: true` covers panels rendered from RSC
props.

`layoutId` must be unique per mounted `TabBar`.

### `BackLink` — `@/app/(root)/_components/BackLink`

The "up one level" link above a detail page's header. Takes `href` and children.

It is a **link, not `router.back()`** — a teacher can arrive at a test from a notification or a
pasted URL, where "back" would leave the product entirely.

### `PageHeader` — `@/app/(root)/_components/PageHeader`

`eyebrow?` · `title` · `subtitle?` · `actions?`. Renders `<header>` with an `<h1 class="type-title">`.
Every dashboard page starts with one. The title wraps and balances rather than truncating.

### `SectionHeader` — `@/app/(root)/_components/SectionHeader`

`icon?` · `title` · `description?` · `aside?`. Renders an accent icon chip + `<h2 class="type-heading">`
inside a panel. The chip treatment (`size-10 rounded-xl` over a 12% primary tint) lives here only.

### Sidebar

`@/app/(root)/_components/Sidebar` — the shell's only persistent chrome. Not a component you compose
with; adding a destination means editing it. Rules it enforces, which any change must preserve:

- **Weight is the state signal, never size.** Idle `font-normal`, active `font-semibold`. A size
  change would reflow the sidebar on every navigation.
- Active rows carry a soft primary tint **plus a left rail** — the rail is what survives at a glance
  on an already-tinted sidebar.
- Rows use `interactive-flat`. A lifting nav row is a layout shift.
- Below `md` it collapses to a fixed bottom bar; the content column reserves `pb-24`.

---

## 8. Overlays

### `Dialog` — `@/app/(root)/_components/Dialog`

The dialog shell for the authenticated app. Built on Radix `Dialog` (dismissible), **not**
`AlertDialog`.

| Prop | Notes |
|---|---|
| `open` / `onOpenChange` | Omit both to let the dialog manage its own state |
| `trigger` | Renders a trigger inside the root |
| `title` / `description` | Wired to Radix `Title` / `Description` |
| `showClose` / `closeLabel` | Top-right close affordance |
| `footer` | Usually `<DialogFooterActions />` |
| `contentClassName` | Width for a picker, max-height for a long list. Nothing else |

`DialogFooterActions` is the Cancel/Submit row every form dialog ends with:

```tsx
<DialogFooterActions
  cancelLabel={t("common.cancel")} submitLabel={t("…")}
  isBusy={mutation.isPending}
  tone="default"            // "destructive" gives a solid red submit
  // omit onSubmit inside a <form> — the button submits it
/>
```

Cancel is a Radix `Close`, so dismissal works without the caller wiring state. `DialogClose` is
re-exported for extra close-bound controls — do not import radix directly.

### `ConfirmDialog` — `@/app/(root)/_components/ConfirmDialog`

**Every irreversible action.** Built on Radix `AlertDialog`, which deliberately ignores overlay
clicks — right for a forced confirmation, wrong for everything else.

Takes **rendered strings, never translation keys**, so each caller keeps its own `t()` calls and no
key namespace gets baked into a shared component. `tone` defaults to `destructive`. `children` slots
extra content (a warning, a checkbox, a summary) between description and footer. Set
`confirmDisabled` when that content must be completed before confirmation, such as selecting a
destination; pending state still disables both footer controls.

The confirm button suppresses Radix's auto-close so the pending state stays visible until the
mutation settles and the caller closes the dialog itself.

### `MessagePromptDialog` — `@/app/(root)/_components/MessagePromptDialog`

Every "give a reason" prompt (rejecting a join request, etc.). `title`, `description?`, `label`,
`placeholder?`, both labels, `tone?`, `maxLength?`, `isSubmitting?`, `onConfirm(message)`.

### Radix menus and disclosures

`dropdown-menu` · `select` · `accordion` · `alert-dialog` · `tabs` — use through the product
wrappers above where one exists (`RowActionsMenu`, `ConfirmDialog`, `TabBar`). Reach for the raw
parts only for a genuinely new shape, and then ask whether that shape should become a primitive.

`z-50` is the overlay layer. `z-10`–`z-40` are in-page stacking. Do not invent new values.

---

## 9. Feedback and state

Behavioural rules live in [interaction-and-states.md](./interaction-and-states.md). The components:

### `Skeleton` / `SkeletonList` / `SkeletonPage` — `@/components/ui/Skeleton`

- `Skeleton` — one block. `aria-hidden`, `motion-reduce:animate-none`.
- `SkeletonList` — `count` identical rows. Carries `aria-busy` itself, because its children are
  hidden and a screen reader would otherwise be told nothing at all.
- `SkeletonPage` — the route `loading.tsx` envelope: `backLink?`, `header` (`none`/`simple`/
  `withActions`), `actions` (how many trailing buttons the real header has, so the swap doesn't drop
  a phantom one), and `children`.

**Never a bare spinner for a loading region.** The only correct spinners in `src` are `Button`'s own
and two non-button placeholders.

### `Empty` — `@/app/(root)/(pages)/_components/ui/Empty`

The empty / first-run state. `title?`, `description?`, `icon?`, `action?`, `variant` (`card` for a
genuine "nothing here yet", `dashed` for a slot the user is meant to fill).

An empty state should teach the interface — `action` is where the way forward goes. A bare "nothing
here" is an unfinished screen.

### `ResourceStateView` — `@/app/(root)/_components/ResourceStateView`

The forbidden / not-found / error state for a nested resource page. Takes i18n **keys**, not
strings, because every caller is a server component with no `t` in scope; this is the client
boundary that resolves them.

```tsx
<ResourceStateView
  reason={result.reason}                  // "forbidden" | "notFound" | "error"
  namespace="root.classDetail"            // reads `<ns>.states.<reason>.title` / `.description`
  backHref="/groups"
  backLabelKey="root.classDetail.back"
  retryLabelKey="root.classDetail.states.retry"
  actionLabelKey="root.classDetail.states.backToClasses"
/>
```

`error` is retryable (`router.refresh()`); everything else routes back. This is for a *resolved*
state a page fetched successfully — it is **not** an error boundary. Uncaught throws are
`error.tsx`'s job.

### `Toaster` — `@/components/ui/toaster`

Mounted once in the root layout, inside `Providers` so it reads the resolved theme. Top-right, 4s
autoclose, max 3 stacked, newest on top. Emit with `toast.success` / `toast.error` from
`react-toastify`. Colours are overridden in `components/ui/toast.css`.

### `OnboardingActions` — `@/app/(root)/_components/OnboardingActions`

The create-school / redeem-invite / join-as-student entry points for an account with no
memberships. `variant="full" | "compact"`.

---

## 10. Adding to the library

Before building anything new:

1. **Search first.** `src/components/ui`, `src/components/Custom`, the route-group `_components`,
   then the route-local one.
2. **Can an existing primitive take a prop?** Adding `size="sm"` to `Field` was cheaper and safer
   than the second `Field` that briefly existed. A prop fixes every call site; a fork fixes one.
3. **If it is genuinely new**, build it route-local, with a doc comment saying what it owns and what
   it replaced.
4. **The second consumer promotes it.** Not the third.
5. **Ship every state**: default, hover, focus-visible, active, disabled, loading. Shipping half of
   these is shipping an unfinished component (design-system §5).
6. **Add it to this file and to design-system.md §8.**

### Primitives with zero consumers

Measured 11 August 2026. These three exist in `src/components/ui` and nothing imports them:

| File | Status |
|---|---|
| `tabs.tsx` | **Superseded by `TabBar`.** Do not build against it — `TabBar` is the product's tab control and consolidated the four implementations that preceded it |
| `radio-group.tsx` | **Superseded by `Segmented`** for every mutually-exclusive choice currently in the product |
| `InputOTP.tsx` | Built ahead of an OTP signup gate that is not wired up (see `CLAUDE.md`, "Email verification … OTP at the signup gate is optional") |

A zero-consumer primitive is a trap, not an asset: the next person to need a tab row finds
`tabs.tsx` first and builds a fifth implementation. If you need one of these shapes, use the
replacement named above. If you genuinely need the Radix primitive, say so in the PR — and expect
the question of whether the product control should have grown a variant instead.

### Anti-patterns

| Don't | Do |
|---|---|
| `className="rounded-2xl border border-border bg-card p-5"` | `<Surface padding="md">` |
| A raw `<button className="bg-primary …">` | `<Button>` |
| `{pending ? <Spinner/> : <Save/>}` | `<Button loading={pending}><Save/>…</Button>` |
| A hand-written `<label>` + error `<p>` | `<Field label error>` |
| An inline `rounded-full` status span | `<Badge>` |
| `className="tabular-nums"` on a bare figure | `className="numeric"` (mono + tabular) |
| A second component that looks the same | one component with a prop |
| Copying a primitive to add one prop | add the prop |
| `dark:` overrides on a token-driven colour | fix the token |
| A raw hex, `text-[14px]`, or `shadow-[…]` | a token / `type-*` utility / `shadow-elev-*` |
| Building a Tailwind class from a template literal | write the literal strings out (see `classAccents`) |

That last one is not style advice. Tailwind matches class names as literal text in source, so a
template hole is not a class name and **the utility is never generated**. Every class-accent tile in
the product once rendered transparent for exactly this reason, and lint, `tsc`, `build`, and the
contrast gate all passed while it did.

---

## 11. Verifying the library hasn't drifted

Cheap greps that catch what the compiler cannot. `--include='*.ts'` is load-bearing — constants
files are `.ts`, and three earlier versions of these greps scanned only `.tsx` and therefore could
never fail.

```sh
# arbitrary token classes — 33 (chart ramp + semantic fills; 5 are classAccents)
grep -rEn '\b(bg|text|border|ring)-\[var\(--[a-z0-9-]+\)\]' --include='*.tsx' --include='*.ts' src

# arbitrary type sizes — 5 (2 marketing headlines, BRAND_WORDMARK_CLASSES, ScoreMeter's numeral)
grep -rEn 'text-\[[0-9.]*(px|rem)\]' --include='*.tsx' --include='*.ts' src

# raw labels — 13 (clickable radio/switch cards, Field itself, ImagePicker, login password row)
grep -rn '<label' --include='*.tsx' src

# hand-rolled spinners — 7 (Button's own, 2 save indicators, ReadinessBanner,
# ConfirmDialog's confirm, the landing mock, the Google script placeholder)
grep -rn 'animate-spin' --include='*.tsx' src

# raw Tailwind palette — must stay 0
grep -rEn '(bg|text|border)-(slate|gray|zinc|red|green|blue|indigo|violet|teal|amber)-[0-9]{2,3}' src

# every primitive should have consumers; 0 means it was built and abandoned
for f in src/components/ui/*.tsx; do
  p=$(basename "$f" .tsx)
  echo "$p: $(grep -rl "ui/$p\"" --include='*.tsx' --include='*.ts' src | wc -l)"
done
```

Counts are the baseline measured 11 August 2026 — see
[../guides/building-a-feature.md](../guides/building-a-feature.md) §6 for why each surviving
instance is correct. Watch the **delta**, not the absolute number.
