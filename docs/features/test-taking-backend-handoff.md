# Test taking, results and statistics — backend contract

Written from the frontend side. It is the **specification the frontend is being
built against**: every Zod schema in `src/app/exam/_lib/` and
`src/app/(root)/_lib/test-results.schemas.ts` mirrors a shape in this document,
so a divergence here is a runtime validation failure there, not a type error.

Base URL `/api/v1`. Companion documents:

```txt
backend_nestJS/docs/features/tests.md          the authoring half, shipped
docs/features/test-publish-backend-handoff.md  the delivery/publish half, shipped
docs/features/test-studio.md                   what the teacher authors
docs/features/test-taking.md                   what the frontend does with all this
```

> **Status: implemented and verified end to end on 11 August 2026.** Every route
> in Part B exists, and the flow was walked against a running server —
> author → publish → sit → autosave → submit → grade → statistics. Part E
> records the four places the delivered API differs from the request below, and
> what the frontend does about each. The rest of this document is unchanged, as
> the design record.

**No backend file was modified by this work.** Part A is observation of the code
as it stands; everything from Part B on is a request.

---

## Part A — what already exists and is load-bearing

Verified by reading `backend_nestJS/src/tests` and `prisma/schema.prisma`.

1. `Test`, `TestSection`, `TestQuestionGroup`, `TestQuestion`,
   `TestQuestionOption`, `TestDelivery` — the whole authoring tree, with
   `TestStatus` `DRAFT | PUBLISHED | ARCHIVED`.
2. `TestAnswerKind` — the seven grading engines: `SINGLE_CHOICE`,
   `MULTI_CHOICE`, `TEXT`, `NUMERIC`, `MATCHING`, `ORDERING`, `MANUAL`.
3. `sanitizeTestForTaker()` in `tests.service.ts:303` — **already written, not
   yet routed.** It drops `question.config`, `option.isCorrect` and
   `option.matchKey`, and narrows delivery to the sixteen fields a student
   client needs. Part B.2 asks for one correction and one addition to it.
4. `questionNumber` is computed at read time by walking sections → groups →
   questions, 1-based across the whole test. The student paper, the teacher's
   review and the statistics must all use this same number.
5. `ClassStudent` / `ClassEnrollment` already model who is in a class.

**There is no attempt model of any kind.** Nothing stores a student's answer.

### A.1 The group is a wire concept only

The authoring UI no longer exposes question groups; a teacher sees a part
containing a numbered list of questions, with an optional shared passage
attached to a run of them. `TestQuestionGroup` **stays exactly as it is** —
it is how a passage is shared between questions, and the frontend keeps
sending it. Do not remove it, and do not expect the group to carry a title.

---

## Part B — what to build

Four things, in this order. B1 and B2 unblock the student runtime; B3 unblocks
the teacher's results screen; B4 is the statistics roll-up.

### B.1 Schema

