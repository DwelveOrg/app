# UX overhaul — August 2026

## Goal

Make the school, class, import, exam, result, dashboard, and reporting surfaces
feel like one product while preserving the existing ownership, tenancy,
authoring, attempt, and data-fetching architecture. The overhaul is complete
only when the new UI is wired to real contracts, role-safe, recoverable during
network failures, and verified in all three locales.

A working log for the multi-part correction pass requested on 2026-08-15. Every
area below records **the problem**, **the plan**, **the solution chosen**, and
**the actions actually taken**, so the reasoning survives the diff.

Status legend: ⬜ not started · 🟨 in progress · ✅ done

---

## 0. Decisions taken up front

Four questions were put to the maintainer before any code moved, because each
answer changes the shape of the work rather than its details.

| Question | Answer |
|---|---|
| How faithful should the SAT / IELTS test-taking environments be? | Faithful replicas of each exam's real environment — **plus a theme/appearance option inside every format**, not only the default one |
| Is the NestJS backend in scope? | Yes — AI-decided format and the class activity feed both get real endpoints |
| What is "assignments" on the class page? | The class tests board merges **into** `/groups/[classId]`; the standalone tests route redirects |
| How is the work verified? | `npm run lint` + `npm run build`; the maintainer reviews the screens |

Reading of the two ambiguous sentences, for the record:

- *"in schools page, remove the tabs and only classes, teachers and students can
  be viewed with modal and same works with requests"* → the school page keeps
  **classes** in the body; **teachers**, **students** and **requests** become
  modal views. Same shape as the class page instruction, which spells it out.
- *"format is also decided by ai according to the test"* → the format radio
  group leaves the import screen entirely; the model classifies the paper.

---

## 1. Backend — AI-detected format + class activity feed ✅

### Problem

1. `POST /classes/:id/tests/imports` accepted an optional `format` and defaulted
   to `SIMPLE_QUIZ`. The teacher was asked to classify a document the model was
   about to read in full.
2. There is no class-scoped activity anywhere. `Notification` rows are per-user,
   so a teacher can only see events they were personally notified about — which
   is not "what my students have been doing in this class".

### Plan

- Extend the **outline pass** (the cheap first Gemini call that already counts
  questions and locates the answer key) with a `detectedFormat` field. No extra
  model round trip, no extra cost.
- `dto.format ?? detectedFormat ?? SIMPLE_QUIZ` — an explicit client format still
  wins, so the studio can keep overriding it later.
- Add `GET /classes/:classId/activity`, derived from tables that already exist
  (attempt submissions, roster joins, test publishes). No new table, no
  write-path changes, nothing to backfill.

### Actions

- [x] `extraction.schema.ts` — `detectedFormat` on `RawImportOutline` and on
      `OUTLINE_EXTRACTION_SCHEMA` (required string, normalized at the service
      boundary rather than trusted as an enum)
- [x] `extraction.prompts.ts` — the outline prompt spells out what SAT and IELTS
      evidence actually looks like, and says subject matter is **not** evidence
      (an English worksheet is not IELTS), defaulting to `SIMPLE_QUIZ`
- [x] `extraction.service.ts` — `detectedFormat` on `ExtractionResult`, guarded
      by `safeFormat()` so an off-enum string cannot skin a worksheet as an SAT
- [x] `test-imports.service.ts` —
      `input.format ?? extracted.detectedFormat ?? SIMPLE_QUIZ`;
      `format` is now optional all the way through `run()`
- [x] `classes.{controller,service}.ts` + `dto/list-class-activity.dto.ts` —
      `GET /classes/:classId/activity`, ADMIN/TEACHER, derived on read from
      attempts + `ClassStudent` + published `Test` rows, merged and sorted
- [x] `npx tsc --noEmit` and the focused import/class test suites clean

### Notes

- A marked score is only attached to a `TEST_SUBMITTED` row once the attempt is
  `GRADED`. "0 / 20" on an unmarked paper is a failing grade nobody gave.
