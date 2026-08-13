# AI PDF to Test (importing a test from a PDF)

A teacher uploads a PDF, chooses the pages that hold the test, and gets a draft
in the studio with the questions and options filled in. Answers are filled only
where the selected pages explicitly mark them. The point of the feature is what
does *not* happen: nobody retypes a paper.

```txt
upload a PDF  →  say which pages  →  get a ready test
```

The import produces an ordinary DRAFT test. Everything downstream — the builder,
publish validation, delivery rules, grading, analytics — treats it exactly like
a test written by hand, because it is one. See
[test-studio.md](./test-studio.md) for the authoring environment it lands in.

Backend contract: `backend_nestJS/docs/features/test-import.md`. The plan behind
both halves is `AI_PDF_TO_TEST_PLAN.md` at the repository root.

## Where it starts

Three entry points, because a teacher holding a PDF arrives from three places:

| Route | Entry |
|---|---|
| `/studio/tests/new?class=<classId>` | a panel beside the format picker — this is the screen where a teacher decides *how* a test comes into existence |
| `/groups/[classId]/tests` | an **Import PDF** button beside **New test** |
| `/dashboard` | a panel with a class picker, since the dashboard has no class in context |

All three land on `/studio/tests/import?class=<classId>`, which is inside the
studio shell for the same reason `/studio/tests/new` is: it creates a test that
does not exist yet, so there is nothing to put at `/studio/tests/<id>`.

## The three states

One screen, no wizard chrome. Picking pages *is* the second step.

| State | What the teacher sees |
|---|---|
| `choose` | a dropzone. The file is read in the browser — nothing is uploaded yet |
| `pages` | the page grid, the question-count field, and the answer rule. Primary action: **Create test** |
| `working` | the vertical loader, until it redirects into the builder |

## Choosing pages

`_components/PagePicker.tsx` renders thumbnails with `pdfjs-dist`, **in the
browser**, before anything is uploaded. That is what makes an over-long document
refusable without spending bandwidth, and what lets the page count appear
instantly.

- click a page to toggle it; **shift-click** selects the run between two pages
- the text field (`1-4, 7, 11-13`) is the same selection in the notation the
  backend takes, and stays in sync both ways
- reaching the cap **disables** further pages rather than ignoring clicks — a
  teacher who cannot tell whether a click registered will click again

`parsePageRange` / `formatPageRange` in
`src/app/(root)/_lib/test-import.actions.schemas.ts` are the two halves of that
sync. The backend re-parses the same string with its own implementation; the
browser copy exists only to keep the grid and the field agreeing.

The worker is bundled locally via `new URL("pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url)`. It is never loaded from a CDN — `SECURITY.md` and the CSP
govern what this app may fetch at runtime.

## The answer rule

> **Answers are pre-selected only where the selected pages explicitly mark
> them. Otherwise the question is left blank for the teacher.**

A ticked box, a bold or circled option, an underline, or an answer-key table
*inside the selection* is evidence, and the AI uses it. Subject knowledge is
not. The AI never solves a question.

This is not timidity, it is a choice between two failures. **A blank answer is
visible**: the teacher sees it in the editor, the import banner counts it, and
publish validation refuses to publish until it is filled. **A confidently wrong
answer is invisible** — it looks exactly like a correct one, and it gets
published and graded against real students.

The rule is also enforced structurally rather than by prompting: the backend
slices the PDF down to the selected pages *before* the model sees it, so an
answer key the teacher did not select was never sent. The practical corollary,
which the import screen states next to the page grid:

> Include your answer-key page in the selection if your test has one.

## The limits

Served by `GET /tests/imports/limits`, never hard-coded in a component, so
raising a page or question cap server-side updates the picker without a
frontend deploy — the same principle `GET /tests/formats` uses for format
blueprints. Raising the file-size cap above 20 MiB also requires increasing
Next's Server Action transport ceiling in `next.config.ts`.

| Limit | Default | What it governs |
|---|---|---|
| Questions per import | 100 | how many questions one import may create |
| Pages per import | 40 | how many pages may be sent to the AI at once |
| Pages per document | 300 | how large a document may be opened and browsed |
| File size | 20 MB | the upload |
| Imports per school per day | 50 | cost control |