```prisma
enum TestAttemptStatus {
  IN_PROGRESS   // started, clock running
  SUBMITTED     // student sent it, or the clock did
  GRADED        // every MANUAL question has a mark
  EXPIRED       // window closed with the attempt still open, never submitted
  ABANDONED     // teacher voided it
}

enum TestViolationType {
  FULLSCREEN_EXIT
  LEFT_SCREEN
  COPY_ATTEMPT
  PASTE_ATTEMPT
  CONTEXT_MENU
}

model TestAttempt {
  id        String @id @default(uuid())
  schoolId  String
  testId    String
  classId   String
  studentId String                       // SchoolMember.id, not User.id

  attemptNumber Int                      // 1-based, per (testId, studentId)
  status        TestAttemptStatus @default(IN_PROGRESS)

  startedAt   DateTime  @default(now())
  // Server-authoritative deadline, written once at creation. The client
  // counts down to this and never computes it. See B.5.
  expiresAt   DateTime?
  submittedAt DateTime?
  gradedAt    DateTime?
  // True when submittedAt > test.availableUntil and allowLateSubmission is on.
  isLate      Boolean   @default(false)
  // Whole seconds the attempt was open. Written at submit, from server clocks.
  timeSpentSeconds Int?

  // Roll-ups, written by the grader in the submit transaction so the results
  // table is one query. autoScore is final at submit; manualScore fills in as
  // a teacher marks essays; score is their sum.
  autoScore    Int  @default(0)
  manualScore  Int  @default(0)
  score        Int  @default(0)
  maxScore     Int  @default(0)          // snapshot of test.totalPoints at start
  passed       Boolean?                  // null when the test has no passingScore

  violationCount Int @default(0)
  // Frozen per-attempt shuffle seed. Without it, a refresh reshuffles the
  // paper mid-attempt and every answer the student gave lands on the wrong
  // question. Required whenever shuffleQuestions or shuffleOptions is on.
  shuffleSeed  Int?

  // Awarded when the honour code is accepted, so a re-entry does not re-ask.
  honorCodeAcceptedAt DateTime?

  test       Test                   @relation(fields: [testId], references: [id], onDelete: Cascade)
  school     School                 @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  class      Class                  @relation(fields: [classId], references: [id], onDelete: Cascade)
  student    SchoolMember           @relation("TestAttemptStudent", fields: [studentId], references: [id], onDelete: Cascade)
  answers    TestAnswer[]
  violations TestAttemptViolation[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([testId, studentId, attemptNumber])
  @@index([schoolId])
  @@index([testId, status])
  @@index([studentId, status])
}

model TestAnswer {
  id         String @id @default(uuid())
  schoolId   String
  attemptId  String
  questionId String

  // The student's response, shaped by the question's answerKind. See B.6.
  value Json?

  // Grading output. isCorrect is null for MANUAL until a teacher marks it, and
  // for a partially credited MULTI_CHOICE/MATCHING (use pointsAwarded there).
  isCorrect     Boolean?
  pointsAwarded Int      @default(0)
  // Teacher's comment on this answer. Shown to the student only when
  // delivery.showFeedback is on and results have been released.
  feedback      String?
  gradedById    String?
  gradedAt      DateTime?

  // Whole seconds spent with this question on screen. Client-reported and
  // therefore advisory: use it for the "slowest questions" panel, never for
  // grading or for integrity decisions.
  timeSpentSeconds Int?

  attempt  TestAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question TestQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([attemptId, questionId])
  @@index([schoolId])
  @@index([questionId])        // the per-question statistics query
}

model TestAttemptViolation {
  id        String            @id @default(uuid())
  schoolId  String
  attemptId String
  type      TestViolationType
  // What the server did about it: WARN, COUNT or SUBMIT, resolved from
  // delivery at the moment it was reported.
  action    TestIntegrityAction
  occurredAt DateTime @default(now())

  attempt TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@index([schoolId])
  @@index([attemptId])
}
```

Add the back-relations on `Test`, `School`, `Class`, `SchoolMember`
(`@relation("TestAttemptStudent")`) and `TestQuestion`.

`@@unique([attemptId, questionId])` is what makes answer saving idempotent —
the client retries a failed batch and the upsert absorbs it.

### B.2 Two corrections to `sanitizeTestForTaker`

It is correct about what it removes. It removes **one thing too many** and is
missing one field.

**Add a public projection of `config`.** A student sitting a matching question
must see the right-hand items to match against; they are stored in
`config.rightItems`, which the sanitizer drops entirely. Word limits are also
part of the question as asked, not part of the key.

```ts
function publicConfig(answerKind: TestAnswerKind, config: unknown) {
  const c = (config ?? {}) as Record<string, unknown>;
  switch (answerKind) {
    // The pool to match against. Keys only, no pairing — the pairing is the key.
    case 'MATCHING': return { rightItems: c.rightItems ?? [] };
    case 'TEXT':     return { maxWords: c.maxWords ?? null };
    case 'MANUAL':   return { minWords: c.minWords ?? null, maxWords: c.maxWords ?? null };
    default:         return null;
  }
}
```

Never expose `acceptedAnswers`, `caseSensitive`, `answer`, `tolerance`,
`acceptedRange`, or `rubric` to a taker. `rubric` is the marking scheme; it
reaches the student only through `TestAnswer.feedback` after grading.

**Add `sectionId`/`groupId` back onto the taker question**, or keep the nesting
as it is (the sanitizer already nests, which is enough). The frontend flattens
to a numbered list and needs to know which passage a question sits under; the
existing nesting carries that.

### B.3 Student endpoints