- No new table and no migration: a class's history is small, and a write-path
  event log would be a second place for the truth to live.

---

## 2. Import screen — alignment, AI format, progress modal ✅

### Problem

- *(screenshot 1)* "Select all" and "Clear" sit on the baseline of the **hint
  text** under the Pages field, not on the input, because the row is
  `items-end` and the `Field` is taller than the buttons.
- The FORMAT radio group asks the teacher a question the model can answer.
- *(screenshot 2)* "Building your test" is a card stranded on an otherwise empty
  page, with a static stepper. Long jobs read as hangs.

### Solution

- The two shortcuts move to the **label row**. Aligning them to the input was
  the obvious fix and the wrong one: a `Field`'s bottom edge is its hint, so
  anything aligned to it floats a line below the box. On the label row they sit
  with the word "Pages" and the input keeps the full width.
- The format fieldset is gone; a one-line note says the format is read from the
  paper. The screen simply omits `format` from the request, which is the signal
  the backend uses to apply its own classification.
- Progress is a **non-dismissible dialog** over the page selection. The page
  underneath stays mounted, so a failed import returns the teacher to the same
  grid with the same pages still ticked.

### Actions

- [x] `PagePicker.tsx` — label-row actions, `Field` replaced by an explicit
      label/input/hint trio, count folded into the hint row
- [x] `ImportScreen.tsx` — format state, the fieldset, the catalogue prop and
      `getTestFormats()` on the route all removed; stage `pages` stays rendered
      while `working`
- [x] `ImportProgress.tsx` — rewritten as the dialog, with `WorkingBar`
- [x] `globals.css` — `.working-bar-fill` (gradient drift) and
      `.working-bar-sheen` (sweep), both `background-position`/transform only so
      they stay on the compositor; both dropped under `prefers-reduced-motion`
- [x] `Dialog` gains `dismissible` — Escape and outside-click are prevented for
      a dialog reporting work already running, because dismissing it would not
      stop the job. Everything else stays dismissible.

---

## 3. Floating report button ✅

### Problem

*(screenshot 3)* The collapsed launcher is a lopsided pill, not a circle: the
label span is `md:inline` with `max-w-0`, but the parent's `gap-2` still
reserves its gutter, so the button carries 8px of dead space on the right.

### Solution

`size-12` + `rounded-full` — a square box with a full radius is a circle, where
padding-plus-content is whatever the content happens to measure. The label is
`hidden` while collapsed rather than zero-width, so it contributes no gap, and
the pill expands to `w-auto` on hover/focus, fitting whichever of the three
translations is rendered.

---

## 4. School page ✅

### Solution

`SchoolTabsSection` (5 tabs, two of them permanently disabled "soon"
placeholders) → `SchoolDirectorySection`. Classes are the page. Teachers,
Students, and — for a student — their own pending requests are counted buttons
opening `PanelDialog`.

The counts are the argument: a tab row can only count the tab already selected,
so an admin had to leave the classes they came for to find out how many teachers
the school had.

### Actions

- [x] `PanelDialog` — new shared launcher+panel; contents mount on open, so a
      roster query behind an unpressed button never fires
- [x] `SchoolDirectorySection.tsx` replaces `SchoolTabsSection.tsx` (deleted)
- [x] `MyClassRequestsView` gains `variant="embedded"`, matching
      `StudentClassesView`, so the dialog's own title is not doubled

---

## 5. Class page ✅

### Solution

The body is the **assignments board**, merged in from `/groups/:id/tests` (now a
redirect — old notification links must still land somewhere sensible). Roster
and request queues became header panels with counts. A new **class activity**
section answers the question notifications never could: not "what was I told",
but "what have my students been doing".

New UX for the board, not just a move: lifecycle is a filter over one
collection, so three full-width tabs that each read as a section heading became
one `Segmented` control, and single-column rows became a two-column grid.

