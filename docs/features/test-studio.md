# Test studio (authoring and publishing)

The studio is where teachers and admins write a test and decide how it will be
delivered. It replaces the in-dashboard builder described in
[tests.md](./tests.md); that document still holds for the **data layer**, the
catalogue contract, and the cross-class library.

Backend contract for the authoring half: `backend_nestJS/docs/features/tests.md`.
Backend state for the delivery and publishing half — **shipped on both sides** —
is recorded in [test-publish-backend-handoff.md](./test-publish-backend-handoff.md).

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

`/studio` is in `protectedRoutes`. The class-scoped assignments board lives on
`/groups/[classId]` and links into the studio. `/groups/[classId]/tests`
redirects to that board for older bookmarks; result and attempt-review routes
remain nested below `/groups/[classId]/tests/[testId]/results`.

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

## No groups

The backend models a test as section → **question group** → question, and the
group is load-bearing: it is how one reading passage is bound to the twelve
questions about it. The builder used to expose it directly, which meant a
teacher writing a ten-question quiz had to create a container, name it, and file
questions into it before writing one — three decisions to reach the one thing
they came to do. The container was also unavoidable: every test carries at least
one group whether or not its author wanted one.

**The group is now a wire concept only.** A part renders as one flat, numbered
list of questions. A group boundary is visible exactly where it means something,
which is where a passage starts:

- **Shared material** (`MaterialCard`) is a passage, image or set of
  instructions, sitting above the questions that depend on it. No title field —
  a group's title was never shown to a student and never read by anything.
- The questions it covers carry a **left rail** running back up to its card, so
  "these belong to that passage" is visible without nesting a second box inside
  the part and without the word "group".
- "Add group" is gone. In its place: **Add shared material** at the foot of the
  part, and **"These questions share a passage"** in a question's own menu —
  because a teacher realises several questions share a passage while looking at
  the questions.
- Deleting material **keeps its questions**; they merge into the run above.
  Deleting a passage must not delete the twelve questions about it.

`_lib/sectionBlocks.ts` is the entire translation between the two models. Every
structural edit goes through it — live values in, a new `groups` array out,
applied with one `replace()` — and that single-write rule is what makes a
cross-boundary move possible at all: dragging question 19 above the passage it
belongs to removes it from one group and inserts it into another, which a
`move()` on either group's own field array can only half express. Up and down
cross boundaries for the same reason.

Rows are keyed by a **`uid`** carried in the form values, not by
`useFieldArray`'s `field.id`: `replace()` regenerates that id, so React would
remount every row and the drag that caused the move would end on a different
element. `uid` and `hasMaterial` are builder-only and are stripped by
`buildStructurePayload`.

**A single-part test shows no part chrome at all.** "General" as a heading over
the only list on the page is a label for a distinction that does not exist; it
appears the moment a second part does, for both of them.

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

An **outline rail** — now two levels, part → question, with shared material as
a marker among the questions rather than a tier above them, labelled by its
opening words rather than by an index. Plus **autosave** after 12s of idle when
the form validates, **duplicate question**, **insert a question here**, and
Cmd/Ctrl+S.

**Optional fields collapse.** A question's hint and image render as one small
"Add a hint or an image" control until they hold something — a forty-question
paper was drawing eighty empty controls for fields most questions never use.
A diagram-label question is exempt; there the
image *is* the question.

Publish issues reach the builder as a query string —
`?issues=<ids>&focus=<id>` — rather than as component state, because publishing
is a different route and the link has to survive a navigation. It is also
shareable. **The flags re-derive themselves**: every save re-runs validation and
rewrites the query, so a fixed row stops being ringed and an untouched one stays
flagged. Clearing them outright would lose the problems the teacher has not
reached yet.

Leaving with unsaved work opens `ConfirmDialog` with three ways out — save and
leave, leave without saving, stay. **Publish** saves first and then navigates,
because publishing validates *saved* data and "continue anyway?" asked the
teacher to decide something they have no reason to have an opinion about.

## Publishing

