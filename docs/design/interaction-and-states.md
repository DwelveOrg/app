# Dwelve — Interaction and States

Status: v1 · Last updated: 11 August 2026

Every screen in this product is a state machine, and most UI bugs are a missing state rather than a
wrong pixel. This file enumerates the states a control and a screen must ship, and which channel
each kind of feedback belongs in.

**Related:** [component-library.md](./component-library.md) (the components) ·
[layout-and-composition.md](./layout-and-composition.md) (page anatomy) ·
[accessibility.md](./accessibility.md) · [design-system.md](./design-system.md) §5 (motion tokens)

---

## 1. The six control states

**Every interactive component ships all six. Shipping half of these is shipping an unfinished
component.**

| State | Signal | Where it comes from |
|---|---|---|
| Default | Resting treatment | the variant |
| Hover | Colour shift; `interactive` lifts `-2px`, `interactive-flat` doesn't move | the `interactive` utilities |
| Focus-visible | `ring-3 ring-ring/40` (or `ring-2` on smaller controls) | never removed, never `outline-none` alone |
| Active / press | Settles to 0 (lift) or `scale(0.99)` (flat) | the `interactive` utilities |
| Disabled | `opacity-50` + `pointer-events-none`, or `opacity-60 cursor-not-allowed` for inputs | `disabled:` variants |
| Loading | `Button loading` — spinner replaces icons, label stays, `aria-busy` | the primitive |

Rules:

- **`interactive` vs `interactive-flat`.** `interactive` for cards and buttons. `interactive-flat`
  for list rows, nav items, tabs — anything where a 2px lift would read as a layout shift.
- **Never remove a focus ring.** `outline-none` is only ever paired with an explicit
  `focus-visible:ring-*`.
- **Disabled needs a reason the user can see.** A disabled submit with no error message and no hint
  is a dead end. Prefer enabling the button and surfacing the validation error on submit.
- **Hover is not a state on touch.** Anything only discoverable on hover must also be reachable by
  tap and by keyboard. `RowActionsMenu variant="floating"` exists for exactly this.

---

## 2. Screen states

Every screen that reads data has five possible outcomes. Handle all five or you have shipped one of
them as a blank page.

| Outcome | Component | Notes |
|---|---|---|
| **Loading** | `loading.tsx` → `SkeletonPage`, or `SkeletonList` in a panel | never a bare spinner |
| **Empty** | `Empty` with an `action` | teach the interface, don't just report absence |
| **Populated** | the real view | |
| **Forbidden / not found** | `ResourceStateView reason="forbidden" \| "notFound"` | routes back, not retryable |
| **Failed** | `ResourceStateView reason="error"` (resolved) or `error.tsx` (thrown) | retryable |

### Loading

- Route-level: a `loading.tsx` that mirrors the real page's block rhythm, so the swap doesn't jump.
  Pass `SkeletonPage`'s `actions` count so the header doesn't drop a phantom button.
- Panel-level: `SkeletonList`, which carries its own `aria-busy` — its blocks are `aria-hidden`, so
  without it a screen reader is told nothing at all while data loads.
- In-place refresh (a filter change, a tab switch): keep the previous content and dim or disable it.
  Replacing a loaded list with skeletons on every keystroke is worse than a stale list.
- **A spinner is only correct inside a button.** The three non-button spinners in `src` are a
  landing-page mock, a third-party script placeholder, and `ConfirmDialog`'s confirm button.

### Empty

An empty state should **teach the interface**. `Empty`'s `action` prop is where the way forward
goes; a bare "nothing here yet" is an unfinished screen.

- `variant="dashed"` — a slot the user is meant to fill ("add your first question").
- `variant="card"` — a genuine "nothing here yet" that is not the user's move to make.
- Distinguish *empty* from *filtered-to-nothing*. "No classes yet → create one" and "No classes
  match 'xyz' → clear the filter" are different screens with different actions.

### Forbidden / not found / error

Server helpers classify the failure rather than throwing, so each case gets its own UI:

```ts
export type ClassFetchResult =
  | { ok: true; class: ApiClass }
  | { ok: false; reason: "forbidden" | "notFound" | "error" };
```

The backend answers 403 when the viewer belongs to the school but not the class (a student with a
pending request) and 404 when the class doesn't exist or is invisible to them. Keeping those apart
is the difference between "you don't have access yet" and "this doesn't exist".

`error` is retryable and offers `router.refresh()`. `forbidden` and `notFound` are not — they route
back.

### Thrown errors

`ResourceStateView` is for a **resolved** state a page fetched successfully. An uncaught throw is a
different thing and hits a boundary:

- `(root)/error.tsx` — the authenticated shell's boundary. Offers `reset()` and a route home, and
  logs `error.digest`, which is the only handle on the server stack that Next keeps out of the
  client payload in production. Without that log, "the page broke" ties to nothing in the server
  logs.
