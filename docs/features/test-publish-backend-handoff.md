# Test publishing — backend state and handoff

Written from the frontend side after rebuilding the publish flow on
`feature-improve-test-publish`. It has two jobs:

1. **Part A** records what the backend does today for test authoring and
   publishing, verified by reading `backend_nestJS/src/tests` on the same
   branch — so the next person does not have to re-derive it.
2. **Part B** is the handoff: what the frontend now needs, why, and in what
   order.

**No backend file was modified by this work.** Part A is observation; Part B is
a request.

Base URL: `/api/v1`. Backend branch inspected: `feature-improve-test-publish`
(`1323212 Add test delivery publishing support`).

> Implemented on `feature-improve-test-publish` on 2026-08-10. B1–B6 and the
> frontend gap in Part C are now shipped in the working tree; the sections below
> remain as the design record for those contracts.

---

## Part A — what the backend does today

### A.1 Routes

All of `TestsController` sits behind `@UseGuards(JwtAuthGuard, SchoolGuard)`,
and every handler below carries `@Roles('ADMIN','TEACHER') @UseGuards(RolesGuard)`.
`STUDENT` receives 403 on all of them.

| Method   | Path                        | Notes                                                      |
| -------- | --------------------------- | ---------------------------------------------------------- |
| `GET`    | `/classes/:classId/tests`   | paginated; filtered by `status`                            |
| `POST`   | `/classes/:classId/tests`   | creates a `DRAFT` from `{ title, format }`                 |
| `GET`    | `/tests/formats`            | format blueprints + question-type catalogue                |
| `GET`    | `/tests/:testId`            | full tree **including the answer key**                     |
| `PUT`    | `/tests/:testId/structure`  | whole-tree replace; **DRAFT-only**, 409 otherwise          |
| `PUT`    | `/tests/:testId/delivery`   | whole-object replace; **works on PUBLISHED too**           |
| `PATCH`  | `/tests/:testId`            | metadata only, never the tree                              |
| `GET`    | `/tests/:testId/validation` | stored publish readiness                                   |
| `POST`   | `/tests/:testId/validation` | validates a candidate, writes nothing                      |
| `POST`   | `/tests/:testId/publish`    | candidate update + validate + publish + notify transaction |
| `POST`   | `/tests/:testId/unpublish`  | back to `DRAFT`                                            |
| `POST`   | `/tests/:testId/duplicate`  | deep clone as a new `DRAFT`                                |
| `DELETE` | `/tests/:testId`            | drafts deleted, anything else archived                     |
| `POST`   | `/tests/:testId/media`      | multipart image upload, returns `{ url }`                  |

Every mutation goes through `loadAuthorableTest()`, which answers
`NotFoundException` — never `ForbiddenException` — so a teacher cannot probe
whether another teacher's test id exists.

### A.2 The delivery model — shipped

The `test-delivery-and-publish-handoff.md` in `backend_nestJS/docs/frontend/`
describes this as _not implemented_. **That document is out of date.** All of it
landed in `1323212`:

- `model TestDelivery` exists in `../backend_nestJS/prisma/schema.prisma` with the denormalised
  `schoolId` and `@@index([schoolId])`, twenty columns, and the exact defaults
  the frontend's `DEFAULT_TEST_DELIVERY` carries.
- Enums `TestIntegrityAction`, `TestNavigationMode`, `TestResultsRelease` exist.
- `PUT /tests/:testId/delivery` upserts on `testId` and returns `{ test }` in the
  author shape.
- `sanitizeTestForAuthor` returns the full object, defaulted when no row exists.
- `sanitizeTestForTaker` withholds `resultsRelease`, `showScore`,
  `showCorrectAnswers`, `showFeedback` and emits the sixteen the student client
  needs to enforce timing and integrity.
- `duplicate` deep-clones `TestDelivery` when the source has one.
- `validateTestForPublish` emits `DELIVERY_WARNING_EXCEEDS_DURATION` and
  `DELIVERY_VIOLATION_LIMIT_MISSING`.