All behind `JwtAuthGuard, SchoolGuard`, `@Roles('STUDENT')` — plus
`ADMIN`/`TEACHER` for the preview case noted below. Every one of them must
verify the caller is **enrolled in `test.classId`** and that
`test.status === 'PUBLISHED'`; answer `404` otherwise, never `403`, so a
student cannot probe test ids.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/me/tests` | the student's test list |
| `GET` | `/tests/:testId/taker` | cover-screen payload; no questions |
| `POST` | `/tests/:testId/attempts` | start or resume; **idempotent** |
| `GET` | `/attempts/:attemptId` | the paper + answers so far |
| `PATCH` | `/attempts/:attemptId/answers` | batch autosave |
| `POST` | `/attempts/:attemptId/violations` | report an integrity event |
| `POST` | `/attempts/:attemptId/submit` | grade and close; **idempotent** |
| `GET` | `/attempts/:attemptId/result` | the student's own result |

#### `GET /me/tests?status=available|in_progress|completed&page&limit`

Drives `/assignments`. One row per test, not per attempt.

```jsonc
{
  "tests": [{
    "id": "uuid", "classId": "uuid", "className": "IELTS Evening A",
    "title": "Reading Practice 3", "format": "IELTS",
    "durationMinutes": 60, "totalPoints": 40, "questionCount": 40,
    "availableFrom": "2026-08-11T09:00:00.000Z",
    "availableUntil": "2026-08-18T21:00:00.000Z",
    "attemptsAllowed": 1, "attemptsUsed": 0,
    // The row's state, resolved server-side. The client must not re-derive it
    // from dates: only the server knows what time it is.
    "state": "AVAILABLE",   // NOT_YET_OPEN | AVAILABLE | IN_PROGRESS | SUBMITTED | GRADED | CLOSED | NO_ATTEMPTS_LEFT
    "activeAttemptId": null,
    "lastAttempt": null      // or { id, status, score, maxScore, submittedAt, resultAvailable }
  }],
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1, "hasMore": false }
}
```

`resultAvailable` resolves `delivery.resultsRelease` against the clock and the
manual-release flag, so the client never has to. It is the only thing that
decides whether the student may open a result.

#### `GET /tests/:testId/taker`

Everything the cover screen needs and **nothing that gives the paper away** —
no sections, no questions.

```jsonc
{
  "test": {
    "id": "uuid", "title": "…", "description": "…", "instructions": "…",
    "format": "IELTS", "className": "IELTS Evening A",
    "durationMinutes": 60, "totalPoints": 40, "questionCount": 40,
    "sectionSummaries": [{ "id": "uuid", "title": "Reading", "kind": "READING", "questionCount": 40, "durationMinutes": null }],
    "availableFrom": "…", "availableUntil": "…",
    "delivery": { /* the sixteen taker fields from sanitizeTestDeliveryForTaker */ }
  },
  "state": "AVAILABLE",
  "attemptsUsed": 0,
  "activeAttempt": null      // or { id, startedAt, expiresAt, answeredCount }
}
```

`ADMIN`/`TEACHER` may call this for their own class's test to preview the cover;
they may **not** call `POST /attempts`.

#### `POST /tests/:testId/attempts`

Idempotent by design: if an `IN_PROGRESS` attempt exists for this student and
test, return it with `201`→`200` and **do not** start a second one. This is
what makes a refresh, a dropped connection or a second tab safe.

Request `{ "honorCodeAccepted": true }` — required when
`delivery.requireHonorCode`; reject with `422 HONOR_CODE_REQUIRED` otherwise.

Rejections, all `409` with a machine-readable `code`:
`TEST_NOT_OPEN`, `TEST_CLOSED`, `NO_ATTEMPTS_LEFT`, `TEST_NOT_PUBLISHED`.

On creation, in one transaction:

- `attemptNumber` = existing count + 1, guarded by the unique index.
- `maxScore` = `test.totalPoints` **as of now** — a snapshot, so a later edit
  cannot retroactively change what an attempt was marked out of.
- `expiresAt` = `min(now + durationMinutes, availableUntil)` when
  `durationMinutes` is set; else `availableUntil`; else `null` (untimed).
- `shuffleSeed` = a random `Int` when either shuffle switch is on.

Response is the same shape as `GET /attempts/:attemptId`.

#### `GET /attempts/:attemptId`

The live paper. **Only the owning student**, and only while `IN_PROGRESS` —
once submitted this answers `409 ATTEMPT_CLOSED` and the client goes to the
result.

```jsonc
{
  "attempt": {
    "id": "uuid", "testId": "uuid", "status": "IN_PROGRESS",
    "attemptNumber": 1, "startedAt": "…", "expiresAt": "…",
    // Authoritative clock. The client computes its countdown as
    // expiresAt - serverTime, corrected by local elapsed time, so a wrong
    // device clock cannot buy or lose a student time.
    "serverTime": "2026-08-11T09:03:12.412Z",
    "violationCount": 0, "violationLimit": 3,
    "honorCodeAcceptedAt": "…"
  },
  "test": { /* sanitizeTestForTaker, questions included, shuffle already applied */ },
  "answers": [{ "questionId": "uuid", "value": { "optionId": "uuid" }, "updatedAt": "…" }]
}
```

**Shuffle is applied server-side, deterministically from `shuffleSeed`**, and
the same order comes back on every read of that attempt. Never shuffle on the
client: the client re-renders, and an order that changes underneath a student
is indistinguishable from the app losing their answers. Questions inside a
group must stay together and a group's questions must stay in order when
`shuffleQuestions` is on — shuffle the groups, not across them, or a passage's
questions scatter across the paper.

#### `PATCH /attempts/:attemptId/answers`

The autosave. Batched by the client roughly every 2.5 s of idle, on question
change, and on blur.

```jsonc
{ "answers": [
  { "questionId": "uuid", "value": { "optionId": "uuid" }, "timeSpentSeconds": 12 },
  { "questionId": "uuid", "value": null }
]}
```

- Upsert on `(attemptId, questionId)`. `value: null` clears an answer.
- Reject with `409 ATTEMPT_CLOSED` unless the attempt is `IN_PROGRESS` **and
  owned by the caller**.
- Reject with `409 ATTEMPT_EXPIRED` when `now > expiresAt`, and — if
  `autoSubmitOnExpiry` — run the submit path first so the student's work is
  graded rather than discarded. This is the case that decides whether a student
  who lost their connection at minute 59 gets a mark.
- Validate each `value` against its question's `answerKind` and reject the
  batch with `422 INVALID_ANSWER_SHAPE` naming the offending `questionId`.
  Never coerce silently.
- **Return no grading information.** The response is
  `{ "saved": 2, "serverTime": "…", "expiresAt": "…" }`. Anything about
  correctness here is an answer key delivered mid-exam.

#### `POST /attempts/:attemptId/violations`

`{ "type": "LEFT_SCREEN", "occurredAt": "…" }`

The server resolves the action from delivery (`fullscreenExitAction` for
`FULLSCREEN_EXIT`, `leaveScreenAction` for `LEFT_SCREEN`, `WARN` for the rest),
writes the row, increments `violationCount` when the action is `COUNT`, and
replies:

```jsonc
{ "action": "COUNT", "violationCount": 2, "violationLimit": 3, "attemptEnded": false }
```

When the action is `SUBMIT`, or `COUNT` pushes the count to the limit, run the
submit path inside the same request and return `"attemptEnded": true`. **The
server ends the attempt, not the client** — a client-side end is a client-side
decision, and the client is the thing under suspicion.

Rate-limit this route hard (the existing `RateLimitService`): a wedged
visibility listener can fire hundreds of times a second.

#### `POST /attempts/:attemptId/submit`

Idempotent: submitting an already-`SUBMITTED` attempt returns the same result
with `200`, no re-grade. One transaction:

1. Re-guard `status = 'IN_PROGRESS'` with `updateMany` — this is also the
   concurrency check against a simultaneous auto-submit.
2. Grade every answer (B.6). Write `isCorrect` and `pointsAwarded` per answer.
3. `autoScore` = sum over auto-gradable questions; `manualScore` = 0;
   `score` = `autoScore`; `passed` = `test.passingScore == null ? null : score >= passingScore`.
4. `status` = `GRADED` when the paper has no `MANUAL` questions, else
   `SUBMITTED`.
5. `submittedAt`, `timeSpentSeconds` from server clocks, `isLate` per
   `availableUntil` + `allowLateSubmission`.
6. Notify the teacher (existing `NotificationsService`) — one notification per
   submission, category `TEST`.

Response `{ "attempt": { …roll-ups… }, "resultAvailable": true }`. The client
routes to the result screen or to a "your teacher will release results" state
purely on `resultAvailable`.

#### `GET /attempts/:attemptId/result`

Owning student only. **Gated on release**: when results are not yet available,
answer `200` with `{ "released": false, "releaseMode": "AFTER_CLOSE", "availableAt": "…"|null }`
and nothing else. Do not answer 403 — not-yet-released is a normal state, not
an error.

When released, the payload is governed field by field by delivery:

```jsonc
{
  "released": true,
  "attempt": { "id": "…", "status": "GRADED", "submittedAt": "…", "timeSpentSeconds": 2841,
               "score": 31, "maxScore": 40, "passed": true, "isLate": false,
               "attemptNumber": 1, "attemptsAllowed": 1 },
  // Only when delivery.showScore. Omit the whole object otherwise.
  "breakdown": { "correct": 28, "incorrect": 9, "unanswered": 3, "pendingManual": 0,
                 "sections": [{ "id": "…", "title": "Reading", "score": 31, "maxScore": 40 }] },
  // Only when delivery.showCorrectAnswers. This is the answer key: it must be
  // absent, not null, when the switch is off.
  "questions": [{
    "id": "uuid", "questionNumber": 7, "prompt": "…", "answerKind": "SINGLE_CHOICE",
    "points": 1, "pointsAwarded": 0, "isCorrect": false,
    "yourAnswer": { "optionId": "uuid-b" },
    "correctAnswer": { "optionId": "uuid-c" },
    "feedback": "…"        // only when delivery.showFeedback
  }]
}
```

### B.4 Teacher endpoints

`@Roles('ADMIN','TEACHER')`, scoped to a test the caller can author — reuse
`loadAuthorableTest()`, which already answers 404 rather than 403.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/tests/:testId/results` | the roster table |
| `GET` | `/tests/:testId/statistics` | cohort + per-question analysis |
| `GET` | `/attempts/:attemptId/review` | one student's paper, with the key |
| `PATCH` | `/attempts/:attemptId/grade` | mark the MANUAL answers |
| `POST` | `/tests/:testId/results/release` | release when `resultsRelease` is `MANUAL` |
| `POST` | `/attempts/:attemptId/reopen` | void or reopen an attempt |