- `app/not-found.tsx` — renders a page, deliberately **not** a `redirect()`. A redirect is a thrown
  value internally, which React's dev instrumentation mis-measures, and it also hides the invalid
  URL from the user.
- `app/global-error.tsx` — last resort, catches throws in the root layout. It replaces the whole
  document, so it renders its own `<html>`/`<body>` and cannot use i18n, theme, or tokens: the tree
  that would have provided them is what failed. This is the one file where hard-coded hexes and
  English-only copy are correct.

A Zod response schema drifting against the NestJS backend is the most likely source of a real throw
here. Treat that as the design case.

---

## 3. Feedback channels

Pick by permanence and by whose attention it needs.

| Channel | Use for | Don't use for |
|---|---|---|
| **Inline field error** (`Field error`) | Validation on a specific input | anything not tied to one field |
| **Inline form banner** (`errors.root`) | A submission that failed as a whole | field-level problems |
| **Toast** (`react-toastify`) | The outcome of an action the user just took | anything they must read to continue |
| **Dialog** | A decision that must be made now | reporting a result |
| **Badge / status pill** | Persistent state of a thing | transient events |
| **Save indicator** | Continuous background persistence | one-off saves |
| **Empty / state view** | The state of a whole screen | a single row's problem |

Toast rules:

- Mounted once in the root layout. Top-right, 4s, max 3 stacked, newest on top.
- `toast.success` for a completed mutation; `toast.error` for a failed one. Nothing else is in use,
  and adding a fourth kind needs a reason.
- **A toast is not a place for information the user needs.** It disappears. Anything they must act
  on goes inline or in a dialog.
- Message text is `t(...)`, and for errors it is the message the server action returned — which is
  either an explicit `ActionError` or the masked `GENERIC_ACTION_ERROR`.
- Pair a toast with the state change it describes. A "Saved" toast over a list that still shows the
  old value is worse than no toast.

The standard mutation outcome, from `CreateSchoolForm`:

```tsx
mutation.mutate(data, {
  onSuccess: () => { clearErrors("root"); toast.success(t("…")); router.push("/dashboard"); router.refresh(); },
  onError: (error) => {
    const message = error instanceof Error ? error.message : t("…");
    setError("root", { message });   // stays on screen
    toast.error(message);            // gets attention
  },
});
```

Both channels, deliberately: the toast is the notification, the root error is the record.

---

## 4. Destructive actions

Every irreversible action goes through `ConfirmDialog`. No exceptions, and no bespoke confirmations.

The vocabulary, so danger reads at one consistent level everywhere:

| Step | Treatment |
|---|---|
| Entry point in a row menu | `RowActionsMenu` action with `destructive: true` |
| Entry point as a button | `Button variant="destructive"` (tinted, not solid) |
| The zone it lives in | `Surface variant="danger"` for a whole destructive section |
| The confirmation | `ConfirmDialog` (Radix `AlertDialog` — overlay clicks do **not** dismiss) |
| The irreversible click | `Button variant="destructive-solid"` — solid red, only here |

Rules:

- **Solid red means "this is the click".** Reserve `destructive-solid` for the confirm step so it
  never appears as an entry point.
- The confirm button suppresses Radix's auto-close, so the pending state stays visible until the
  mutation settles. The caller closes the dialog.
- Name the thing in the description: "Delete *IELTS Practice 1*?", not "Delete this test?".
- When rejecting someone's request, use `MessagePromptDialog` — a rejection without a reason is a
  worse product than one extra field.
- Say what will not come back. "This also deletes 40 questions and 12 attempts" belongs in the
  description, not in the user's discovery.

---

## 5. Async and persistence

### One-off mutations

The button owns the pending state (`Button loading`), the mutation owns the cache invalidation, the
toast owns the announcement. Do not disable the whole form; disable the submit.

Also disable the **cancel** control while busy (`DialogFooterActions` does this) so a dialog can't be
dismissed mid-write.

### Autosave

Two environments autosave, and both follow the same three rules:

1. **It never fires mid-thought.** The studio waits `IDLE_DELAY_MS` (12s) after the last change; the
   timer restarts on every edit.
2. **It never nags.** An autosave blocked by validation — a half-written option with no text —
   reports `blocked` and waits silently. The teacher is mid-edit and knows the row is unfinished.
   Explicit save still reports the error properly.
3. **It always says what it did.** `SaveState` (studio) and `SaveIndicator` (exam) are the only
   evidence the user has, and *autosave that does not say so is indistinguishable from data loss*.

Both indicators pair an **icon with its own wording**, never a coloured dot — "unsaved" has to
survive a greyscale screenshot and a colour-blind reader. The exam's failed state is the loud one
(amber + icon + words) because a teacher who loses a draft can retype it and a student who loses an
answer cannot re-sit the exam.