### Actions

- [x] `ClassAssignmentsBoard.tsx` — segmented lifecycle filter, 2-col grid,
      pagination, `AiImportCta`
- [x] `ClassActivitySection.tsx` + `class-activity.schemas.ts` +
      `listClassActivityRequest` / `listClassActivityAction` / `useClassActivity`
- [x] `ClassPeopleButtons.tsx` + `ClassRosterList.tsx` replace
      `ClassRosterSection.tsx`; `ClassRequestsButton` now opens the panel it
      used to anchor-scroll to, and `ClassRequestsSection.tsx` is deleted
- [x] `TestCard`/`DeleteTestDialog`/`DuplicateTestButton` moved up to
      `[classId]/_components/`; `TestsListView.tsx` deleted
- [x] `TestCard.onRequestDelete` is optional — absence removes the control
      rather than disabling it, for a viewer who may not delete

---

## 6. Exam environments ✅

### Problem

- *(screenshot 4)* The sticky exam header overlaps the question it scrolled to,
  and the question navigator occupies a right-hand column.
- One layout serves every format, so an SAT paper does not look like an SAT.

### Solution

**The format decides the room.** `AttemptRuntime` keeps the attempt — answers,
autosave, clock, integrity guard, submit — and hands all of it to an environment
that owns only the layout. That line is not stylistic: a second implementation of
*when an answer reaches the server* is the one duplication this feature cannot
survive, and the prop-bag contract in `environments/types.ts` makes writing one
by accident impossible.

| Format | Room |
|---|---|
| `SAT` | Bluebook: module header, centred countdown with Hide, split stimulus \| question, "Mark for Review", ABC cross-out, bottom "Question X of Y" opening the grid upward |
| `IELTS` | Computer-delivered IELTS: a **part** at a time, split passage \| all that part's questions, numbered strip along the bottom grouped by part, per-question "Review" |
| anything else | The product's own layout, honouring both `navigationMode` values |

**The overlap fix is structural, not a `scroll-margin` patch.** Each room is a
full-height column — header, one scrolling body region, footer — so there is no
way for content to travel under the chrome. That also removes the sticky-header
class of bug entirely rather than tuning an offset per breakpoint.

**The navigator moved to the bottom in all three**, as asked, and it is *locked*
to earlier questions when `allowBackNavigation` is off — a grid that jumps to
question 3 would otherwise walk around the rule Back is enforcing.

**Theme options in every format**, per the maintainer's note on the question.
Three rooms — black on white, white on black, yellow on black — plus four text
sizes, implemented by re-scoping the token layer on one wrapper, so every
component inside repaints without knowing a theme exists. The same attributes go
on `<body>` for the duration of the attempt, because the submit dialog portals
there and would otherwise open white over a yellow-on-black exam.

### Actions

- [x] `_lib/exam-environment.ts` — format → room, theme/size registry, defaults
- [x] `_hooks/useExamAppearance.ts` — `useSyncExternalStore`, not state-in-effect
      (the linter is right: the stored value cannot exist at first render, and
      `getServerSnapshot` is exactly the shape for that)
- [x] `globals.css` — `[data-exam-theme]` × 3 and `[data-exam-size]` × 4, placed
      after `.dark` so equal specificity resolves in the room's favour
- [x] `ExamShell`-less design: `ExamPopover` renders **in place** rather than
      portalling, so panels stay inside the themed scope
- [x] `SatEnvironment`, `IeltsEnvironment`, `QuizEnvironment`, `CrossOutRail`,
      `ReviewToggle`, `ExamAppearanceMenu`
- [x] `QuestionNavigator` — `lockedBefore`, no legend when the chrome states it
- [x] `QuestionView` — `hideMeta` and `struckOptionIds`; prompt/options take
      `exam-prose`, which resolves to nothing outside an exam