#### `GET /tests/:testId/results?status&search&sort&page&limit`

**One row per enrolled student, including those who never started** — the
absences are the most actionable column on the screen, and a list of attempts
cannot show them.

```jsonc
{
  "rows": [{
    "studentId": "uuid", "userId": "uuid", "fullName": "Ольга Смирнова",
    "email": "…", "avatarUrl": null,
    "state": "GRADED",             // NOT_STARTED | IN_PROGRESS | SUBMITTED | GRADED | EXPIRED
    "attemptId": "uuid",           // the attempt being shown: the best if graded, else the latest
    "attemptCount": 1,
    "score": 31, "maxScore": 40, "percentage": 77.5, "passed": true,
    "submittedAt": "…", "timeSpentSeconds": 2841,
    "isLate": false, "violationCount": 0,
    "pendingManual": 0             // unmarked MANUAL answers; drives the "needs grading" filter
  }],
  "meta": { "page": 1, "limit": 25, "total": 24, "totalPages": 1, "hasMore": false },
  "summary": { "enrolled": 24, "notStarted": 3, "inProgress": 1, "submitted": 4, "graded": 16, "pendingManual": 4 }
}
```

`percentage` is computed server-side and rounded to one decimal, so the table,
the histogram and the CSV agree.

#### `GET /tests/:testId/statistics`