**Frontend consequence, already applied:** the `deliveryUnsupported` /
"Publish without them" escape hatch has been deleted. It was unreachable, and
had it ever fired against a proxy 404 it would have offered to publish an exam
with its integrity rules silently dropped.

### A.3 Publish, exactly as the frontend depends on it

`publish()` opens a transaction, re-guards `status: 'DRAFT'` with `updateMany`,
re-reads the tree, and revalidates. On failure it throws:

```ts
throw new ConflictException({
  message: "Test is not ready to publish",
  issues: validation.issues, //  [{ code, messageKey, sectionId?, groupId?, questionId? }]
});
```

**This body shape is now load-bearing.** The publish screen parses `issues` out
of the 409 and renders them in the readiness banner with deep links into the
builder. Before this change the frontend dropped the array and showed only
`message`, so a rejected publish said "Test is not ready to publish" and named
nothing. `publishRejectionIssues()` in
`src/app/(root)/_lib/test-actions.ts` is the parser; it validates with
`testValidationIssueSchema` and falls back to a plain error when the body does
not match, so a shape change degrades rather than crashes — but it degrades back
to the unhelpful behaviour.

Please treat `{ message, issues }` on a 409 from `POST /publish` as contract.

### A.4 Validation codes the frontend renders

`messageKey` is `t()`-ed directly; `code` is the fallback lookup
(`root.tests.validation.<CODE>`), then a humanised token. Both DELIVERY codes
were **missing from all three catalogs** and have now been added in `en`, `ru`,
`uz`.

`noSections`, `sectionHasNoQuestions`, `questionTypeNotAllowed`,
`questionPointsInvalid`, `groupStimulusRequired`, `choiceOptionsInsufficient`,
`singleChoiceCorrectCount`, `multiChoiceCorrectMissing`, `textAnswerMissing`,
`numericAnswerMissing`, `matchingPairsInsufficient`, `matchingKeyInvalid`,
`orderingOptionsInsufficient`, `totalPointsInvalid`, `passingScoreExceedsTotal`,
`availabilityWindowInvalid`, `DELIVERY_WARNING_EXCEEDS_DURATION`,
`DELIVERY_VIOLATION_LIMIT_MISSING`.

Any new code ships with its `root.tests.validation.<CODE>` string in all three
catalogs, or teachers read `SOME RAW CODE` on the readiness banner.

### A.5 What the publish screen sends

```txt
POST /tests/:testId/publish      { settings, delivery }
```

The backend applies and validates the candidate inside its existing publish
transaction. A rejection rolls the candidate back with the status change.

---

## Part B — implemented handoff

All items below have been implemented. They are retained to explain the design
and the compatibility requirements.

### B1. One transactional publish call — **high**

**Problem.** Publishing is three requests that are not one transaction. If step 3
rejects, steps 1 and 2 have already written. The test correctly stays a `DRAFT`,
but its stored duration, window and delivery are now the teacher's unpublished
draft values — so abandoning the screen does not abandon the edits, which is the
one thing the screen promises ("nothing is written until Publish").

It is also three round trips on a school network for one press.

**Ask.** Let `POST /tests/:testId/publish` accept an optional body and do all
three inside the existing transaction:

```json
{
  "settings": {
    "durationMinutes": 60,
    "passingScore": null,
    "shuffleQuestions": false,
    "availableFrom": null,
    "availableUntil": null
  },
  "delivery": { "...": "the twenty fields, whole-object" }
}
```

Both keys optional; an empty body must behave exactly as today, because the test
list's quick republish sends none. Apply `settings`, upsert `delivery`, then
validate, then publish — so validation sees the values being published rather
than the ones already stored. Keep the 409 `{ message, issues }` shape.

**Frontend change once shipped:** `publishTestWithDeliveryAction` collapses to
one call, and the "settings written but not published" state stops existing.

### B2. Validate a candidate, not only what is stored — **medium**

