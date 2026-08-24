# Test taking, results and statistics

What happens after a teacher presses Publish: a student sits the paper, and the
teacher reads what the class did with it.

The backend **is built**, and the flow has been walked end to end against it —
author → publish → sit → autosave → submit → grade → statistics. The contract is
[test-taking-backend-handoff.md](./test-taking-backend-handoff.md); every Zod
schema here mirrors a shape in it, and Part E of that document records the four
places the delivered API differs from the original request.

```txt
docs/features/test-studio.md                   authoring, the other half
docs/features/test-taking-backend-handoff.md   the contract
docs/architecture/ARCHITECTURE.md              request, schema and form rules
docs/design/design-system.md                   surfaces, motion, colour
```

## Three surfaces, one renderer

| Surface                     | Route                                      | Who     |
| --------------------------- | ------------------------------------------ | ------- |
| The exam room               | `/exam/[testId]`, `/exam/[testId]/attempt` | student |
| A student's own result      | `/exam/[testId]/result/[attemptId]`        | student |
| Class results and analysis  | `/groups/[classId]/tests/[testId]/results` | teacher |
| One student's paper, marked | `…/results/[attemptId]`                    | teacher |

All four render questions through **`src/components/tests/paper/QuestionView.tsx`**,
in one of three modes — `answer`, `review`, `preview`. This is the single most
load-bearing decision in the feature. A teacher disputing a mark is looking at
the same option order, wording and layout the student saw, because it is the
same component. Two renderers agree on the day they are written and drift from
then on.

The tree it renders is `src/lib/tests/paper.schemas.ts`, which mirrors the
backend's `sanitizeTestForTaker()` and **does not describe** `isCorrect`,
`matchKey`, or the private half of `config`. A backend regression that started
sending the answer key would be dropped at the schema rather than reaching a
component that might render it.

Answer shapes live in `src/lib/tests/answers.ts` — one per grading engine,
narrowed by `readAnswer()` rather than cast, so a question retyped after a
student answered it reads as unanswered instead of rendering `undefined` into a
field they are about to submit.

## The exam room

A top-level route segment with its own `layout.tsx`, for the same reason the
studio has one and one more besides: **while an attempt is live there must be
nothing else to click.** A sidebar link to Notifications during a proctored exam
is an invitation to leave the screen, and a delivery with `leaveScreenAction:
SUBMIT` ends the attempt for that. `ExamTopBar` therefore has no exit control
during an attempt — leaving is either submitting or abandoning, and both belong
to a considered press of Submit.

### Time is server time

Three rules, and the whole runtime rests on them:

1. `expiresAt` is written once by the server at attempt creation, never
   recomputed on a read. Recomputing would restart the clock on every refresh.
2. Every attempt response carries `serverTime`. `useAttemptClock` measures the
   device's offset **once** at mount and counts down against a corrected clock,
   so a laptop an hour slow cannot buy its owner an hour of exam time.
3. The server enforces expiry; the client only displays it. The auto-submit at
   zero is a courtesy that turns "your answers are refused" into "your answers
   were handed in" — not the rule.

The countdown re-reads the deadline on every tick rather than decrementing a
counter, because a backgrounded tab has its timers throttled to once a minute
and a counter would come back minutes behind.

### Answers

`useAnswerAutosave` holds a pending map keyed by question id, drained after
2.5s of idle, on question change, and on `visibilitychange`. The last is the one
that matters on a phone, where the browser may never run another timer after the
student switches apps.

A failed flush **puts the answers back** — but never over a newer value, because
the student may have edited the same question while the request was in flight.
That is the difference between a retry and a silent undo.

### Integrity

`useIntegrityGuard` **detects and reports**; the server decides. Warn, count,
end — all resolved server-side, because a client that decided when to end an
exam is a client a modified copy simply never ends.

Copy/paste and the context menu are also prevented locally, where the point is
friction rather than proof. Neither is a security boundary and neither is
presented as one.

Every detector is debounced at 1.5s: one alt-tab fires both `blur` and
`visibilitychange`, and an overlay accusing a student twice for one act is an
accusation they know is wrong.

Required fullscreen begins on the **Start/Resume press**, before the server
action, because browsers grant it only to a direct user gesture. The fullscreen
element is `<html>`, which survives the client-side transition from cover to
paper. A refresh or restored attempt necessarily loses browser fullscreen, so
the runtime pauses behind a focused retry dialog; a rejected retry exposes the
capability fallback instead of trapping the student or consuming the attempt.

**Every rule is stated on the cover screen, in the second person, before the
attempt starts.** That is the difference between a rule and a trap.

### Three rooms, one attempt

The paper's **format decides the environment**. `AttemptRuntime` owns the
attempt — answers, autosave, clock, integrity guard, submit — and passes all of
it to an environment component that owns only the layout
(`_components/environments/`, contract in `types.ts`). That line exists because
a second implementation of _when an answer reaches the server_ is the one
duplication this feature cannot survive.