The whole analytics screen in one request. Computed over **graded and submitted
attempts only** — one per student (their best when several are allowed), never
in-progress ones, or the mean moves every time somebody scrolls.

```jsonc
{
  "cohort": {
    "attemptsCounted": 20, "enrolled": 24,
    "mean": 28.4, "median": 29, "stdDev": 5.2, "min": 14, "max": 39,
    "maxScore": 40, "passRate": 0.8, "passingScore": 24,
    "medianTimeSeconds": 2790,
    // Fixed-width buckets over percentage, ten of them, so the histogram is
    // comparable between tests. Server-side because the client must not have
    // to hold every score to draw it.
    "distribution": [{ "from": 0, "to": 10, "count": 0 }, { "from": 10, "to": 20, "count": 1 }]
  },
  "sections": [{ "id": "…", "title": "Reading", "maxScore": 40, "mean": 28.4, "meanPercentage": 71.0 }],
  "questions": [{
    "id": "uuid", "questionNumber": 7, "prompt": "…", "type": "IELTS_MCQ_SINGLE",
    "answerKind": "SINGLE_CHOICE", "points": 1, "sectionId": "…",
    "answered": 19, "unanswered": 1,
    "correct": 6, "partial": 0, "incorrect": 13,
    // correct / attemptsCounted, 0..1. The frontend labels the bands.
    "difficulty": 0.3,
    // Correct-rate in the top third minus the bottom third by total score,
    // -1..1. Near zero or negative means the question does not separate the
    // class — the single most useful number on the page. null under 6 attempts.
    "discrimination": 0.42,
    "averageTimeSeconds": 71,
    // Choice questions only: how the class spread across the options, so a
    // teacher can see *which* wrong answer they chose. Omit for other kinds.
    "options": [{ "id": "uuid", "label": "A", "text": "…", "isCorrect": false, "chosen": 11 }],
    // TEXT/NUMERIC only: the commonest wrong responses, capped at five.
    "topWrongAnswers": [{ "value": "photosynthesys", "count": 4 }]
  }]
}
```

