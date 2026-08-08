# Test studio (authoring and publishing)

The studio is where teachers and admins write a test and decide how it will be
delivered. It replaces the in-dashboard builder described in
[tests.md](./tests.md); that document still holds for the **data layer**, the
catalogue contract, and the list page, none of which changed.

Backend contract for the authoring half: `backend_nestJS/docs/features/tests.md`.
Backend contract for the delivery half, which is **not implemented server-side
yet**: `backend_nestJS/docs/frontend/test-delivery-and-publish-handoff.md`.

## Why a separate environment

Authoring a forty-question IELTS paper is a long, single-document task. The
dashboard shell is built for the opposite — a persistent sidebar, a centred
1180px column, and eight other places to go. The studio is a top-level route
segment with its own `layout.tsx`: no sidebar, one exit, full-width canvas, and
`--sidebar` as the surface so the change of environment is visible the moment
the route changes.

```txt
/studio/tests/new?class=<classId>   create a draft, then straight into the builder
/studio/tests/[testId]              the builder
/studio/tests/[testId]/publish      the publish wizard
```

`/studio` is in `protectedRoutes`. The class-scoped list stays where it was
(`/groups/[classId]/tests`) because it is class management, not authoring; it
links into the studio. `/groups/[classId]/tests/[testId]` is a
`permanentRedirect` — the URL is in bookmarks and in history.

## Every question type looks like itself

`_lib/questionPresentation.ts` is the registry that decides how a question is
presented while it is being written: which editor renders, how the prompt is
framed and how tall it is, the accent on its number chip, its icon, and whether
its image is the subject of the question or an attachment.

The old builder gave all twenty-six presets the same three fields and swapped
only the answer-key editor, so a True/False statement, an SAT stem and an essay
brief were identical down to the placeholder. Now:

| Preset kind | Editor |
|---|---|
| Open choice lists | option rows with an inline correct-answer marker |
| `TRUE_FALSE`, IELTS TFNG / YNNG | a fixed chip row — the wording is the type, so there is nothing to edit but the key |
| `SAT_RW_MCQ`, `SAT_MATH_MCQ` | a 2×2 lettered board, exactly four choices, no add/remove |
| Short answer, gap fill | accepted answers as chips, plus the IELTS word-limit presets |
| `NUMERIC` | value + tolerance with a live "accepts 4.15 to 4.25" read-out |
| `SAT_GRID_IN` | the numeric editor under a four-cell grid preview that catches negatives and overflow |
| Matching | a two-column board; the key is letter chips on each row, not eight dropdowns |
| `IELTS_MATCHING_HEADINGS` | matching whose right column can be filled from the passage's paragraph labels in one press |
| Ordering | a drag-ordered stack; position *is* the answer |
| Essay, IELTS writing | rubric-first, with the "nothing here is auto-graded" notice at the top |

This is presentation only. Nothing here reaches the wire, the answer key is
still stored by the seven `answerKind` engines, and a preset the registry has
never seen falls back to its engine's presentation — so the backend catalogue
can grow without a frontend release.

## The builder

One `useForm`, three nested `useFieldArray` levels, one `PUT /tests/:testId/structure`.

Performance rules (a 40-question test registers ~800 fields):

- `key={field.id}` from RHF, never the array index.
- **Nothing in `TestBuilder` subscribes to form values.** The outline rail and
  the running totals each `useWatch` inside their own component, so a keystroke
  re-renders one panel rather than the tree. This is the rule most easily broken
  by a well-meaning refactor.
- `QuestionRow` is memoised and receives only `control`, a composed `name`, and
  stable callbacks.
- `mode: "onSubmit"`.

New here: an **outline rail** (jump to any section, group or question; shows
publish flags), **autosave** after 12s of idle when the form validates,
**duplicate question**, and Cmd/Ctrl+S.

Publish issues reach the builder as a query string —
`?issues=<ids>&focus=<id>` — rather than as component state, because the wizard
is a different route and the link has to survive a navigation. It is also
shareable.

## The publish wizard

Five steps: **Check → Timing → Rules → Results → Confirm**. Only the readiness
check blocks forward movement; a bad availability window or an out-of-range
passing score is caught on its own step, where the field is visible.

The right-hand panel is a live **student preview**: every choice restated in the
second person, in the order the student meets it. Eighteen switches produce a
behaviour nobody can hold in their head, and the failure mode is specific —
turning on "end the attempt when the student leaves the screen" while meaning
"warn them", and finding out when a class submits blank papers because a
notification stole focus.

Three presets (Practice / Standard / Proctored exam) sit above the settings
steps. They are one press, and then the teacher can see and adjust exactly what
that meant.

**Nothing is locked down by default.** `DEFAULT_TEST_DELIVERY` in
`src/app/(root)/_lib/test-delivery.ts` is the least surprising delivery, not the
strictest; every integrity rule is an explicit act.

### The one thing that is blocked

`PUT /tests/:testId/delivery` does not exist server-side yet. The wizard's final
action saves metadata, then delivery, then publishes — in that order, so a test
cannot go live under rules that failed to store. When the endpoint answers 404
the wizard stops, says so, and offers an explicit *Publish without them*. That
branch exists so a stale backend does not block publishing; it disappears the
moment the endpoint ships.

## Libraries added

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`, `@dnd-kit/utilities`
  — reordering in the outline rail, ordering questions, options, and matching
  rows. Recorded in `docs/architecture/ARCHITECTURE.md`, which previously ruled
  DnD out; the up/down buttons **stay** on every row.
- `screenfull` — the "try fullscreen" demo in the integrity step. It normalises
  the four vendor spellings and, critically, exposes `isEnabled`, which is how
  the wizard can warn that a browser will not allow fullscreen at all instead of
  silently doing nothing.

## Verification

```bash
npm run lint && npm run build && npm run check:contrast
```

Walk it: class → **New test** → pick SAT → builder → add a `SAT_RW_MCQ` and an
`IELTS_TRUE_FALSE_NOT_GIVEN` and confirm they look like different questions →
reorder by drag and by the buttons → wait for autosave → **Publish** → fix a
deliberate issue through the deep link and confirm the row is ringed → pick
**Proctored exam** → read the student preview → confirm. Repeat in `ru` and `uz`
to catch missing keys, and in both themes.

## Related docs

```txt
docs/features/tests.md
docs/architecture/ARCHITECTURE.md
docs/design/design-system.md
backend_nestJS/docs/features/tests.md
backend_nestJS/docs/frontend/test-delivery-and-publish-handoff.md
```