One page. It replaced a five-step wizard (Check → Timing → Rules → Results →
Confirm), and the reason is the shape of the task: publishing is not a sequence
with dependencies, it is a settings review with **one real question in it** and
seventeen refinements that every mode already answers. The wizard charged the
same four Next presses for a ten-question homework quiz as for a proctored
final, put the presets *after* the manual switches they were meant to save the
teacher from, and — because only step one could block — reported a rejected
publish on the step furthest from the list of reasons.

Top to bottom, as the decision actually goes:

1. **Readiness** — a banner, not a step. A pass is one line; a failure lists the
   problems with deep links into the builder. It gates the Publish button and
   nothing else, so the settings below stay usable while the list is worked
   through.
2. **How students take it** — Practice / Standard / Proctored, full size. For
   most tests this is the entire interaction. Edit anything below and no card is
   selected: auto-selecting the nearest preset would be a lie, and offering
   "custom" as a fourth card invites a press that can only discard the edits.
3. **When** — the three things no mode can guess: how long, what window, how many
   attempts.
4. **Everything else** — three closed disclosures (During the test / Exam
   integrity / After they submit). Each header reads back its own state
   (`_lib/deliverySummary.ts`), so collapsing hides detail rather than
   consequence.

The right-hand panel is the live **student preview**: every choice restated in
the second person, in the order the student meets it. Twenty switches produce a
behaviour nobody can hold in their head, and the failure mode is specific —
turning on "end the attempt when the student leaves the screen" while meaning
"warn them", and finding out when a class submits blank papers because a
notification stole focus.

**Nothing is locked down by default.** `DEFAULT_TEST_DELIVERY` in
`src/app/(root)/_lib/test-delivery.ts` is the least surprising delivery, not the
strictest; every integrity rule is an explicit act.

### Rejection is not a toast

`POST /publish` answers 409 with `{ message, issues }`. Those issues are the
whole point of the response, and an `ActionError` can only carry a string — so
the message alone used to reach the screen and the list was dropped. A teacher
saw "Test is not ready to publish" and nothing else.

The action now returns a rejection as **data** (`{ published: false, issues }`)
rather than throwing, the banner renders it, and the page scrolls to it. Only a
genuine failure — network, auth, a 500 — still throws.

### Candidate validation

`validateTestForPublish` rejects `timeWarningMinutes >= durationMinutes`.
The screen sends its unsaved settings and delivery rules to
`POST /tests/:testId/validation`, so the readiness banner always describes what
is on screen rather than an older persisted row. Candidate validation writes
nothing; the publish transaction remains the only save point.

### Nothing is written until Publish

Abandoning the page changes nothing, so the unsaved-changes guard keys off edits
rather than arrival. The terminal action sends `{ settings, delivery }` once to
`POST /publish`; the backend applies it, validates it, publishes, and notifies in
one transaction. A rejected publish leaves the stored draft unchanged.

A published test may reopen the same route in delivery-only mode. Test-row
settings stay locked and the save action calls only `PUT /delivery`, so changing
result release or integrity rules does not unpublish or notify the class again.

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
confirm neither shows a hint or image field until asked → reorder by drag and by
the buttons → wait for autosave → **Publish**.

On the publish page: leave a deliberate issue in the test, follow the deep link,
fix it, save, and confirm **the ring clears on that row and stays on the others**
→ back to publish → pick **Proctored exam** → set the limit to 3 minutes and
confirm candidate validation flags an incompatible warning without persisting
either value → open each disclosure and confirm its closed header already said
what was inside → publish. Reopen the publish route for the published test,
change a delivery rule, save, and confirm no new class notification is created.

Repeat in `ru` and `uz` to catch missing keys, and in both themes. Check the page
at `<768px`, `768–1024px` and `>1280px` — the old step rail vanished below `lg`,
which is the class of bug a single-page layout cannot have.

## Related docs

```txt
docs/features/tests.md
docs/features/test-taking.md
docs/features/test-taking-backend-handoff.md
docs/features/test-publish-backend-handoff.md
docs/architecture/ARCHITECTURE.md
docs/design/design-system.md
backend_nestJS/docs/features/tests.md
```