`discrimination` needs a documented definition because two are in common use.
Use the **upper-lower index**: rank attempts by total score, take the top 27%
and bottom 27% (minimum 3 each, else `null`), and report
`correctRateTop − correctRateBottom`.

#### `GET /attempts/:attemptId/review`

The teacher's view of one paper: the full taker tree **plus** the answer key,
the student's answer, and the mark — everything `GET /result` withholds,
because delivery switches govern the *student's* view, never the teacher's.

```jsonc
{
  "attempt": { /* as in the results row, plus violations[] */ },
  "student": { "id": "…", "fullName": "…", "email": "…", "avatarUrl": null },
  "sections": [ /* the tree, questions carrying: */ ],
  "answers": [{
    "questionId": "uuid", "value": {…}, "correctValue": {…},
    "isCorrect": false, "pointsAwarded": 0, "points": 1,
    "feedback": null, "gradedAt": null, "timeSpentSeconds": 44,
    // The cohort comparison, so the "compare with class" toggle costs no
    // second request. Null when fewer than 3 attempts have been graded.
    "classCorrectRate": 0.3, "classAveragePoints": 0.3
  }],
  "violations": [{ "type": "LEFT_SCREEN", "action": "COUNT", "occurredAt": "…" }]
}
```

#### `PATCH /attempts/:attemptId/grade`

```jsonc
{ "marks": [{ "questionId": "uuid", "pointsAwarded": 7, "feedback": "Good structure, thin evidence." }] }
```

Clamp `pointsAwarded` to `0..question.points` and reject anything outside with
`422`. Recompute `manualScore`, `score`, `passed`; set `status = 'GRADED'` and
`gradedAt` once no `MANUAL` answer is unmarked. Notify the student when the
result is already released or release is `IMMEDIATELY`.

Marking a non-`MANUAL` question is allowed — an override — but must set
`gradedById`, because an overridden auto-mark needs an author.

#### `POST /tests/:testId/results/release`

`{ "studentIds": ["…"] | null }` — `null` means everyone. Only meaningful when
`resultsRelease` is `MANUAL`. Returns `{ "released": 20 }` and notifies.

Add `releasedAt DateTime?` to `TestAttempt` for this, or a
`TestResultRelease` row per test when a per-student release is wanted; the
frontend only reads the resolved `resultAvailable` boolean either way.

#### `POST /attempts/:attemptId/reopen`

`{ "reason": "…" }` — sets `IN_PROGRESS` and extends `expiresAt` by a supplied
`additionalMinutes`, or marks `ABANDONED`. This is the escape hatch for a
student whose laptop died; without it the only remedy is a second attempt on a
single-attempt test, which the teacher cannot grant.

### B.5 Time is server time

The three rules the whole runtime rests on:

1. **`expiresAt` is written once, by the server, at attempt creation.** It is
   never recomputed from `durationMinutes` on a later read — that would restart
   the clock on every refresh.
2. **Every attempt response carries `serverTime`.** The client stores
   `skew = serverTime − clientNow` at load and counts down against a corrected
   clock. A student with a wrong device clock must not gain or lose a second.