- [x] `ExamTopBar` is no longer used by the attempt (each room has its own
      header); it stays for the cover, submitted and result screens

### Notes

- Cross-out state is client-side and never persisted. It is thinking, not
  answering, and scratch work a teacher could read would change what students
  are willing to write down.
- Each exam palette is **self-contained** rather than a partial override. A
  partial one inherits from whichever app theme the student runs, which would
  have put dark-mode semantics — a 2:1 green "correct" — on the white paper
  room.

---

## 7. Result screen ✅

*(screenshot 5)* A `max-w-3xl` column on a bare canvas: on any ordinary display
three quarters of the page was empty, and the number the student had just spent
an hour earning was set at heading size in the corner of it.

Now full-bleed to `max-w-6xl`, the score at `clamp(3.5rem, 9vw, 6rem)` via a new
`ScoreMeter size="lg"`, tallies as cards rather than a label row, review in two
columns, on `.exam-result-bg` — a wash whose tint is driven from the same `tone`
as the meter through `--result-tint`, so the page reads as passed or failed
before a word of it is parsed and the two can never disagree.

---

## 8. Dashboard ✅

- **Recent activity** was six roomy rows — a panel as tall as the performance
  chart, for a list whose every row is also in Notifications. Now four dense
  single-line rows with the time inline and a link through to the full feed.
- **Import** became `AiImportCta`, the same component the class board uses, so
  the product's fastest path looks identical wherever a teacher meets it.

---

## 9. Translations, lint, build ✅

- [x] Every new key in `en`, `ru` and `uz` — verified by key-count parity
- [x] `npm run lint` clean
- [x] `npm run build` compiles; all 35 routes build
- [x] `npm run check:contrast` — **extended** to gate the three exam rooms
      alongside `:root` and `.dark`, since the CLAUDE.md rule is that the gate
      must pass after any palette change and this pass added a palette. Sidebar
      and chart pairs are skipped in exam rooms (no navigation during an
      attempt, no charts), and the hue guards are skipped for the high-contrast
      room, where collapsing to one hue is the feature.
- [x] Focused test-import and class-activity suites on the backend

### Docs updated

- `docs/features/test-taking.md` — the three rooms, the structural overlap fix,
  the bottom navigator, the appearance system
- `docs/features/test-import.md` — the progress dialog, and why there is no
  longer a format picker

---

## 10. Review and hardening ✅

The generated implementation received a second pass against the frontend and
backend architecture guides, RBAC contract, route tree, and attempt lifecycle.

- [x] Fixed the autosave race where a flush during an in-flight request could
      strand the newest answer, and blocked manual submission when the final
      save fails
- [x] Added a synchronous submit lock so expiry, integrity enforcement, and a
      student click cannot submit the same attempt concurrently
- [x] Moved exam scrolling to after-render environment effects; SAT/IELTS pane
      changes and one-at-a-time quiz navigation now reset the correct scroller
- [x] Preserved the save indicator when the SAT timer is hidden and enforced
      no-back navigation through IELTS part/question controls
- [x] Applied appearance text sizing to prompts, passages, choices, matching,
      ordering, text, and numeric answers without changing studio/review sizes
- [x] Server-seeded the default class assignments page and class activity feed;
      the activity feed polls through the shared query policy
- [x] Server-seeded the student and teacher School directories while retaining
      React Query for request-driven refreshes
- [x] Removed internal navigation through `/groups/:id/tests`; the route remains
      only as a compatibility redirect
- [x] Scoped teacher activity to their own authored tests, filtered started
      events to live `IN_PROGRESS` attempts, and linked submissions to their
      attempt review
- [x] Prevented the student list, submit response, and result payload from
      exposing scores or pass/fail before the configured release policy allows
      them
- [x] Added detection/fallback, activity ordering/ownership, and student result
      visibility assertions to the backend tests
- [x] Removed generated explanatory comments from the changed source while
      retaining architecture and feature documentation