| Format          | Room               | Shape                                                                                                                                                                                        |
| --------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SAT`           | `SatEnvironment`   | Bluebook: module header left, centred countdown with a Hide control, split stimulus \| question, "Mark for Review", ABC cross-out, bottom bar with "Question X of Y" opening the grid upward |
| `IELTS`         | `IeltsEnvironment` | Computer-delivered IELTS: a **part** at a time, split passage \| all that part's questions, numbered strip along the bottom grouped by part, per-question "Review"                           |
| everything else | `QuizEnvironment`  | The product's own layout, honouring both `navigationMode` values                                                                                                                             |

`environmentForFormat` falls back to `quiz` for an unknown format, so a new
backend format renders correctly rather than failing to compile somewhere far
away.

**Every room is a full-height column**: header, one scrolling body region,
footer. Nothing scrolls under the chrome — which is what fixes the old
single-scroll page, where the sticky header floated over the paper and jumping
to a question put it behind the bar.

**The navigator is at the bottom in all three**, because that is where both real
applications put it and because a right-hand column spends width a passage needs
on something consulted a few times an hour. When `allowBackNavigation` is off it
is _locked_ to earlier questions as well — a grid that jumps to question 3 would
otherwise walk around the rule Back is enforcing. Back is removed rather than
disabled, for the same reason it always was: a permanently disabled control is a
promise the exam is not going to keep.

`ALL_AT_ONCE` (quiz only) scrolls the whole paper with **each passage sticky
beside its own questions** — grouped by material, so the sticky column ends where
the passage stops being relevant rather than following the student into the next
one. SAT and IELTS are inherently paged and stay paged whatever the delivery
says: an SAT that scrolls is not an SAT, and nothing is lost, since every
question is one press away in the grid.

### Appearance

Theme and text size, in **every** format — `ExamAppearanceMenu`, persisted per
environment. Both real applications offer it, and the reason to change either is
the student, the screen and the room, never the exam board.

Three rooms — black on white, white on black, yellow on black — implemented by
re-scoping the token layer on one wrapper (`[data-exam-theme]` in
`globals.css`), so every component inside repaints without knowing a theme
exists. Each palette is **self-contained**: it restates every token it depends
on rather than inheriting the app theme, and all three are asserted by
`npm run check:contrast` alongside `:root` and `.dark`.

## Results

`/groups/[classId]/tests/[testId]/results` answers two different questions, so
it has two shapes on one page. The **cohort summary** is always on top: four
figures and a score histogram, no click required. Below it, two tabs —
**Students** (the roster) and **Questions** (the per-question analysis).

**Every enrolled student is a row, including the ones who never started.** A
list of attempts silently omits the absentees, and the absentees are the most
actionable column on the page.

### The charts

Per `dataviz`: the histogram is one hue because ordered bins are a _magnitude_
job, not an identity one; the pass mark is a solid hairline, never dashed; and
no bar carries a permanent number — the value appears on hover and the roster
below carries every figure exactly.

The per-question analysis is a **table with inline bars**, not a bar chart.
Twenty-six questions is past the point where a chart is readable, and the
teacher's task is "find the questions that went badly", not "compare question 7
with question 22". It also _is_ the accessible table view a chart would have to
provide separately.

`discrimination` is the number worth reading and the one usually missing: a hard
question is not a problem, but a question the strong students got wrong as often
as the weak ones is. It is flagged with an icon and a word, and suppressed under
six attempts where it would be noise wearing a statistic's clothes.

### One student's paper

`…/results/[attemptId]` renders the same paper with the key beside it, plus a
points field and a feedback box on every written answer. Marking saves in one
request — a teacher marks a paper in one sitting, and a save per essay leaves a
half-graded attempt behind the moment the connection drops.

**Compare with class** is the toggle that answers "with or without other
students combined". It is a switch rather than a second screen because the two
readings answer different questions about the same answer: _did they get it
right_, and _was it a question anyone got right_. The comparison arrives with
the payload, so the toggle costs no request.

## Students' own list

`/assignments/exams` is served from `GET /me/tests`. It replaced three
hard-coded fixtures — "Midterm", "Code Sprint", "History Final" — with invented
dates and invented marks, on a route any signed-in user could reach by URL. The
fixtures are deleted, not hidden.

The seven backend states collapse into two tabs, because a student acts on one
distinction: something to do, and something already done. The row's button is
the state machine made visible — Start, Continue, See result, or a sentence
explaining why there is nothing to press.

## Motion

`src/lib/motion/` holds every variant, bound to the `--dur-*` and `--ease-*`
tokens, with the still equivalents in one place. Applied to: question insert and
removal in the builder, the paper turning in one-at-a-time delivery (directional
— direction is the information), the integrity overlay, the score meter and the
section bars, and the staggered arrival of the results table.

Not applied to: the countdown, which does not pulse. A clock that animates in
the last five minutes makes the last five minutes worse.

`prefers-reduced-motion` is honoured by every one of them.

## Verification

```bash
npm run lint && npm run build && npm run check:contrast
```

Plus the key check — every `t("…")` literal in `src/` resolving in all three
catalogs. Neither `tsc` nor ESLint sees a missing translation key.

For the API contract, run the backend locally (`npm run start:local` in
`backend_nestJS`, which uses sqlite and never touches the remote database) and
walk the flow. The failures worth designing the walk around are the ones that
only appear against a live server: an emptied numeric field, a matching key used
twice, and an IELTS question added outside a passage. All three were silent —
an autosave that never lands, or a test that will not publish — and none of them
is visible to `tsc`.

Walk it as a student: assignments → a published test → read the rules on the
cover → start and confirm a proctored test enters fullscreen before question one
→ refresh and confirm the fullscreen recovery gate appears → answer a question
of each engine → switch tabs and confirm the
answers saved → refresh mid-attempt and confirm the clock did **not** restart and
every answer came back → submit with one question blank and confirm the count in
the dialog → the result screen.

Then as the teacher: results → confirm the students who never started are listed
→ open a paper → mark an essay → turn on **Compare with class** → Questions tab
→ expand a question the class failed and confirm the distractor counts explain
why.

Repeat in `ru` and `uz`, in both themes, at `<768px`, `768–1024px` and `>1280px`,
and with `prefers-reduced-motion: reduce`.