Neither ever claims more than it knows: "Saved" appears only after a write the server acknowledged,
and returns to "Saving…" the moment anything changes.

### Unsaved changes

`useUnsavedChangesWarning(isDirty)` attaches a `beforeunload` handler only while the form is dirty.

**Know its scope.** It covers reload, tab close, and navigation away from the origin. It does **not**
cover in-app `<Link>` navigation — the App Router exposes no navigation interception API, so a
sidebar click still discards the form. Don't rely on it as a complete guard, and don't remove the
autosave that makes it survivable.

---

## 6. Motion

Tokens and philosophy: design-system §5. Values in code: `src/lib/motion/index.ts` (mirrored from
`globals.css` because motion components can't read a CSS custom property as a number — keep the two
in step).

| Duration | Token / `DUR` | Use |
|---|---|---|
| 120ms | `--dur-1` / `DUR.colour` | Colour and state |
| 180ms | `--dur-2` / `DUR.press` | Hover, press, exits |
| 260ms | `--dur-3` / `DUR.reveal` | Enter, exit, accordion, page entrance |
| 360ms | `--dur-4` / `DUR.layout` | Genuine layout moves (a row travelling through a list) |

`--dur-1` and `ease-out-quint` are Tailwind's *defaults* in this project, so a bare `transition` or
`transition-colors` is already on-system. Only say `duration-[var(--dur-3)]` when you genuinely need
something else.

Shared variants — use these rather than inventing a transition:

| Export | For |
|---|---|
| `listRowVariants` | A row entering/leaving a list. Animates `height` so the list visibly heals where the row was |
| `disclosureVariants` | A panel opening in place |
| `staggerContainer` / `staggerItem` | A list arriving |
| `paperTurnVariants` | Moving between exam questions. Directional — `custom` is `1` forward, `-1` back, because direction *is* the information |
| `revealTransition` / `listMoveTransition` | One-off inline transitions |

Rules:

- Motion conveys **state**, not personality. Ease out; no bounce, no elastic.
- **No page-load choreography.** The app loads into a task. `layout-enter` is 260ms, once.
- Leaving is quicker than arriving (`DUR.press` out, `DUR.reveal` in) — a deletion is a decision the
  moment it's pressed, and holding the row on screen reads as lag.
- **`prefers-reduced-motion` is not optional.** Every animation needs a still equivalent, including
  the tactile lift, which is a transform like any other. `globals.css` neutralises `interactive`,
  `interactive-flat`, and all keyframes; for `motion` components use `useReducedMotion()` with
  `motionVariants()` / `motionTransition()` / `stillVariants`.
- A `layoutId` must be unique per mounted control, or two `TabBar`s / `Segmented`s share one sliding
  indicator.
- Reveal-on-scroll must animate **from an already-visible default**, not from `opacity: 0`. If the
  IntersectionObserver never fires — a crawler, a print stylesheet, a headless renderer — an
  `opacity: 0` default ships a blank section. `FeatureBullets` documents the right pattern; the
  landing section wrappers currently do not, and that is a known open item.

---

## 7. Freshness

Stale data that looks fresh is the failure mode this product is most prone to, because nothing about
a stale panel looks wrong.

- **Query defaults** (`QueryProvider`): `staleTime` 30s, `retry` 1, `refetchOnWindowFocus: false`,
  mutations `retry: 0`.
- **After a mutation, invalidate.** In the mutation hook's `onSuccess`, not in the component. Use the
  broad `*All` key when several variants exist.
- **Tab switches must declare `refresh`.** Tabs here switch on local state — nothing remounts, no key
  changes, so without it a tab switch fires no request at all.
- **Server-rendered panels need `router.refresh()`**, not `invalidateQueries` — only a new RSC render
  refreshes RSC props. `TabRefresh` carries both fields for exactly this reason.
- When a mutation changes something the server rendered, do both: `invalidateQueries` and
  `router.refresh()`.

Details: [`../architecture/RENDERING_AND_STATE.md`](../architecture/RENDERING_AND_STATE.md).

---

## 8. Checklist

For a control:

- [ ] default / hover / focus-visible / active / disabled / loading
- [ ] focus ring present and visible in both themes
- [ ] `interactive` vs `interactive-flat` chosen for whether it may move
- [ ] reachable and operable by keyboard and by touch
- [ ] reduced-motion equivalent

For a screen:

- [ ] loading, empty, populated, forbidden/not-found, failed
- [ ] empty state carries an action
- [ ] failures classified (403 vs 404 vs other), not collapsed into one message
- [ ] every mutation: pending state, success feedback, error feedback, cache invalidation
- [ ] destructive actions go through `ConfirmDialog`, with the subject named
- [ ] anything long-form autosaves and says so