Two page limits, because selection separates them: a 280-page textbook is a
perfectly valid upload as long as the teacher selects a test-sized slice of it.

Every limit is visible **before** it is hit:

- a live `8 of 40 pages selected` counter
- a `Questions to create` field labelled `up to 100 per import`
- pages beyond the cap disabled in the grid
- a failure message that names the relevant limit
- the import banner reporting truncation when it happened

`FALLBACK_IMPORT_LIMITS` in `test-import.schemas.ts` is what the UI uses before
the request resolves, and if it fails. If the two ever disagree, the server
wins — it rejects the request regardless of what the UI allowed.

## Waiting

Extraction takes tens of seconds to minutes, which is why it is a background job
and not a blocking request. `_components/ImportProgress.tsx` renders a vertical
stepper driven by the job status, so the wait names its stage instead of
spinning:

```txt
● Uploading your file        done
● Reading the pages          done      12 pages
◉ Finding questions          active    38 of 60
○ Building your test
```

`useTestImportJobQuery` polls every 2s and stops via `refetchInterval` returning
`false` at a terminal status — not a cleared timer a remount could resurrect.
On `READY` the screen redirects to the builder.

## Reviewing — there is no import-specific editor

The teacher edits in the normal studio builder. The "select which correct
answer" surface already exists and needed no changes:

| Component | Handles |
|---|---|
| `studio/_components/editors/ChoiceEditor.tsx` | open option lists; radio for single-choice, checkbox for multi |
| `studio/_components/editors/FixedChoiceEditor.tsx` | TRUE/FALSE, TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN |
| `studio/_components/editors/LetteredGridEditor.tsx` | lettered A–D grids (SAT-style) |

The only addition is `studio/_components/ImportSummaryBanner.tsx`, shown when
the builder is opened with `?import=<jobId>`. It reports facts the tree cannot
show because they are *absences*: how many questions still need a correct
answer, whether the per-import limit cut the extraction short, or whether an
outline count was larger than the usable batch output. It is a signpost, not a
safety net — publish validation independently refuses a test with unanswered
questions.

The job id rides the query string for the same reason publish issues do: the
importer is a different route, and component state does not survive the
navigation between them.

## Files

```txt
src/app/(root)/_lib/test-import.schemas.ts          response schemas — the backend contract
src/app/(root)/_lib/test-import.actions.schemas.ts  input schemas + page-range helpers
src/app/(root)/_lib/test-import.api.ts              named endpoint functions
src/app/(root)/_lib/test-import.actions.ts          server actions (FormData upload)
src/app/(root)/_hooks/useTestImport.ts              queries, polling, mutations
src/app/studio/tests/import/page.tsx                the route (ADMIN + TEACHER)
src/app/studio/tests/import/_lib/pdf.ts             browser-side PDF loading and thumbnails
src/app/studio/tests/import/_components/            ImportScreen, PagePicker, PageThumbnail, ImportProgress
src/app/studio/_components/ImportSummaryBanner.tsx  what the import left to do
```

## Error codes

Feature failures from the backend use stable codes, and each is translated in
all three catalogues under `root.tests.import.errors`:

`TOO_MANY_PAGES` · `TOO_MANY_SELECTED_PAGES` · `INVALID_PAGES` · `INVALID_PDF` ·
`QUOTA_EXCEEDED` · `EXTRACTION_FAILED` · `NO_QUESTIONS_FOUND` · `INTERRUPTED` ·
`DISABLED`

Adding a code to the backend without adding its key here leaves a teacher
looking at a raw identifier.

## When extraction is poor

1. **Check the page selection first.** Most disappointing imports are a slice
   that missed a column, a continuation page, or the answer key.
2. Then raise `AI_IMPORT_MODEL` server-side (`claude-haiku-4-5` by default;
   `claude-sonnet-5` reads messy scans noticeably better) and re-measure before
   anyone starts tuning prompts.

The metric that matters is not "did it produce a test" but **how many questions
the teacher had to retype**.