**Problem.** `GET /tests/:testId/validation` validates the saved row. The publish
screen holds the teacher's unsaved timing and delivery, so the readiness banner
can read green against stored values while the settings on screen would be
rejected — the two `DELIVERY_*` codes are exactly this class of problem.

The frontend currently avoids both cases in the client (the end-of-test warning
is clamped to `duration - 1` as the duration changes, and the violation-limit
input cannot be emptied), but that is the frontend enforcing a backend rule from
memory, which is the drift this project keeps designing away from.

**Ask.** Accept the same optional `{ settings, delivery }` body on validation —
either `POST /tests/:testId/validation` or a body-bearing `GET` alternative.
Validate the merge of stored-plus-candidate, write nothing.

**Frontend change once shipped:** the banner re-checks as the teacher edits, and
the client-side clamp in `PublishScreen.updateTiming` can be deleted.

### B3. `AVAILABILITY_WINDOW_CLOSED` — **medium**

**Problem.** `validateTestForPublish` checks `availableUntil > availableFrom` but
not `availableUntil > now`. A teacher who sets last Friday's window publishes
successfully into a test no student can open, and the class is notified about it.

**Ask.** A new blocking code when `availableUntil` is in the past at publish
time. Emit it test-level (`{ code, messageKey }`, no ids). Frontend will add
`root.tests.validation.AVAILABILITY_WINDOW_CLOSED` to the three catalogs.

### B4. Student count on the test detail payload — **low value, high polish**

**Problem.** The last thing on the publish screen states the consequence:
publishing notifies the class and unpublishing does not unsend it. It currently
reads _"Every student in the class, and the other teachers on it."_ — true, but
vague at the exact moment precision matters.

**Ask.** Add a count to `sanitizeTestForAuthor` — `counts.students`, or reuse
whatever the class summary already computes. Read-only, author payload only, and
explicitly **not** on the taker payload.

**Frontend change once shipped:** _"31 students will be notified."_

### B5. Issue severity — **low**

**Problem.** Every validation issue is blocking. Several things a teacher would
want flagged are not errors: no time limit on a test called "Final", no passing
score, a single section with forty questions. There is no way to say "this is
probably wrong" without preventing publication.

**Ask.** Add `severity: 'BLOCKING' | 'WARNING'` to the issue shape, defaulting to
`BLOCKING` so nothing changes for existing codes. The frontend's
`testValidationIssueSchema` is `.passthrough()`, so shipping the field is
non-breaking and the UI can adopt it whenever.

### B6. Fold `test-delivery-and-publish-handoff.md` into `docs/features/tests.md` — **housekeeping**

`backend_nestJS/docs/frontend/test-delivery-and-publish-handoff.md` describes
shipped work as pending, including a "how to tell it is working" section whose
success criterion — the wizard's _Publish without them_ branch — no longer
exists in the frontend. It will mislead the next reader. Its §2–§6 are now
accurate documentation of `TestsService` and belong in the feature doc.

---

## Part C — one frontend gap, recorded here because it is about this contract

`PUT /tests/:testId/delivery` deliberately works on a `PUBLISHED` test, so that
changing _"results appear when the window closes"_ to _"results appear now"_
after an exam has been sat does not require unpublishing and re-notifying the
class. The original handoff called this out explicitly and the backend
implements it.

The publish route now opens a `PUBLISHED` test in an update-delivery mode. Test
metadata controls are locked, and saving calls `PUT /delivery` alone — no
`PATCH`, no `POST /publish`, and no notification.

---

## Related docs

```txt
frontend/docs/features/test-studio.md
frontend/src/app/(root)/_lib/test-delivery.ts
frontend/src/app/(root)/_lib/test-actions.ts
backend_nestJS/docs/features/tests.md
backend_nestJS/docs/architecture/DATABASE.md
backend_nestJS/docs/architecture/RBAC.md
backend_nestJS/src/tests/tests.service.ts
```