3. **The server enforces expiry; the client only displays it.** The submit and
   answer endpoints both check `now > expiresAt` server-side. A client that
   auto-submits at zero is a convenience, not the enforcement.

### B.6 Grading, exactly

`value` shapes by `answerKind`, and how each is marked. All-or-nothing unless
stated. These shapes are what the frontend sends; validate them strictly.

| `answerKind` | `value` | Marking |
|---|---|---|
| `SINGLE_CHOICE` | `{ "optionId": "uuid" }` | Full points when the option `isCorrect`. |
| `MULTI_CHOICE` | `{ "optionIds": ["uuid", …] }` | **Partial credit**: `points × max(0, (correctChosen − incorrectChosen) / totalCorrect)`, rounded down, floor 0. A student who ticks everything scores 0. |
| `TEXT` | `{ "text": "photosynthesis" }` | Match against `config.acceptedAnswers` after trimming, collapsing internal whitespace, and lower-casing unless `config.caseSensitive`. Unicode-normalise (NFC) first, so Uzbek `oʻ` typed with U+2018 matches U+02BB. Over `config.maxWords` scores 0. |
| `NUMERIC` | `{ "number": 4.2 }` | Correct when `abs(v − config.answer) <= (config.tolerance ?? 0)`, or when `config.acceptedRange` is set and `min <= v <= max`. |
| `MATCHING` | `{ "pairs": [{ "optionId": "uuid", "key": "B" }] }` | **Partial credit** per pair: `round(points × correctPairs / totalPairs)`. The key is `TestQuestionOption.matchKey`. |
| `ORDERING` | `{ "optionIds": ["uuid", …] }` | Correct when the sequence equals the options ordered by `orderIndex`. All-or-nothing: a partially reordered list has no defensible partial mark. |
| `MANUAL` | `{ "text": "…" }` | Not graded. `isCorrect` stays `null`, `pointsAwarded` 0, until `PATCH /grade`. |

An unanswered question (no row, or `value: null`) scores 0 and counts as
`unanswered`, distinct from `incorrect`, everywhere it is reported.

**Grade from the question as it is stored now**, and note the consequence:
editing a published test invalidates prior marks. The structure endpoint is
already `DRAFT`-only, which mostly prevents it; `POST /unpublish` is the hole.
Refuse to unpublish a test that has attempts — `409 TEST_HAS_ATTEMPTS` — and
let the teacher duplicate instead. That endpoint exists and is the documented
way to change a published test.

### B.7 Notifications

Reuse `NotificationsService` and the existing `NotificationCategory`:

| Event | Recipient |
|---|---|
| student submits | every teacher on the class |
| teacher grades a manual answer | that student, if released |
| teacher releases results | every student in the release |
| attempt auto-submitted on expiry | that student |

### B.8 Authorization summary

| Route | STUDENT | TEACHER / ADMIN |
|---|---|---|
| `/me/tests` | own only | — |
| `/tests/:id/taker` | enrolled + PUBLISHED | own class, preview |
| `POST /tests/:id/attempts` | enrolled + PUBLISHED | **403** |
| `GET/PATCH /attempts/:id*` | owner only | **403** on the student routes |
| `/attempts/:id/review`, `/grade` | **403** | own class |
| `/tests/:id/results`, `/statistics` | **403** | own class |

A student must never receive `isCorrect`, `matchKey`, `config.acceptedAnswers`,
`config.answer`, `config.tolerance`, `config.acceptedRange`,
`config.caseSensitive` or `config.rubric` before their result is released —
and `correctAnswer` only when `delivery.showCorrectAnswers` is on. Put this in
one serializer with a test, the way `sanitizeTestForTaker` already is, rather
than field-picking per route.

---

## Part C — build order

Each step leaves the frontend able to do more than the last.

1. **B.1 schema + B.2 sanitizer fix.** Nothing works without the tables.
2. **`GET /tests/:testId/taker`, `POST /attempts`, `GET /attempts/:id`.** The
   cover screen and the paper render.
3. **`PATCH /answers` + `POST /submit`.** A test can be sat end to end.
4. **`GET /attempts/:id/result`.** The student sees their mark.
5. **`GET /tests/:id/results` + `/attempts/:id/review` + `PATCH /grade`.** The
   teacher's screen.
6. **`GET /tests/:id/statistics`.** The analytics.
7. **`POST /violations`, `/release`, `/reopen`, `GET /me/tests`.** The
   remainder; the frontend degrades gracefully without them.

## Part D — what the frontend does in the meantime

The frontend ships against this contract now. Every request goes through
`src/app/exam/_lib/attempts.api.ts` with a Zod response schema per shape above,
so a mismatch surfaces as a `BackendResponseValidationError` naming the field
rather than as a blank screen.

Until the routes exist, `DWELVE_MOCK_ATTEMPTS=1` swaps the API module for an
in-memory fixture implementing the same signatures, so the runtime is walkable.
It is dev-only, holds no data across a restart, and is deleted the day step 3
lands. **Nothing else in the frontend branches on it** — one module is
substituted, at one seam.

## Verification the backend should be able to state

- A student cannot read another student's attempt (404, not 403).
- A refresh mid-attempt returns the same `expiresAt`, the same question order,
  and every saved answer.
- Two `POST /attempts` in the same second produce one attempt.
- Submitting twice grades once.
- A `MULTI_CHOICE` question with 3 correct of 5, answered with 2 correct and 1
  wrong, scores `points × 1/3` rounded down.
- Answers save with the tab hidden (the autosave fires on `visibilitychange`).
- `sanitizeTestForTaker` output, serialized, contains none of the eight
  forbidden keys — assert it in a test, over a fixture with every answer kind.

---

## Part E — how the delivered API differs, and what the frontend does

Recorded after walking the flow against the running backend. All four are
resolved on the frontend; none needs a backend change, though the first two
would be tidier fixed at source.

### E.1 The answer key is not shaped like an answer

`correctValue()` returns a *key*, and for three engines that is a different
shape from the answer it grades:

| Engine | Answer | Key |
|---|---|---|
| `TEXT` | `{ text }` | `{ acceptedAnswers: string[] }` |
| `NUMERIC` | `{ number }` | `{ number, tolerance }` or `{ acceptedRange }` |
| `SINGLE_CHOICE` | `{ optionId: string }` | `{ optionId: string \| null }` |
| `MANUAL` | `{ text }` | `null` |

This is right — a short answer has one response and several accepted spellings —
but it means `correctAnswer` / `correctValue` cannot be validated with the answer
schema. The frontend has a separate `answerKeySchema`, and `describeAnswerKey()`
renders the typed kinds, whose inputs have nowhere to show a key in place.

### E.2 `GET /attempts/:id/review` carries no `test`

It returns `attempt`, `student`, `sections`, `answers`, `violations`. The
teacher's header needs the test's title and the score meter needs its
`passingScore`, so the page loads `GET /tests/:testId` alongside it. Adding
`test: { id, title, passingScore }` to the payload would remove that second
request; the frontend already accepts it if it appears.

### E.3 A results row can be `ABANDONED`

`selectAttempt()` falls back to the latest attempt of any status when none is
complete, so a voided attempt surfaces as `state: "ABANDONED"` — which §B.4 did
not list. The frontend enum accepts it.

### E.4 Test notifications carry no `classId`

`TEST_SUBMITTED` and `TEST_AUTO_SUBMITTED` store
`{ testId, attemptId, testTitle, studentId }`, while the older `TEST_PUBLISHED`
also stores `classId`. Since the teacher's review URL is class-scoped, the
frontend added `/tests/:testId/results/:attemptId` — a class-agnostic redirect
that resolves the class server-side. Useful beyond notifications, so this is
worth keeping either way.

### E.5 One thing the frontend had to fix in itself

Not a backend difference, but found by the same walk and worth recording next to
it, because both are consequences of `validateAnswerValue` being strict:

- Clearing a numeric field used to send `{ number: NaN }`, which serialises to
  `{ "number": null }` and is rejected. "No answer" is now `null`, the only
  representation the API accepts.
- The matching input allowed one key on two rows; `unique(pairKeys)` rejects
  that, so picking a taken key now moves it.
- A question type declaring `requiresGroupStimulus` is now given shared material
  automatically when it is added outside any, because `validateTestForPublish`
  refuses to publish otherwise (`GROUP_STIMULUS_REQUIRED`) — and the flat
  builder, unlike the old group-based one, made it easy to land there.

Each of those was a silent autosave failure or an unpublishable test, and each
was invisible until the API was actually running.
